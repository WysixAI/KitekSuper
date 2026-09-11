/**
 * ==============================================================================
 * COG: LOGGING & AUDIT (Rejestrowanie zdarzeń na kanale logów)
 * ==============================================================================
 * 
 * Czyta z servers/[guildId].json:
 *   - logging.enabled
 *   - logging.channelId
 *   - logging.events (messageDelete, messageUpdate, memberLeave, etc.)
 * ==============================================================================
 */

import { EmbedBuilder } from 'discord.js';

export default function setupLogging(client, context) {
  const { getServerConfig } = context;

  // 1. ZDARZENIE: USUNIĘCIE WIADOMOŚCI
  client.on('messageDelete', async (message) => {
    if (!message.guild || message.author?.bot) return;

    const config = getServerConfig(message.guild.id);
    if (!config || !config.modules?.logging || !config.logging?.enabled) return;
    if (!config.logging.events?.messageDelete) return;

    const logChannelId = config.logging.channelId;
    if (!logChannelId) return;

    const logChannel = message.guild.channels.cache.get(logChannelId);
    if (!logChannel || !('send' in logChannel)) return;

    const embed = new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle('🗑️ Usunięto wiadomość')
      .addFields(
        { name: 'Autor', value: `<@${message.author?.id || 'nieznany'}> (${message.author?.tag || 'Nieznany'})`, inline: true },
        { name: 'Kanał', value: `<#${message.channelId}>`, inline: true },
        { name: 'Treść', value: message.content ? (message.content.length > 1000 ? message.content.slice(0, 1000) + '...' : message.content) : '*Brak tekstu (np. plik/embed)*' }
      )
      .setTimestamp();

    try {
      await logChannel.send({ embeds: [embed] });
    } catch {}
  });

  // 2. ZDARZENIE: EDYCJA WIADOMOŚCI
  client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const config = getServerConfig(oldMessage.guild.id);
    if (!config || !config.modules?.logging || !config.logging?.enabled) return;
    if (!config.logging.events?.messageUpdate) return;

    const logChannelId = config.logging.channelId;
    if (!logChannelId) return;

    const logChannel = oldMessage.guild.channels.cache.get(logChannelId);
    if (!logChannel || !('send' in logChannel)) return;

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle('✏️ Edytowano wiadomość')
      .addFields(
        { name: 'Autor', value: `<@${oldMessage.author?.id}>`, inline: true },
        { name: 'Kanał', value: `<#${oldMessage.channelId}>`, inline: true },
        { name: 'Przed edycją', value: oldMessage.content ? oldMessage.content.slice(0, 500) : '*brak*' },
        { name: 'Po edycji', value: newMessage.content ? newMessage.content.slice(0, 500) : '*brak*' }
      )
      .setTimestamp();

    try {
      await logChannel.send({ embeds: [embed] });
    } catch {}
  });

  // 3. ZDARZENIE: CZŁONEK OPUSZCZA SERWER
  client.on('guildMemberRemove', async (member) => {
    const config = getServerConfig(member.guild.id);
    if (!config || !config.modules?.logging || !config.logging?.enabled) return;
    if (!config.logging.events?.memberLeave) return;

    const logChannelId = config.logging.channelId;
    if (!logChannelId) return;

    const logChannel = member.guild.channels.cache.get(logChannelId);
    if (!logChannel || !('send' in logChannel)) return;

    const embed = new EmbedBuilder()
      .setColor(0x6b7280)
      .setTitle('👋 Członek opuścił serwer')
      .setDescription(`Użytkownik **${member.user.tag}** (<@${member.id}>) opuścił serwer.`)
      .setFooter({ text: `Pozostało członków: ${member.guild.memberCount}` })
      .setTimestamp();

    try {
      await logChannel.send({ embeds: [embed] });
    } catch {}
  });
}
