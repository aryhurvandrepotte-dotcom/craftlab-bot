import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, MessageFlags,
  PermissionFlagsBits, SlashCommandBuilder,
} from 'discord.js';

export const newModCommand = new SlashCommandBuilder()
  .setName('newmod')
  .setDescription('Announce a new mod in the releases channel')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption((o) => o.setName('name').setDescription('Mod name').setRequired(true).setMaxLength(100))
  .addStringOption((o) => o.setName('link').setDescription('Download link (CurseForge, Modrinth…)').setRequired(true))
  .addAttachmentOption((o) => o.setName('logo').setDescription('Mod logo (image)').setRequired(true))
  .addStringOption((o) => o.setName('description').setDescription('Short description').setMaxLength(1000))
  .addStringOption((o) => o.setName('edition').setDescription('Minecraft edition').addChoices(
    { name: 'Java', value: 'Java' },
    { name: 'Bedrock', value: 'Bedrock' },
    { name: 'Java & Bedrock', value: 'Java & Bedrock' },
  ));

// Le logo est renvoyé comme pièce jointe du message : les liens d'images envoyées en commande expirent.
export function newModMessage({ name, link, logo, description, edition, author, ping }) {
  const ext = logo.name?.split('.').pop()?.toLowerCase() || 'png';
  const file = `logo.${ext}`;

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setAuthor({ name: author.name, iconURL: author.iconURL })
    .setTitle(`🧪 ${name}`)
    .setURL(link)
    .setDescription(description ?? `**${name}** is out now — go check it out!`)
    .setThumbnail(`attachment://${file}`)
    .setTimestamp();
  if (edition) embed.addFields({ name: 'Edition', value: edition, inline: true });

  const button = new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(link).setLabel('Download').setEmoji('📥');

  return {
    content: `${ping ? `${ping} ` : ''}🎉 **I just released a new mod: ${name}!**`,
    embeds: [embed],
    files: [{ attachment: logo.url, name: file }],
    components: [new ActionRowBuilder().addComponents(button)],
    allowedMentions: { roles: ping ? [ping.id] : [] },
  };
}

export async function handleNewMod(interaction, config) {
  const name = interaction.options.getString('name', true);
  const link = interaction.options.getString('link', true).trim();
  const logo = interaction.options.getAttachment('logo', true);

  if (!/^https?:\/\/\S+$/i.test(link)) {
    await interaction.reply({ content: '❌ The link must start with http:// or https://', flags: MessageFlags.Ephemeral });
    return;
  }
  if (!logo.contentType?.startsWith('image/')) {
    await interaction.reply({ content: '❌ The logo must be an image (PNG, JPG, GIF…).', flags: MessageFlags.Ephemeral });
    return;
  }

  const { guild } = interaction;
  const channel = guild.channels.cache.find((c) => c.type === ChannelType.GuildText && c.name.includes(config.newMod.channel));
  if (!channel) {
    await interaction.reply({ content: `❌ Channel "${config.newMod.channel}" not found.`, flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const message = await channel.send(newModMessage({
    name,
    link,
    logo,
    description: interaction.options.getString('description'),
    edition: interaction.options.getString('edition'),
    author: { name: interaction.member.displayName, iconURL: interaction.user.displayAvatarURL() },
    ping: guild.roles.cache.find((r) => r.name === config.newMod.pingRole),
  }));
  await interaction.editReply(`✅ Announced in ${channel}: ${message.url}`);
  console.log(`[bot] Nouveau mod annoncé : ${name}`);
}
