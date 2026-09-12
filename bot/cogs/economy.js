/**
 * ==============================================================================
 * COG: ECONOMY (Lokalna ekonomia, waluta serwerowa i nagroda /daily)
 * ==============================================================================
 * 
 * Czyta z servers/[guildId].json:
 *   - economy.enabled
 *   - economy.currencyName (np. "KitekCoins")
 *   - economy.currencySymbol (np. "🪙")
 *   - economy.dailyAmount (np. 100)
 * ==============================================================================
 */

import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

// Prosta pamięć stanu ekonomii serwerów (w pamięci / rozszerzalna)
const economyBalances = new Map(); // key: `${guildId}:${userId}` -> balance
const lastDailyClaim = new Map();  // key: `${guildId}:${userId}` -> timestamp

export function getSlashCommands() {
  return [];
}

export default function setupEconomy(client, context) {
  const { getServerConfig } = context;

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, guildId, user } = interaction;
    if (!guildId) return;

    const config = getServerConfig(guildId);
    if (!config || !config.modules?.economy || !config.economy?.enabled) {
      if (['daily', 'portfel', 'przelej'].includes(commandName)) {
        return interaction.reply({
          content: '⚠️ Moduł ekonomii jest wyłączony w konfiguracji tego serwera (`servers/[id].json`).',
          ephemeral: true,
        });
      }
      return;
    }

    const eco = config.economy;
    const currency = eco.currencySymbol || '🪙';
    const currencyName = eco.currencyName || 'KitekCoins';

    // 1. /daily
    if (commandName === 'daily') {
      const key = `${guildId}:${user.id}`;
      const lastClaim = lastDailyClaim.get(key) || 0;
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (now - lastClaim < oneDay) {
        const remainingHours = Math.ceil((oneDay - (now - lastClaim)) / (60 * 60 * 1000));
        return interaction.reply({
          content: `⏳ Odebrałeś już swoje dzisiejsze ${currencyName}! Wróć za około **${remainingHours} godz.**`,
          ephemeral: true,
        });
      }

      const reward = eco.dailyAmount || 100;
      const currentBal = economyBalances.get(key) || 0;
      economyBalances.set(key, currentBal + reward);
      lastDailyClaim.set(key, now);

      const embed = new EmbedBuilder()
        .setColor(0xf59e0b)
        .setTitle('🎁 Codzienna Nagroda Odebrana!')
        .setDescription(`Otrzymałeś **+${reward} ${currency} ${currencyName}** do swojego portfela!`)
        .addFields({ name: 'Aktualny bilans', value: `${currentBal + reward} ${currency}`, inline: true })
        .setFooter({ text: 'Kitek Economy System' });

      await interaction.reply({ embeds: [embed] });
    }

    // 2. /portfel
    if (commandName === 'portfel') {
      const targetUser = interaction.options.getUser('uzytkownik') || user;
      const key = `${guildId}:${targetUser.id}`;
      const balance = economyBalances.get(key) || 0;

      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle(`👛 Portfel: ${targetUser.username}`)
        .setDescription(`Stan konta: **${balance} ${currency} ${currencyName}**`)
        .setFooter({ text: 'Wpisz /daily aby odebrać darmowe monety' });

      await interaction.reply({ embeds: [embed] });
    }

    // 3. /przelej
    if (commandName === 'przelej') {
      const recipient = interaction.options.getUser('odbiorca', true);
      const amount = interaction.options.getInteger('kwota', true);

      if (recipient.id === user.id) {
        return interaction.reply({ content: '❌ Nie możesz przelać monet samemu sobie!', ephemeral: true });
      }

      const senderKey = `${guildId}:${user.id}`;
      const recipientKey = `${guildId}:${recipient.id}`;
      const senderBal = economyBalances.get(senderKey) || 0;

      if (senderBal < amount) {
        return interaction.reply({
          content: `❌ Niewystarczająca ilość monet! Posiadasz tylko **${senderBal} ${currency}**.`,
          ephemeral: true,
        });
      }

      const recipientBal = economyBalances.get(recipientKey) || 0;
      economyBalances.set(senderKey, senderBal - amount);
      economyBalances.set(recipientKey, recipientBal + amount);

      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('💸 Przelew Zakończony Sukcesem')
        .setDescription(
          `<@${user.id}> przelał **${amount} ${currency} ${currencyName}** dla <@${recipient.id}>!`
        );

      await interaction.reply({ embeds: [embed] });
    }
  });
}
