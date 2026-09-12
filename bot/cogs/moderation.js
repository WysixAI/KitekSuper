/**
 * ==============================================================================
 * COG: MODERATION & AUTOMOD (Anty-spam, Anty-linki i komendy moderatorskie)
 * ==============================================================================
 * 
 * Czyta z servers/[guildId].json:
 *   - moderation.enabled
 *   - moderation.antiLinks
 *   - moderation.antiSpam
 *   - moderation.maxMentions
 *   - moderation.logChannelId
 * ==============================================================================
 */

import {
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from 'discord.js';

export function getSlashCommands() {
  return [];
}

export default function setupModeration(client, context) {
  const { getServerConfig } = context;

  // 1. AUTOMOD - Anty-linki i anty-spam
  client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    const config = getServerConfig(message.guild.id);
    if (!config || !config.modules?.moderation || !config.moderation?.enabled) return;

    const mod = config.moderation;

    // A. Filtr anty-linków do innych serwerów discord (discord.gg / discord.com/invite)
    if (mod.antiLinks) {
      const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9]+/i;
      if (inviteRegex.test(message.content)) {
        if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
          try {
            await message.delete();
            const warning = await message.channel.send({
              content: `⚠️ <@${message.author.id}>, wysyłanie zaproszeń do innych serwerów jest zabronione przez system moderacji Kitek!`,
            });
            setTimeout(() => warning.delete().catch(() => {}), 5000);
            return;
          } catch {}
        }
      }
    }

    // B. Anty-spam oznaczeń (wielokrotne wzmianki)
    if (mod.antiSpam) {
      const maxMentions = mod.maxMentions || 5;
      if (message.mentions.users.size > maxMentions) {
        if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
          try {
            await message.delete();
            const warning = await message.channel.send({
              content: `🚨 <@${message.author.id}>, nie oznaczaj tylu osób na raz! Wiadomość została usunięta.`,
            });
            setTimeout(() => warning.delete().catch(() => {}), 5000);
          } catch {}
        }
      }
    }
  });

  // 2. KOMENDY MODERATORSKIE
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, guildId, guild } = interaction;
    if (!guildId || !guild) return;

    if (commandName === 'wyczysc') {
      const amount = interaction.options.getInteger('ilosc', true);
      try {
        const deleted = await interaction.channel.bulkDelete(amount, true);
        await interaction.reply({
          content: `🧹 Usunięto **${deleted.size}** wiadomości.`,
          ephemeral: true,
        });
      } catch (err) {
        await interaction.reply({
          content: `❌ Nie udało się usunąć wiadomości: ${err.message}`,
          ephemeral: true,
        });
      }
    }

    if (commandName === 'ostrzez') {
      const targetUser = interaction.options.getUser('uzytkownik', true);
      const reason = interaction.options.getString('powod', true);

      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('⚠️ Oficjalne Ostrzeżenie')
        .setDescription(`Użytkownik <@${targetUser.id}> otrzymał ostrzeżenie od moderatora <@${interaction.user.id}>.`)
        .addFields({ name: 'Powód', value: reason })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      try {
        await targetUser.send(`Otrzymałeś ostrzeżenie na serwerze **${guild.name}** za: ${reason}`);
      } catch {}
    }

    if (commandName === 'wycisz') {
      const targetUser = interaction.options.getUser('uzytkownik', true);
      const minutes = interaction.options.getInteger('minuty', true);
      const reason = interaction.options.getString('powod') || 'Brak podanego powodu';

      const member = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        return interaction.reply({ content: '❌ Nie znaleziono użytkownika na serwerze.', ephemeral: true });
      }

      try {
        await member.timeout(minutes * 60 * 1000, reason);
        await interaction.reply({
          content: `⏳ Użytkownik <@${targetUser.id}> został wyciszony na **${minutes} minut**. Powód: ${reason}`,
        });
      } catch (err) {
        await interaction.reply({ content: `❌ Błąd wyciszania: ${err.message}`, ephemeral: true });
      }
    }

    if (commandName === 'wyrzuc') {
      const targetUser = interaction.options.getUser('uzytkownik', true);
      const reason = interaction.options.getString('powod') || 'Brak powodu';
      const member = await guild.members.fetch(targetUser.id).catch(() => null);

      if (!member) {
        return interaction.reply({ content: '❌ Nie znaleziono użytkownika.', ephemeral: true });
      }

      try {
        await member.kick(reason);
        await interaction.reply({
          content: `👢 Użytkownik **${targetUser.tag}** został wyrzucony z serwera. Powód: ${reason}`,
        });
      } catch (err) {
        await interaction.reply({ content: `❌ Błąd: ${err.message}`, ephemeral: true });
      }
    }
  });
}
