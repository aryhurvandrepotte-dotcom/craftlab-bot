import { EmbedBuilder } from 'discord.js';

// Drapeau -> code langue Google Translate
export const FLAGS = {
  '🇫🇷': ['fr', 'Français'], '🇧🇪': ['fr', 'Français'], '🇨🇦': ['fr', 'Français'],
  '🇬🇧': ['en', 'English'], '🇺🇸': ['en', 'English'],
  '🇪🇸': ['es', 'Español'], '🇲🇽': ['es', 'Español'],
  '🇩🇪': ['de', 'Deutsch'], '🇮🇹': ['it', 'Italiano'],
  '🇵🇹': ['pt', 'Português'], '🇧🇷': ['pt', 'Português'],
  '🇳🇱': ['nl', 'Nederlands'], '🇵🇱': ['pl', 'Polski'], '🇷🇴': ['ro', 'Română'],
  '🇨🇿': ['cs', 'Čeština'], '🇸🇪': ['sv', 'Svenska'], '🇬🇷': ['el', 'Ελληνικά'],
  '🇷🇺': ['ru', 'Русский'], '🇺🇦': ['uk', 'Українська'], '🇹🇷': ['tr', 'Türkçe'],
  '🇸🇦': ['ar', 'العربية'], '🇲🇦': ['ar', 'العربية'], '🇩🇿': ['ar', 'العربية'],
  '🇮🇳': ['hi', 'हिन्दी'], '🇨🇳': ['zh-CN', '中文'], '🇯🇵': ['ja', '日本語'],
  '🇰🇷': ['ko', '한국어'], '🇻🇳': ['vi', 'Tiếng Việt'], '🇮🇩': ['id', 'Bahasa Indonesia'],
  '🇹🇭': ['th', 'ไทย'],
};

// Point d'accès public de Google Traduction (sans clé). Le texte du message est envoyé à Google.
export async function translate(text, target) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&dt=t'
    + `&tl=${encodeURIComponent(target)}&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
  const data = await res.json();
  return { text: data[0].map((part) => part[0]).join(''), from: data[2] };
}

// Une seule traduction par message et par langue (évite le spam si plusieurs personnes réagissent)
const done = new Set();

export async function handleFlagReaction(reaction, user) {
  if (user.bot) return;
  const flag = FLAGS[reaction.emoji.name];
  if (!flag) return;

  if (reaction.partial) await reaction.fetch();
  const { message } = reaction;
  if (message.partial) await message.fetch();
  const text = message.content?.trim();
  if (!text || message.author?.bot) return;

  const [lang, label] = flag;
  const key = `${message.id}:${lang}`;
  if (done.has(key)) return;
  done.add(key);

  try {
    const result = await translate(text.slice(0, 4000), lang);
    if (result.from === lang) return;   // déjà dans cette langue
    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865f2)
        .setAuthor({ name: message.member?.displayName ?? message.author.username, iconURL: message.author.displayAvatarURL() })
        .setDescription(result.text.slice(0, 4096))
        .setFooter({ text: `${reaction.emoji.name} ${label} · translated from ${result.from} · asked by ${user.username}` })],
      allowedMentions: { repliedUser: false, parse: [] },
    });
  } catch (err) {
    done.delete(key);
    throw err;
  }
}
