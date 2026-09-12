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
      welcomeSystem: true,
      autoContent: true,
      moderation: true,
      logging: true,
      economy: true,
    },
    welcomeSystem: {
      enabled: true,
      message: 'Witaj {user} na serwerze {server}! Jesteś #{memberCount} członkiem.',
      embed: {
        title: '🎉 Nowy członek na serwerze!',
        color: '#10b981',
        showAvatar: true,
      },
    },
    autoContent: {
      enabled: true,
      postIntervalHours: 12,
      categories: ['koty', 'ciekawostki', 'memy'],
    },
    moderation: {
      enabled: true,
      antiLinks: true,
      antiSpam: true,
      maxMentions: 5,
    },
    logging: {
      enabled: true,
      events: { messageDelete: true, messageUpdate: true, memberLeave: true },
    },
    economy: {
      enabled: true,
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
// REJESTRACJA KOMEND SLASH ZE WSZYSTKICH COGS
// ==============================================================================
async function registerSlashCommands(allCommands) {
  const baseCommands = [
    new SlashCommandBuilder()
      .setName('pomoc')
      .setDescription('Wyświetla listę funkcji bota, aktywne cogs i link do panelu WWW'),
    new SlashCommandBuilder()
      .setName('status')
      .setDescription('Sprawdza ping WebSocket, czas działania i status połączenia z panelem'),
    new SlashCommandBuilder()
      .setName('panel')
      .setDescription('Zwraca bezpośredni link do internetowego dashboardu Kitek'),
    new SlashCommandBuilder()
      .setName('serwer-config')
      .setDescription('Pokazuje podsumowanie aktywnej konfiguracji servers/[guildId].json'),
  ];

  const payload = [...baseCommands, ...allCommands].map((c) => c.toJSON());
  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    console.log(`⚡ Rejestrowanie ${payload.length} globalnych komend slash w Discord API...`);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: payload });
    console.log('✅ Pomyślnie zarejestrowano wszystkie komendy slash ze wszystkich cogs!');
  } catch (error) {
    console.error('❌ Błąd rejestracji komend slash:', error);
  }
}

// Helper: synchronizacja listy serwerów z Dashboardem (Vercel / Cloud Run)
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
      console.log(`📡 [DASHBOARD SYNC] Zsynchronizowano ${guildsPayload.length} serwerów z panelem Kitek (${DASHBOARD_URL}).`);
    }
  } catch (error) {
    console.warn(`⚠️ [DASHBOARD SYNC] Nie udało się połączyć z panelem (${DASHBOARD_URL})`);
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

    // Heartbeat co 60 sekund
    setInterval(syncGuildsWithDashboard, 60000);
  });

  // 3. Podstawowe komendy slash
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, guildId, guild } = interaction;

    if (commandName === 'pomoc') {
      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('📖 Pomoc & Moduły (Cogs) Bota Kitek')
        .setDescription(
          `Bot Kitek działa w architekturze modułowej **Cogs**, a każdy serwer posiada niezależny plik konfiguracyjny w folderze \`servers/\`.\n\n` +
          `Zarządzaj funkcjami przez internetowy panel:\n**${DASHBOARD_URL}**`
        )
        .addFields(
          { name: '📦 Aktywne Cogs', value: '• `guildTracker` (dołączenia)\n• `welcome` (powitania)\n• `autocontent` (ciekawostki i memy)\n• `moderation` (automod i kary)\n• `logging` (logi zdarzeń)\n• `economy` (/daily i monety)', inline: false },
          { name: '⚡ Przydatne komendy', value: '`/status`, `/panel`, `/serwer-config`, `/test-powitanie`, `/daily`, `/portfel`', inline: false }
        )
        .setFooter({ text: `Serwer: ${guild?.name || 'DM'}` });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (commandName === 'status') {
      const ping = client.ws.ping;
      const uptimeSec = Math.floor(client.uptime / 1000);
      const hours = Math.floor(uptimeSec / 3600);
      const mins = Math.floor((uptimeSec % 3600) / 60);

      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('📊 Status Bota Kitek')
        .addFields(
          { name: '🏓 Ping WebSocket', value: `${ping} ms`, inline: true },
          { name: '⏱️ Uptime', value: `${hours}h ${mins}m`, inline: true },
          { name: '🛡️ Obsługiwane serwery', value: `${client.guilds.cache.size}`, inline: true },
          { name: '📁 Cogs aktywne', value: `${cogFiles.length} modułów`, inline: true },
          { name: '🌐 Dashboard WWW', value: `[Otwórz panel](${DASHBOARD_URL})`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'panel') {
      await interaction.reply({
        content: `🔗 **Panel zarządzania serwerem Kitek:**\n${DASHBOARD_URL}/#servers`,
        ephemeral: true,
      });
    }

    if (commandName === 'serwer-config') {
      if (!guildId) {
        return interaction.reply({ content: '❌ Ta komenda działa tylko na serwerze.', ephemeral: true });
      }
      const config = getServerConfig(guildId);
      if (!config) {
        return interaction.reply({
          content: `⚠️ Brak dedykowanego pliku \`servers/${guildId}.json\`. Używane są ustawienia domyślne.`,
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle(`⚙️ Konfiguracja: ${guild?.name}`)
        .setDescription(`Dane wczytane z pliku \`servers/${guildId}.json\`:`)
        .addFields(
          { name: 'Prefiks', value: `\`${config.prefix || '!'}\``, inline: true },
          { name: 'System Powitań', value: config.modules?.welcomeSystem ? '✅ Włączony' : '❌ Wyłączony', inline: true },
          { name: 'Auto-Kontent', value: config.modules?.autoContent ? '✅ Włączony' : '❌ Wyłączony', inline: true },
          { name: 'Moderacja', value: config.modules?.moderation ? '✅ Włączona' : '❌ Wyłączona', inline: true },
          { name: 'Logi Zdarzeń', value: config.modules?.logging ? '✅ Włączone' : '❌ Wyłączone', inline: true },
          { name: 'Ekonomia', value: config.modules?.economy ? `✅ (${config.economy?.currencyName || 'Monety'})` : '❌ Wyłączona', inline: true }
        )
        .setFooter({ text: `Plik: servers/${guildId}.json` });

      await interaction.reply({ embeds: [embed], ephemeral: true });
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
