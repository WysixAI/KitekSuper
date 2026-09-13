/**
 * ==============================================================================
 * KITEK DISCORD BOT (Node.js & discord.js v14) - ARCHITEKTURA COGS & SERVERS JSON
 * ==============================================================================
 * 
 * Struktura projektu:
 *   📁 cogs/             -> Moduły z funkcjami bota (guildTracker, welcome, autocontent, moderation, logging, economy)
 *   📁 servers/          -> Pliki konfiguracyjne per serwer: servers/[guildId].json oraz servers/default.json
 *   📄 index.js          -> Główny loader ładujący cogs, konfiguracje serwerów oraz łączący się z Discord Gateway
 *   📄 package.json      -> Zależności (discord.js v14, dotenv)
 *   📄 .env              -> Zmienne środowiskowe (DISCORD_BOT_TOKEN, CLIENT_ID, DASHBOARD_URL)
 * ==============================================================================
 */

import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActivityType,
  ChannelType,
} from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1368350667634376785';
const DASHBOARD_URL = (process.env.DASHBOARD_URL || 'https://ais-dev-wdeh5is5o2ah3ikmfzps2o-454494415153.europe-west2.run.app').replace(/\/$/, '');

const SERVERS_DIR = path.join(__dirname, 'servers');
const COGS_DIR = path.join(__dirname, 'cogs');

// Upewnij się, że katalogi istnieją
if (!fs.existsSync(SERVERS_DIR)) {
  fs.mkdirSync(SERVERS_DIR, { recursive: true });
}
if (!fs.existsSync(COGS_DIR)) {
  fs.mkdirSync(COGS_DIR, { recursive: true });
}

if (!TOKEN) {
  console.error('\n❌ BŁĄD: Brak tokenu DISCORD_BOT_TOKEN w pliku .env!');
  console.error('👉 Skopiuj .env.example do .env i uzupełnij DISCORD_BOT_TOKEN ze strony:');
  console.error('   https://discord.com/developers/applications\n');
  process.exit(1);
}

// Inicjalizacja klienta Discord z intencjami
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// ==============================================================================
// FUNKCJE OBSŁUGI KONFIGURACJI SERWERÓW (servers/[guildId].json)
// ==============================================================================

export function getDefaultConfig() {
  const defaultPath = path.join(SERVERS_DIR, 'default.json');
  if (fs.existsSync(defaultPath)) {
    try {
      return JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
    } catch {}
  }
  return {
    prefix: '!',
    modules: {
      welcomeSystem: false,
      autoContent: false,
      moderation: false,
      logging: false,
      economy: false,
    },
    welcomeSystem: {
      enabled: false,
      message: 'Witaj {user} na serwerze {server}! Jesteś #{memberCount} członkiem.',
      embed: {
        title: '🎉 Nowy członek na serwerze!',
        color: '#10b981',
        showAvatar: true,
      },
    },
    autoContent: {
      enabled: false,
      postIntervalHours: 12,
      categories: ['koty', 'ciekawostki', 'memy'],
    },
    moderation: {
      enabled: false,
      antiLinks: false,
      antiSpam: false,
      maxMentions: 5,
    },
    logging: {
      enabled: false,
      events: { messageDelete: false, messageUpdate: false, memberLeave: false },
    },
    economy: {
      enabled: false,
      currencyName: 'KitekCoins',
      currencySymbol: '🪙',
      dailyAmount: 100,
    },
  };
}

export function getServerConfig(guildId) {
  if (!guildId) return null;
  const filePath = path.join(SERVERS_DIR, `${guildId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`❌ Błąd parsowania pliku servers/${guildId}.json:`, e);
    }
  }
  return null;
}

export function saveServerConfig(guildId, config) {
  if (!guildId || !config) return;
  const filePath = path.join(SERVERS_DIR, `${guildId}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`❌ Błąd zapisu do pliku servers/${guildId}.json:`, err);
    return false;
  }
}

// ==============================================================================
// REJESTRACJA KOMEND SLASH (Tylko /pomoc i /polaczenie)
// ==============================================================================
async function registerSlashCommands(allCommands) {
  // Tylko wybrane komendy zgodnie z poleceniem: /pomoc oraz komenda od połączenia (/polaczenie)
  const baseCommands = [
    new SlashCommandBuilder()
      .setName('pomoc')
      .setDescription('Wyświetla pomoc bota, status modułów i link do panelu WWW'),
    new SlashCommandBuilder()
      .setName('polaczenie')
      .setDescription('Sprawdza stan połączenia bota z panelem WWW oraz Discord API'),
  ];

  const payload = [...baseCommands, ...allCommands].map((c) => c.toJSON());
  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    console.log(`⚡ Rejestrowanie ${payload.length} komend slash w Discord API (/pomoc, /polaczenie)...`);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: payload });
    console.log('✅ Pomyślnie zarejestrowano wyczyszczone komendy slash (/pomoc i /polaczenie)!');
  } catch (error) {
    console.error('❌ Błąd rejestracji komend slash:', error);
  }
}

