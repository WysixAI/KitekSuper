/**
 * ==============================================================================
 * COG: GUILD TRACKER (Wykrywanie dołączenia i konfiguracja serwerów)
 * ==============================================================================
 * 
 * Kluczowy moduł nasłuchujący:
 *   - client.on('guildCreate') -> Automatycznie tworzy plik servers/[guildId].json
 *     na bazie servers/default.json i natychmiast powiadamia Dashboard API!
 *   - client.on('guildDelete') -> Obsługuje usunięcie bota z serwera.
 * ==============================================================================
 */

import { ChannelType, EmbedBuilder } from 'discord.js';

export default function setupGuildTracker(client, context) {
  const { DASHBOARD_URL, getServerConfig, saveServerConfig, getDefaultConfig } = context;

  // 1. ZDARZENIE: BOT ZOSTAŁ DODANY NA NOWY SERWER
  client.on('guildCreate', async (guild) => {
    console.log('\n------------------------------------------------------------');
    console.log(`🎉 [COG: GUILD TRACKER] Wykryto dodanie bota do serwera!`);
    console.log(`📌 Nazwa: "${guild.name}" | ID: ${guild.id}`);
    console.log(`👥 Liczba osób: ${guild.memberCount} | Właściciel: ${guild.ownerId}`);
    console.log('------------------------------------------------------------\n');

    // A. Utwórz lub zaktualizuj plik JSON w folderze servers/
    let serverConfig = getServerConfig(guild.id);
    if (!serverConfig) {
      serverConfig = {
        ...getDefaultConfig(),
        guildId: guild.id,
        guildName: guild.name,
        joinedAt: new Date().toISOString(),
      };
      // Jeśli serwer ma systemowy kanał, ustaw go jako domyślny kanał powitań
      if (guild.systemChannelId) {
        serverConfig.welcomeSystem.channelId = guild.systemChannelId;
        serverConfig.welcomeSystem.channelName = guild.systemChannel?.name || 'systemowy';
      }
      saveServerConfig(guild.id, serverConfig);
      console.log(`💾 [SERVERS] Utworzono plik konfiguracyjny: servers/${guild.id}.json`);
    } else {
      serverConfig.guildName = guild.name;
      saveServerConfig(guild.id, serverConfig);
    }

    // B. Natychmiast powiadom Dashboard WWW (Vercel / Cloud Run)
    try {
      const notifyRes = await fetch(`${DASHBOARD_URL}/api/bot/guild-joined`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: guild.id,
          guildName: guild.name,
          memberCount: guild.memberCount,
          icon: guild.iconURL({ dynamic: true }),
          ownerId: guild.ownerId,
          joinedAt: new Date().toISOString(),
          channels: guild.channels.cache
            .filter((c) => c.type === ChannelType.GuildText || c.type === ChannelType.GuildVoice)
            .map((c) => ({
              id: c.id,
              name: c.name,
              type: c.type === ChannelType.GuildText ? 'text' : 'voice',
            })),
          roles: guild.roles.cache
            .filter((r) => r.name !== '@everyone')
            .map((r) => ({
              id: r.id,
              name: r.name,
              color: r.hexColor,
            })),
        }),
      });

      if (notifyRes.ok) {
        console.log(`✅ [DASHBOARD] Pomyślnie zsynchronizowano serwer ${guild.name} -> status: BOT DOŁĄCZYŁ!`);
      }
    } catch (err) {
      console.warn(`⚠️ [DASHBOARD SYNC] Nie udało się powiadomić dashboardu:`, err.message);
    }

    // C. Wyślij powitalną wiadomość na pierwszym dostępnym kanale
    try {
      const targetChannel =
        guild.systemChannel ||
        guild.channels.cache.find(
          (c) =>
            c.type === ChannelType.GuildText &&
            c.permissionsFor(guild.members.me)?.has(['SendMessages', 'EmbedLinks'])
        );

      if (targetChannel && 'send' in targetChannel) {
        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x10b981)
          .setTitle('🐱 Hej! Bot Kitek jest już na Twoim serwerze!')
          .setDescription(
            `Dziękujemy za zaproszenie bota na serwer **${guild.name}**!\n\n` +
            `Konfiguracja serwera została automatycznie zapisana w pliku \`servers/${guild.id}.json\`.\n` +
            `Możesz zarządzać wszystkimi funkcjami w naszym internetowym panelu:`
          )
          .addFields(
            {
              name: '🌐 Internetowy Panel Zarządzania',
              value: `[Przejdź do konfiguracji serwera](${DASHBOARD_URL})`,
              inline: false,
            },
            {
              name: '⚡ Szybki start',
              value: 'Wpisz `/pomoc`, aby poznać dostępne komendy bota.',
              inline: false,
            }
          )
          .setFooter({ text: `ID Serwera: ${guild.id} • Kitek Bot` })
          .setTimestamp();

        await targetChannel.send({ embeds: [welcomeEmbed] });
      }
    } catch (msgErr) {
      console.warn('⚠️ Brak permisji do wysłania wiadomości powitalnej na kanale.');
    }
  });

  // 2. ZDARZENIE: BOT ZOSTAŁ USUNIĘTY Z SERWERA
  client.on('guildDelete', async (guild) => {
    console.log(`⚠️ [COG: GUILD TRACKER] Usunięto bota z serwera: "${guild.name}" (${guild.id})`);
    try {
      await fetch(`${DASHBOARD_URL}/api/bot/guild-left`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: guild.id,
          guildName: guild.name,
        }),
      });
    } catch (err) {
      console.warn('⚠️ Błąd powiadamiania dashboardu o usunięciu bota:', err.message);
    }
  });
}
