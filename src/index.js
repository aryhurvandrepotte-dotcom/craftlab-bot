import { readFileSync } from 'node:fs';
import { Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import { handleNewMod, newModCommand } from './newmod.js';
import { VERIFY_BUTTON_ID } from './rules.js';
import { findVerifiedRole, setupVerification } from './setup.js';

const config = JSON.parse(readFileSync(new URL('../config.json', import.meta.url), 'utf8'));
const { DISCORD_TOKEN, GUILD_ID } = process.env;

if (!DISCORD_TOKEN) throw new Error('DISCORD_TOKEN manquant dans .env');
if (!GUILD_ID) throw new Error('GUILD_ID manquant dans .env');

const runSetup = process.argv.includes('--setup');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'newmod') {
    try {
      await handleNewMod(interaction, config);
    } catch (err) {
      console.error('[bot] Erreur /newmod :', err);
      const reply = { content: '❌ Could not post the announcement, check the bot logs.', flags: MessageFlags.Ephemeral };
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
    await c.application.commands.set([newModCommand.toJSON()], GUILD_ID)
      .then(() => console.log('[bot] Commande /newmod enregistrée'))
      .catch((err) => console.error('[bot] Impossible d\'enregistrer /newmod :', err.message));
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
