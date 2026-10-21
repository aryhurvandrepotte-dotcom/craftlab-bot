import { ChannelType, MessageFlags, SlashCommandBuilder } from 'discord.js';

export const inviteCommand = new SlashCommandBuilder()
  .setName('invite')
  .setDescription('Get the Craft Lab invite link to share with your friends');

// Un seul lien permanent (sans expiration ni limite) vers #welcome, réutilisé à chaque fois
export async function getPermanentInvite(guild, config) {
  const channel = guild.channels.cache.find((c) => c.type === ChannelType.GuildText && c.name.includes(config.invite.channel))
    ?? guild.rulesChannel;
  const invites = await guild.invites.fetch();
  const existing = invites.find((i) => i.inviterId === guild.client.user.id && i.channelId === channel.id
    && i.maxAge === 0 && i.maxUses === 0 && !i.temporary);
  return existing ?? channel.createInvite({ maxAge: 0, maxUses: 0, unique: true, reason: 'Lien permanent pour /invite' });
}

export function inviteText(url) {
  return [
    '🧪 Join **Craft Lab**, my Minecraft mods server!',
    'Java (Fabric) mods & Bedrock add-ons, early releases, bug reports and custom mod requests.',
    url,
  ].join('\n');
}

export async function handleInvite(interaction, config) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const invite = await getPermanentInvite(interaction.guild, config);
  await interaction.editReply([
    `🔗 **Invite link:** ${invite.url}`,
    '',
    'Copy this message and send it to your friends:',
    '```',
    inviteText(invite.url).replaceAll('**', ''),
    '```',
  ].join('\n'));
}