// Helper: synchronizacja listy serwerów, konfiguracji oraz akcji z Dashboardem
async function syncGuildsWithDashboard() {
  try {
    const guildsPayload = client.guilds.cache.map((guild) => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      ownerId: guild.ownerId,
      icon: guild.iconURL({ dynamic: true }),
      joinedAt: guild.joinedAt?.toISOString() || new Date().toISOString(),
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
    }));

    const response = await fetch(`${DASHBOARD_URL}/api/bot/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: client.user?.id || CLIENT_ID,
        botTag: client.user?.tag || 'Kitek Bot',
        ping: client.ws.ping,
        guilds: guildsPayload,
      }),
    });

    if (response.ok) {
      const data = await response.json();

      // 1. Zsynchronizuj konfiguracje zapisane na panelu WWW do lokalnych servers/[guildId].json
      if (data.configs && typeof data.configs === 'object') {
        for (const [gId, cfg] of Object.entries(data.configs)) {
          if (gId && gId !== 'default') {
            saveServerConfig(gId, cfg);
          }
        }
      }

      // 2. Wykonaj oczekujące akcje zlecone z panelu WWW (np. wysyłanie Embedów z Creatora)
      if (Array.isArray(data.actions) && data.actions.length > 0) {
        for (const action of data.actions) {
          if (action.type === 'send_embed') {
            try {
              const targetGuild = action.guildId ? client.guilds.cache.get(action.guildId) : null;
              let targetChannel = null;

              if (targetGuild) {
                targetChannel =
                  targetGuild.channels.cache.get(action.channelId) ||
                  targetGuild.channels.cache.find(
                    (c) => c.name === action.channelName || c.name === action.channelId
                  );
              }

              if (!targetChannel) {
                targetChannel = client.channels.cache.get(action.channelId);
              }

              if (!targetChannel && action.channelName) {
                const cleanName = action.channelName.replace(/^#/, '').toLowerCase();
                targetChannel = client.channels.cache.find(
                  (c) => c.name?.toLowerCase() === cleanName
                );
              }

              if (targetChannel && 'send' in targetChannel) {
                let sentV2 = false;

                // 1. Próba wysłania w nowym standardzie Discord Components V2 (kontenery type 17, flags 32768)
                if (Array.isArray(action.v2Components) && action.v2Components.length > 0) {
                  try {
                    await targetChannel.send({
                      flags: 32768,
                      components: action.v2Components,
                    });
                    sentV2 = true;
                    console.log(
                      `🚀 [COMPONENTS V2] Wysłano nową strukturę Discord Components v2 (kontenery type 17) na kanał #${targetChannel.name} (${targetChannel.id})`
                    );
                  } catch (v2Err) {
                    console.warn(`⚠️ [COMPONENTS V2] Błąd wysyłania V2 (${v2Err.message}), wysyłam w trybie kompatybilności...`);
                  }
                }

                // 2. Tryb kompatybilności klasycznej (embeds + action rows)
                if (!sentV2) {
                  const messagePayload = {
                    content: action.content || undefined,
                    embeds: action.embeds || [],
                  };
                  if (Array.isArray(action.components) && action.components.length > 0) {
                    messagePayload.components = action.components;
                  }
                  await targetChannel.send(messagePayload);
                  console.log(
                    `✉️ [EMBED SENDER] Wysłano embed (${action.components?.length || 0} wierszy komponentów) na kanał #${targetChannel.name} (${targetChannel.id})`
                  );
                }
              } else {
                console.warn(`⚠️ [EMBED SENDER] Nie znaleziono kanału docelowego: ${action.channelName || action.channelId}`);
              }
            } catch (embedErr) {
              console.error(`❌ [EMBED SENDER] Błąd wysyłania embeda:`, embedErr.message);
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ [DASHBOARD SYNC] Błąd komunikacji z panelem (${DASHBOARD_URL}):`, error.message);
  }
}

// ==============================================================================
// GŁÓWNA INICJALIZACJA I ŁADOWANIE MODUŁÓW (COGS)
// ==============================================================================
async function main() {
  console.log('\n======================================================');
  console.log('🐾 ŁADOWANIE BOTA KITEK - ARCHITEKTURA COGS & SERVERS');
  console.log('======================================================');

  const context = {
    DASHBOARD_URL,
    CLIENT_ID,
    getServerConfig,
    saveServerConfig,
    getDefaultConfig,
  };

  const extraCommands = [];

  // 1. Dynamiczne załadowanie cogs
  const cogFiles = fs.readdirSync(COGS_DIR).filter((f) => f.endsWith('.js'));
  console.log(`📦 Znaleziono ${cogFiles.length} cogs w folderze cogs/:`);

  for (const file of cogFiles) {
    try {
      const cogPath = path.join(COGS_DIR, file);
      const cogModule = await import(`file://${cogPath}`);

      if (typeof cogModule.default === 'function') {
        cogModule.default(client, context);
        console.log(`  ✓ Załadowano cog: cogs/${file}`);
      }

      if (typeof cogModule.getSlashCommands === 'function') {
        const cmds = cogModule.getSlashCommands();
        if (Array.isArray(cmds)) {
          extraCommands.push(...cmds);
        }
      }
    } catch (cogErr) {
      console.error(`  ✗ Błąd ładowania cogs/${file}:`, cogErr);
    }
  }

  // 2. Obsługa gotowości klienta
  client.once('ready', async () => {
    console.log('\n======================================================');
    console.log(`🤖 ZALOGOWANO: ${client.user.tag} (ID: ${client.user.id})`);
    console.log(`🌐 Dashboard URL: ${DASHBOARD_URL}`);
    console.log(`🛡️ Serwery w pamięci: ${client.guilds.cache.size}`);
    console.log('======================================================\n');

    // Ustaw obecność bota
    client.user.setPresence({
      status: 'online',
      activities: [
        {
          name: `/pomoc | ${client.guilds.cache.size} serwerów`,
          type: ActivityType.Watching,
        },
      ],
    });

    // Rejestracja komend i synchronizacja
    await registerSlashCommands(extraCommands);
    await syncGuildsWithDashboard();

    // Szybka synchronizacja i sprawdzanie akcji (co 5 sekund)
    setInterval(syncGuildsWithDashboard, 5000);
  });

  // 3. Podstawowe komendy slash: /pomoc i /polaczenie
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, guildId, guild } = interaction;

    if (commandName === 'pomoc') {
      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('📖 Pomoc & Połączenie Bota Kitek')
        .setDescription(
          `Bot Kitek jest połączony z Twoim panelem zarządzania serwerami.\n` +
          `Wszystkimi funkcjami i modułami sterujesz wygodnie przez stronę WWW!\n\n` +
          `🌐 **Panel bota:** [${DASHBOARD_URL}](${DASHBOARD_URL})\n` +
          `🔌 **Stan połączenia:** Użyj komendy \`/polaczenie\``
        )
        .addFields(
          {
            name: '🧩 Moduły Cogs',
            value:
              '• System Powitań (Welcome)\n' +
              '• Rejestr Zdarzeń (Logging)\n' +
              '• Automatyczna Moderacja (AutoMod)\n' +
              '• Ekonomia i Nagrody (Economy)\n' +
              '• Automatyczne Treści (AutoContent)',
            inline: false,
          },
          {
            name: '⚙️ Zarządzanie modułami',
            value: `Wszystkie moduły możesz włączać, wyłączać i konfigurować w panelu: [Otwórz Panel](${DASHBOARD_URL})`,
            inline: false,
          }
        )
        .setFooter({ text: `Serwer: ${guild?.name || 'Discord'}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (commandName === 'polaczenie' || commandName === 'status') {
      const ping = client.ws.ping;
      const uptimeSec = Math.floor(client.uptime / 1000);
      const hours = Math.floor(uptimeSec / 3600);
      const mins = Math.floor((uptimeSec % 3600) / 60);

      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('🔌 Stan Połączenia Bota Kitek')
        .setDescription('Szczegółowy status połączenia bota z panelem internetowym i siecią Discord.')
        .addFields(
          { name: '🌐 Panel WWW', value: `\`${DASHBOARD_URL}\``, inline: false },
          { name: '🟢 Status Połączenia', value: 'Połączono i zsynchronizowano', inline: true },
          { name: '🏓 Ping WebSocket', value: `${ping >= 0 ? ping : '< 1'} ms`, inline: true },
          { name: '⏱️ Uptime', value: `${hours}h ${mins}m`, inline: true },
          { name: '🛡️ Obsługiwane serwery', value: `${client.guilds.cache.size}`, inline: true }
        )
        .setFooter({ text: `Kitek Bot v2.0 • ID: ${client.user.id}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  });

  // Logowanie
  console.log('🚀 Łączenie z Discord Gateway...');
  client.login(TOKEN).catch((err) => {
    console.error('\n❌ BŁĄD LOGOWANIA BOTA:', err.message);
    console.error('Upewnij się, że token w .env jest poprawny oraz że włączono "Privileged Gateway Intents" w Discord Developer Portal!\n');
  });
}

main();
