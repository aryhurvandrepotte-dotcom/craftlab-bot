import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

export const VERIFY_BUTTON_ID = 'craftlab-verify';

// Mentionne un salon par un morceau de son nom (les noms contiennent des emojis : "🐛・bug-reports")
function channel(guild, part) {
  return guild.channels.cache.find((c) => c.name.includes(part))?.toString() ?? `#${part}`;
}

export function rulesMessage(guild) {
  const bugs = channel(guild, 'bug-reports');
  const requests = channel(guild, 'mod-requests');
  const tickets = channel(guild, 'tickets');

  const en = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('🇬🇧 Craft Lab — Server rules')
    .setDescription([
      '**1.** Be respectful — no harassment, hate speech or discrimination.',
      '**2.** No spam, flood or advertising (DMs included).',
      '**3.** Keep everything SFW and post in the right channels.',
      '**4.** No piracy, cracked clients, cheats or malicious files.',
      '**5.** Never re-upload my mods or claim them as yours.',
      `**6.** Bugs go in ${bugs}, mod ideas in ${requests}.`,
      '**7.** Follow the [Discord Terms](https://discord.com/terms) and [Community Guidelines](https://discord.com/guidelines).',
      `**8.** Staff decisions are final — disagree? Open a ticket in ${tickets}.`,
      '',
      '✅ **Click the button below to accept the rules and unlock the server.**',
    ].join('\n'));

  const fr = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🇫🇷 Craft Lab — Règlement du serveur')
    .setDescription([
      '**1.** Respecte tout le monde — pas de harcèlement, de propos haineux ni de discrimination.',
      '**2.** Pas de spam, de flood ni de pub (en MP compris).',
      '**3.** Contenu SFW uniquement, et poste dans les bons salons.',
      '**4.** Pas de piratage, de clients crackés, de cheats ni de fichiers malveillants.',
      '**5.** Ne repartage jamais mes mods et ne les fais pas passer pour les tiens.',
      `**6.** Les bugs vont dans ${bugs}, les idées de mods dans ${requests}.`,
      '**7.** Respecte les [Conditions d\'utilisation](https://discord.com/terms) et les [Règles de la communauté](https://discord.com/guidelines) de Discord.',
      `**8.** Les décisions du staff sont finales — pas d'accord ? Ouvre un ticket dans ${tickets}.`,
      '',
      '✅ **Clique sur le bouton ci-dessous pour accepter le règlement et débloquer le serveur.**',
    ].join('\n'));

  const button = new ButtonBuilder()
    .setCustomId(VERIFY_BUTTON_ID)
    .setStyle(ButtonStyle.Success)
    .setEmoji('✅')
    .setLabel('Verify / Je vérifie');

  return { embeds: [en, fr], components: [new ActionRowBuilder().addComponents(button)] };
}
