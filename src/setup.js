import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { rulesMessage, VERIFY_BUTTON_ID } from './rules.js';

const { ViewChannel } = PermissionFlagsBits;

export function findVerifiedRole(guild, config) {
  return guild.roles.cache.find((r) => r.name === config.verifiedRole.name);
}

export function findRulesChannel(guild, config) {
  return guild.rulesChannel
    ?? guild.channels.cache.find((c) => c.type === ChannelType.GuildText && c.name.includes(config.rulesChannel));
}

// Une catégorie/un salon déjà privé (ex. STAFF) n'est pas touché : le rôle Verified ne doit pas l'ouvrir.
function isPrivate(channel, everyone, role) {
  const everyoneDenied = channel.permissionOverwrites.cache.get(everyone.id)?.deny.has(ViewChannel);
  const roleAllowed = channel.permissionOverwrites.cache.get(role.id)?.allow.has(ViewChannel);
  return everyoneDenied && !roleAllowed;
}

async function hideFromUnverified(channel, everyone, role) {
  await channel.permissionOverwrites.edit(everyone, { ViewChannel: false }, { reason: 'Vérification Craft Lab' });
  await channel.permissionOverwrites.edit(role, { ViewChannel: true }, { reason: 'Vérification Craft Lab' });
}

export async function setupVerification(guild, config) {
  await guild.channels.fetch();
  await guild.roles.fetch();
  const everyone = guild.roles.everyone;
  const me = guild.members.me;

  const missing = ['ManageRoles', 'ManageChannels', 'ViewChannel', 'SendMessages', 'EmbedLinks', 'ReadMessageHistory']
    .filter((p) => !me.permissions.has(PermissionFlagsBits[p]));
  if (missing.length) throw new Error(`Permissions serveur manquantes pour le bot : ${missing.join(', ')}`);

  // Discord refuse de rendre privés les salons du processus d'accueil, même désactivé :
  // on le coupe et on vide ses salons par défaut et ses questions.
  try {
    const onboarding = await guild.fetchOnboarding();
    if (onboarding.enabled || onboarding.defaultChannels.size || onboarding.prompts.size) {
      await guild.editOnboarding({
        enabled: false, defaultChannels: [], prompts: [], reason: 'Remplacé par la vérification',
      });
      console.log('[setup] Processus d\'accueil désactivé et vidé');
    }
  } catch (err) {
    console.warn(`[setup] Impossible de couper le processus d'accueil (${err.message}) : désactive-le à la main si la suite échoue.`);
  }

  let role = findVerifiedRole(guild, config);
  if (!role) {
    role = await guild.roles.create({
      name: config.verifiedRole.name,
      colors: { primaryColor: config.verifiedRole.color },
      permissions: [],
      reason: 'Vérification Craft Lab',
    });
    console.log(`[setup] Rôle ${role.name} créé`);
  }

  // Le bot garde la vue sur les salons qu'il cache grâce au rôle Verified
  if (!me.roles.cache.has(role.id)) await me.roles.add(role, 'Le bot doit voir les salons vérifiés');

  const rules = findRulesChannel(guild, config);
  if (!rules) throw new Error(`Salon du règlement introuvable (nom contenant "${config.rulesChannel}")`);

  // Salons qui restent visibles sans vérification (le guide du serveur en a besoin), toujours en lecture seule.
  // Ils ne sont jamais cachés, même un instant : Discord refuse de cacher un salon utilisé par le guide.
  const publicChannels = [rules, ...guild.channels.cache.filter((c) => c.type !== ChannelType.GuildCategory
    && config.publicChannels.some((part) => c.name.includes(part))).values()];
  const isPublic = (c) => publicChannels.some((p) => p.id === c.id);

  const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory);
  for (const category of categories.values()) {
    if (isPrivate(category, everyone, role)) {
      console.log(`[setup] ${category.name} : déjà privée, ignorée`);
      continue;
    }
    // Côté API, modifier une catégorie ne resynchronise pas ses salons : on mémorise lesquels l'étaient.
    const children = [...category.children.cache.values()].filter((c) => !isPublic(c));
    const synced = children.filter((c) => c.permissionsLocked);

    await hideFromUnverified(category, everyone, role);
    for (const child of children) {
      if (synced.includes(child)) await child.lockPermissions();
      else if (!isPrivate(child, everyone, role)) await hideFromUnverified(child, everyone, role);
    }
    console.log(`[setup] ${category.name} : cachée aux non-vérifiés (${children.length} salons)`);
  }

  const orphans = guild.channels.cache.filter((c) => !c.parentId && c.type !== ChannelType.GuildCategory && !isPublic(c));
  for (const channel of orphans.values()) {
    if (!isPrivate(channel, everyone, role)) await hideFromUnverified(channel, everyone, role);
  }

  for (const channel of publicChannels) {
    await channel.permissionOverwrites.edit(everyone, { ViewChannel: true, SendMessages: false }, { reason: 'Vérification Craft Lab' });
  }
  console.log(`[setup] Visibles sans vérification : ${publicChannels.map((c) => `#${c.name}`).join(', ')}`);
  await rules.permissionOverwrites.edit(me, {
    ViewChannel: true, SendMessages: true, EmbedLinks: true, ReadMessageHistory: true,
  }, { reason: 'Le bot poste le règlement' });

  const payload = rulesMessage(guild);
  const messages = await rules.messages.fetch({ limit: 50 });
  const panel = messages.find((m) => m.author.id === me.id
    && m.components.some((row) => row.components.some((c) => c.customId === VERIFY_BUTTON_ID)));
  if (panel) {
    await panel.edit(payload);
    console.log(`[setup] Règlement mis à jour dans #${rules.name}`);
  } else {
    await rules.send(payload);
    console.log(`[setup] Règlement posté dans #${rules.name}`);
  }
}
