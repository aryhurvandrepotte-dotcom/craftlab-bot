import { readFileSync } from 'node:fs';
import {
  ApplicationFlags, Client, Events, GatewayIntentBits, MessageFlags, Partials, REST, Routes,
} from 'discord.js';
import { handleInvite, inviteCommand } from './invite.js';
import { handleFlagReaction } from './translate.js';
import { handleNewMod, newModCommand } from './newmod.js';
import { VERIFY_BUTTON_ID } from './rules.js';
import { findVerifiedRole, setupVerification } from './setup.js';

const config = JSON.parse(readFileSync(new URL('../config.json', import.meta.url), 'utf8'));
const { DISCORD_TOKEN, GUILD_ID } = process.env;

if (!DISCORD_TOKEN) throw new Error('DISCORD_TOKEN manquant dans .env');
if (!GUILD_ID) throw new Error('GUILD_ID manquant dans .env');

const runSetup = process.argv.includes('--setup');

// La traduction par drapeau doit lire le texte des messages : "Message Content Intent" doit être activé
// dans le Developer Portal. Sinon Discord refuse la connexion, donc on démarre sans la traduction.
const { flags } = await new REST().setToken(DISCORD_TOKEN).get(Routes.currentApplication());
const canReadMessages = Boolean(flags & (ApplicationFlags.GatewayMessageContent | ApplicationFlags.GatewayMessageContentLimited));
if (!canReadMessages) console.warn('[bot] Message Content Intent désactivé : traduction par drapeau désactivée');

const client = new Client({
  intents: canReadMessages
    ? [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.MessageContent]
    : [GatewayIntentBits.Guilds],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

client.on(Events.MessageReactionAdd, (reaction, user) => {
  handleFlagReaction(reaction, user).catch((err) => console.error('[bot] Erreur de traduction :', err.message));
});

const commands = {
  newmod: handleNewMod,
  invite: handleInvite,
};

client.on(Events.InteractionCreate, async (interaction) => {
  const handler = interaction.isChatInputCommand() && commands[interaction.commandName];
  if (handler) {
    try {
      await handler(interaction, config);
    } catch (err) {
      console.error(`[bot] Erreur /${interaction.commandName} :`, err);
      const reply = { content: '❌ Something went wrong, check the bot logs.', flags: MessageFlags.Ephemeral };
      await (interaction.deferred || interaction.replied ? interaction.editReply(reply) : interaction.reply(reply)).catch(() => {});
    }
    return;
  }

  if (!interaction.isButton() || interaction.customId !== VERIFY_BUTTON_ID) return;

  try {
    const role = findVerifiedRole(interaction.guild, config);
    if (!role) {
      await interaction.reply({
        content: '⚠️ Verification is not set up yet. / La vérification n\'est pas encore configurée.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (interaction.member.roles.cache.has(role.id)) {
      await interaction.reply({
        content: '✅ You are already verified! / Tu es déjà vérifié !',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.member.roles.add(role, 'A accepté le règlement');
    await interaction.reply({
      content: '🎉 **Welcome to Craft Lab!** All channels are now unlocked.\n'
        + '🎉 **Bienvenue sur Craft Lab !** Tous les salons sont maintenant débloqués.',
      flags: MessageFlags.Ephemeral,
    });
    console.log(`[bot] ${interaction.user.tag} vérifié`);
  } catch (err) {
    console.error('[bot] Erreur de vérification :', err);
    if (!interaction.replied) {
      await interaction.reply({
        content: '❌ Something went wrong, please ask a moderator. / Une erreur est survenue, demande à un modérateur.',
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
  }
});

client.once(Events.ClientReady, async (c) => {
  console.log(`[bot] Connecté en tant que ${c.user.tag}`);
  if (!runSetup) {
    // Commandes du serveur uniquement : elles apparaissent tout de suite (les globales mettent jusqu'à 1 h)
    await c.application.commands.set([newModCommand.toJSON(), inviteCommand.toJSON()], GUILD_ID)
      .then(() => console.log('[bot] Commandes /newmod et /invite enregistrées'))
      .catch((err) => console.error('[bot] Impossible d\'enregistrer les commandes :', err.message));
    return;
  }

  try {
    const guild = c.guilds.cache.get(GUILD_ID) ?? await c.guilds.fetch(GUILD_ID);
    await setupVerification(guild, config);
    console.log('[setup] Terminé ✅');
  } catch (err) {
    console.error('[setup] Échec :', err);
    process.exitCode = 1;
  }
  await c.destroy();
});

client.login(DISCORD_TOKEN);
