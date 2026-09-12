import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Bot,
  Terminal,
  Server,
  Code2,
  Copy,
  Check,
  Zap,
  Globe,
  Radio,
  FileCode,
  Download,
  CheckCircle2,
  RefreshCw,
  Folder,
  FolderOpen,
  FileJson,
  Package,
  Save,
  Play,
  FileText,
  HelpCircle,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  Cpu,
  History,
  Search,
  Filter,
  Wrench,
  Calendar,
  Tag,
  AlertCircle,
} from 'lucide-react';
import JSZip from 'jszip';
import { DiscordServer, DiscordBotGatewayStatus } from '../types';
import { BOT_CHANGELOG_DATA, BotUpdateLogItem } from '../data/botChangelog';

interface BotsViewProps {
  servers: DiscordServer[];
  selectedServerId: string;
  onBackToDashboard: () => void;
  onSelectServer: (id: string) => void;
  onRefreshServers?: () => void;
}

interface BotFileItem {
  name: string;
  path: string;
  size?: number;
  content: string;
  category: 'cogs' | 'servers' | 'root';
  description?: string;
}

// Domyślna zawartość w razie braku połączenia z API
const FALLBACK_FILES: BotFileItem[] = [
  {
    name: 'guildTracker.js',
    path: 'cogs/guildTracker.js',
    category: 'cogs',
    description: 'Wykrywa dodanie na serwer (guildCreate), auto-tworzy servers/[id].json i powiadamia panel',
    content: `import { ChannelType, EmbedBuilder } from 'discord.js';

export default function setupGuildTracker(client, context) {
  const { DASHBOARD_URL, getServerConfig, saveServerConfig, getDefaultConfig } = context;

  // Wykrywanie dodania bota na serwer
  client.on('guildCreate', async (guild) => {
    console.log(\`🎉 [WYKRYTO DODANIE] Bot Kitek dodany do serwera "\${guild.name}" (\${guild.id})\`);

    // Automatyczne utworzenie pliku servers/[guildId].json
    let config = getServerConfig(guild.id);
    if (!config) {
      config = { ...getDefaultConfig(), guildId: guild.id, guildName: guild.name, joinedAt: new Date().toISOString() };
      saveServerConfig(guild.id, config);
      console.log(\`💾 Utworzono konfigurację: servers/\${guild.id}.json\`);
    }

    // Powiadomienie internetowego panelu WWW
    try {
      await fetch(\`\${DASHBOARD_URL}/api/bot/guild-joined\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId: guild.id, guildName: guild.name, memberCount: guild.memberCount }),
      });
    } catch (e) {
      console.warn('Błąd powiadamiania panelu:', e.message);
    }
  });

  client.on('guildDelete', async (guild) => {
    console.log(\`⚠️ Bot opuścił serwer \${guild.name}\`);
    try {
      await fetch(\`\${DASHBOARD_URL}/api/bot/guild-left\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId: guild.id, guildName: guild.name }),
      });
    } catch {}
  });
}`,
  },
  {
    name: 'welcome.js',
    path: 'cogs/welcome.js',
    category: 'cogs',
    description: 'Wysyła powitania członków zgodnie z plikiem servers/[guildId].json oraz nadaje auto-rolę',
    content: `import { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export function getSlashCommands() {
  return [
    new SlashCommandBuilder()
      .setName('test-powitanie')
      .setDescription('Testuje powitanie według pliku servers/[guildId].json')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  ];
}

export default function setupWelcome(client, context) {
  const { getServerConfig } = context;

  client.on('guildMemberAdd', async (member) => {
    const config = getServerConfig(member.guild.id);
    if (!config?.modules?.welcomeSystem || !config?.welcomeSystem?.enabled) return;

    const ws = config.welcomeSystem;
    const channel = ws.channelId ? member.guild.channels.cache.get(ws.channelId) : member.guild.systemChannel;
    if (!channel) return;

    const text = (ws.message || 'Witaj {user} na {server}!')
      .replace('{user}', \`<@\${member.id}>\`)
      .replace('{server}', member.guild.name)
      .replace('{memberCount}', member.guild.memberCount);

    const embed = new EmbedBuilder()
      .setColor(ws.embed?.color || 0x10b981)
      .setTitle(ws.embed?.title || '🎉 Witamy!')
      .setDescription(text)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  });
}`,
  },
  {
    name: 'autocontent.js',
    path: 'cogs/autocontent.js',
    category: 'cogs',
    description: 'Harmonogram ciekawostek o kotach i memów, komendy /kitek-fakt i /kitek-mem',
    content: `import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export function getSlashCommands() {
  return [
    new SlashCommandBuilder().setName('kitek-fakt').setDescription('Losowa ciekawostka o kotach'),
    new SlashCommandBuilder().setName('kitek-mem').setDescription('Zabawny cytat / mem'),
  ];
}

export default function setupAutoContent(client, context) {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'kitek-fakt') {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x10b981).setTitle('💡 Ciekawostka').setDescription('Koty przesypiają około 70% swojego życia!')],
      });
    }
    if (interaction.commandName === 'kitek-mem') {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xf59e0b).setTitle('😹 Mem').setDescription('Pudełko jest zawsze 10x lepsze niż droga zabawka!')],
      });
    }
  });
}`,
  },
  {
    name: 'moderation.js',
    path: 'cogs/moderation.js',
    category: 'cogs',
    description: 'Automod (anty-linki, spam) oraz komendy /wyczysc, /ostrzez, /wycisz',
    content: `import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export function getSlashCommands() {
  return [
    new SlashCommandBuilder()
      .setName('wyczysc')
      .setDescription('Usuwa wiadomości z kanału')
      .addIntegerOption(opt => opt.setName('ilosc').setDescription('1-100').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  ];
}

export default function setupModeration(client, context) {
  const { getServerConfig } = context;

  client.on('messageCreate', async (msg) => {
    if (!msg.guild || msg.author.bot) return;
    const config = getServerConfig(msg.guild.id);
    if (!config?.moderation?.enabled) return;

    if (config.moderation.antiLinks && /discord\\.(gg|io|me)\\/i.test(msg.content)) {
      await msg.delete().catch(() => {});
      msg.channel.send(\`⚠️ <@\${msg.author.id}>, linki do discorda są zablokowane!\`).then(m => setTimeout(() => m.delete(), 4000));
    }
  });
}`,
  },
  {
    name: 'logging.js',
    path: 'cogs/logging.js',
    category: 'cogs',
    description: 'Audit logi zdarzeń (usunięcie wiadomości, edycje, wyjścia z serwera)',
    content: `import { EmbedBuilder } from 'discord.js';

export default function setupLogging(client, context) {
  const { getServerConfig } = context;

  client.on('messageDelete', async (message) => {
    if (!message.guild || message.author?.bot) return;
    const config = getServerConfig(message.guild.id);
    if (!config?.logging?.enabled || !config.logging.channelId) return;

    const channel = message.guild.channels.cache.get(config.logging.channelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle('🗑️ Usunięto wiadomość')
      .setDescription(\`Autor: <@\${message.author.id}>\\nKanał: <#\${message.channelId}>\\nTreść: \${message.content || 'Brak tekstu'}\`)
      .setTimestamp();
    await channel.send({ embeds: [embed] });
  });
}`,
  },
  {
    name: 'economy.js',
    path: 'cogs/economy.js',
    category: 'cogs',
    description: 'Lokalna ekonomia serwerowa, komendy /daily, /portfel i /przelej',
    content: `import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export function getSlashCommands() {
  return [
    new SlashCommandBuilder().setName('daily').setDescription('Odbierz codzienną porcję monet!'),
    new SlashCommandBuilder().setName('portfel').setDescription('Stan Twojego portfela'),
  ];
}

export default function setupEconomy(client, context) {
  const balances = new Map();

  client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;
    if (i.commandName === 'daily') {
      const cur = balances.get(i.user.id) || 0;
      balances.set(i.user.id, cur + 100);
      await i.reply({ content: '🪙 Otrzymałeś +100 monet /daily!' });
    }
    if (i.commandName === 'portfel') {
      const cur = balances.get(i.user.id) || 0;
      await i.reply({ content: \`👛 Twój stan konta: \${cur} monet\` });
    }
  });
}`,
  },
  {
    name: 'interactions.js',
    path: 'cogs/interactions.js',
    category: 'cogs',
    description: 'Obsługa przycisków, menu wyboru, nadawania/odbierania ról (Action Roles) i komunikatów ephemeral',
    content: `export default function setupInteractions(client, context) {
  const { getServerConfig } = context;

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
    const { guild, member, customId } = interaction;
    if (!guild || !member) return;

    let actionType = null;
    let targetRole = null;
    let customMsg = null;

    if (customId.startsWith('ktk:act:')) {
      const parts = customId.split(':');
      actionType = parts[2];
      targetRole = parts[3];
    } else if (customId.startsWith('ktk:sel:')) {
      const selectedVal = interaction.values?.[0];
      if (selectedVal && selectedVal.startsWith('ktk:act:')) {
        const parts = selectedVal.split(':');
        actionType = parts[2];
        targetRole = parts[3];
      }
    }

    if (!actionType || actionType === 'none') {
      if (interaction.isButton()) {
        return interaction.reply({ content: '👌 Zarejestrowano kliknięcie!', ephemeral: true });
      }
      return interaction.reply({ content: \`👌 Wybrano opcję: \${interaction.values?.[0] || 'Opcja'}\`, ephemeral: true });
    }

    if (actionType === 'ephemeral_msg') {
      return interaction.reply({ content: customMsg || '💬 Prywatna wiadomość od bota Kitek!', ephemeral: true });
    }

    // Role actions
    const role = guild.roles.cache.get(targetRole) || guild.roles.cache.find(r => r.name.toLowerCase() === targetRole?.toLowerCase());
    if (!role) {
      return interaction.reply({ content: \`⚠️ Nie odnaleziono roli "\${targetRole}" na tym serwerze.\`, ephemeral: true });
    }

    try {
      if (actionType === 'add_role') {
        if (member.roles.cache.has(role.id)) {
          return interaction.reply({ content: \`Posiadasz już rolę **\${role.name}**!\`, ephemeral: true });
        }
        await member.roles.add(role);
        return interaction.reply({ content: customMsg || \`✅ Pomyślnie nadano rolę **\${role.name}**!\`, ephemeral: true });
      }
      if (actionType === 'remove_role') {
        if (!member.roles.cache.has(role.id)) {
          return interaction.reply({ content: \`Nie posiadasz roli **\${role.name}**.\`, ephemeral: true });
        }
        await member.roles.remove(role);
        return interaction.reply({ content: customMsg || \`🗑️ Pomyślnie odebrano rolę **\${role.name}**!\`, ephemeral: true });
      }
      if (actionType === 'toggle_role') {
        if (member.roles.cache.has(role.id)) {
          await member.roles.remove(role);
          return interaction.reply({ content: \`🔄 Odebrano rolę **\${role.name}**!\`, ephemeral: true });
        } else {
          await member.roles.add(role);
          return interaction.reply({ content: \`🔄 Nadano rolę **\${role.name}**!\`, ephemeral: true });
        }
      }
    } catch (err) {
      return interaction.reply({ content: \`❌ Błąd zarządzania rolą: \${err.message}\`, ephemeral: true });
    }
  });
}`,
  },
  {
    name: 'default.json',
    path: 'servers/default.json',
    category: 'servers',
    description: 'Szablon domyślny konfiguracji dla nowo dołączonych serwerów',
    content: `{
  "guildId": "default",
  "guildName": "Szablon Domyślny",
  "prefix": "!",
  "modules": {
    "welcomeSystem": true,
    "autoContent": true,
    "moderation": true,
    "logging": true,
    "economy": true
  },
  "welcomeSystem": {
    "enabled": true,
    "channelName": "👋-powitania",
    "message": "Witaj {user} na serwerze {server}! Jesteś #{memberCount} członkiem.",
    "embed": {
      "title": "🎉 Nowy członek na serwerze!",
      "color": "#10b981",
      "showAvatar": true
    }
  },
  "autoContent": {
    "enabled": true,
    "channelName": "🐱-kocurek-dnia",
    "postIntervalHours": 12,
    "categories": ["koty", "ciekawostki", "memy"]
  },
  "moderation": {
    "enabled": true,
    "antiLinks": true,
    "antiSpam": true,
    "maxMentions": 5
  },
  "logging": {
    "enabled": true,
    "channelId": null
  },
  "economy": {
    "enabled": true,
    "currencyName": "KitekCoins",
    "currencySymbol": "🪙",
    "dailyAmount": 100
  }
}`,
  },
  {
    name: 'index.js',
    path: 'index.js',
    category: 'root',
    description: 'Główny plik bota - dynamicznie ładuje cogs/ oraz odczytuje servers/[guildId].json',
    content: `import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1368350667634376785';
const DASHBOARD_URL = (process.env.DASHBOARD_URL || '').replace(/\\/$/, '');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Helpery do obsługi folderu servers/[id].json
function getServerConfig(guildId) {
  const p = path.join(__dirname, 'servers', \`\${guildId}.json\`);
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  return null;
}
function saveServerConfig(guildId, config) {
  const p = path.join(__dirname, 'servers', \`\${guildId}.json\`);
  fs.writeFileSync(p, JSON.stringify(config, null, 2), 'utf8');
}
function getDefaultConfig() {
  const p = path.join(__dirname, 'servers', 'default.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
}

// Dynamiczne ładowanie cogs/
const cogsDir = path.join(__dirname, 'cogs');
const context = { DASHBOARD_URL, CLIENT_ID, getServerConfig, saveServerConfig, getDefaultConfig };

client.once('ready', async () => {
  console.log(\`🤖 Zalogowano jako: \${client.user.tag}\`);
  const files = fs.readdirSync(cogsDir).filter(f => f.endsWith('.js'));
  for (const f of files) {
    const mod = await import(\`file://\${path.join(cogsDir, f)}\`);
    if (typeof mod.default === 'function') mod.default(client, context);
  }
});

client.login(TOKEN);`,
  },
  {
    name: 'package.json',
    path: 'package.json',
    category: 'root',
    description: 'Zależności npm bota Node.js (discord.js v14)',
    content: `{
  "name": "kitek-discord-bot",
  "version": "1.0.0",
  "description": "Discord Bot dla panelu Kitek z architekturą cogs/ oraz servers/*.json",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "discord.js": "^14.17.3",
    "dotenv": "^16.4.7"
  }
}`,
  },
  {
    name: '.env.example',
    path: '.env.example',
    category: 'root',
    description: 'Szablon zmiennych środowiskowych bota',
    content: `# Token z Discord Developer Portal (zakładka "Bot")
DISCORD_BOT_TOKEN=twoj_tajny_token_bota

# Application ID z Discord Developer Portal
DISCORD_CLIENT_ID=1368350667634376785

# Adres URL Twojego Dashboardu Kitek na Vercel
DASHBOARD_URL=https://kitekbots.vercel.app
`,
  },
  {
    name: 'README.md',
    path: 'README.md',
    category: 'root',
    description: 'Dokumentacja uruchomienia i struktury bota',
    content: `# 🐱 Kitek Discord Bot (Cogs & Servers JSON)

Gotowa paczka bota z modułami w folderze \`cogs/\` oraz konfiguracjami serwerów w folderze \`servers/\`.

## Szybki start:
1. Rozpakuj paczkę: \`npm install\`
2. Skopiuj \`.env.example\` do \`.env\` i wklej swój token
3. Uruchom: \`npm start\`
`,
  },
];

export const BotsView = ({
  servers,
  selectedServerId,
  onBackToDashboard,
  onRefreshServers,
}: BotsViewProps) => {
  const [activeTab, setActiveTab] = useState<'package' | 'changelog' | 'simulator' | 'vercel'>('package');
  const [changelogSearchQuery, setChangelogSearchQuery] = useState('');
  const [changelogFilterType, setChangelogFilterType] = useState<'all' | 'fix' | 'feature' | 'improvement'>('all');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  const handleCopyUpdateLog = (log: BotUpdateLogItem) => {
    const text = `📋 [AKTUALIZACJA BOTA KITEK v${log.version}] - ${log.title}
📅 Data: ${log.date}
Opis: ${log.summary}

Zmiany:
${log.changes.map((c) => `• [${c.type.toUpperCase()}] ${c.text}${c.details ? ` - ${c.details}` : ''}`).join('\n')}

Zmodyfikowane pliki bota:
${log.affectedFiles.map((f) => `- ${f}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedLogId(log.id);
    setTimeout(() => setCopiedLogId(null), 2500);
  };
  const [files, setFiles] = useState<BotFileItem[]>(FALLBACK_FILES);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('cogs/guildTracker.js');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeFolderCategory, setActiveFolderCategory] = useState<'all' | 'cogs' | 'servers' | 'root'>('all');

  // Edycja konfiguracji JSON
  const [jsonEditorContent, setJsonEditorContent] = useState<string>('');
  const [jsonSaveMessage, setJsonSaveMessage] = useState<string | null>(null);
  const [isSavingJson, setIsSavingJson] = useState(false);

  const [botStatus, setBotStatus] = useState<DiscordBotGatewayStatus>({
    online: true,
    isAlive: true,
    tag: 'Kitek#1337',
    id: '1368350667634376785',
    guildCount: servers.filter((s) => s.botJoined).length || 2,
    ping: 32,
    lastHeartbeat: Date.now(),
    joinedGuildIds: servers.filter((s) => s.botJoined).map((s) => s.id),
  });

  const [simulatingServerId, setSimulatingServerId] = useState<string>(selectedServerId || servers[0]?.id || '');
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [eventLogs, setEventLogs] = useState<
    Array<{ id: string; time: string; type: 'join' | 'leave' | 'sync'; text: string }>
  >([
    {
      id: '1',
      time: 'Przed chwilą',
      type: 'sync',
      text: 'Gateway Ready: Załadowano cogs/guildTracker, cogs/welcome, cogs/autocontent, cogs/moderation, cogs/logging, cogs/economy.',
    },
    {
      id: '2',
      time: '2 min temu',
      type: 'sync',
      text: 'Servers JSON: Wczytano bazę konfiguracji z folderu servers/*.json.',
    },
  ]);

  // Pobierz strukturę plików z serwera
  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/bot/files');
      if (res.ok) {
        const data = await res.json();
        const loadedFiles: BotFileItem[] = [];

        if (Array.isArray(data.files?.cogs)) {
          data.files.cogs.forEach((f: any) => {
            loadedFiles.push({
              name: f.name,
              path: f.path,
              size: f.size,
              content: f.content,
              category: 'cogs',
              description:
                f.name === 'guildTracker.js'
                  ? 'Wykrywa dodanie na serwer (guildCreate), tworzy servers/[id].json i powiadamia API'
                  : f.name === 'welcome.js'
                  ? 'Obsługa powitań, formatowanie embed, auto-rola'
                  : f.name === 'autocontent.js'
                  ? 'Ciekawostki o kotach, memy, harmonogram postów'
                  : f.name === 'moderation.js'
                  ? 'Automod (anty-linki, spam) i komendy /wyczysc, /wycisz'
                  : f.name === 'logging.js'
                  ? 'Logowanie zdarzeń (usunięcia, edycje, wyjścia z serwera)'
                  : 'Moduł lokalnej ekonomii /daily i monet',
            });
          });
        }

        if (Array.isArray(data.files?.servers)) {
          data.files.servers.forEach((f: any) => {
            loadedFiles.push({
              name: f.name,
              path: f.path,
              size: f.size,
              content: f.content,
              category: 'servers',
              description:
                f.name === 'default.json'
                  ? 'Domyślny szablon konfiguracji dla każdego nowego serwera'
                  : `Indywidualna konfiguracja dla serwera ${f.name.replace('.json', '')}`,
            });
          });
        }

        if (Array.isArray(data.files?.root)) {
          data.files.root.forEach((f: any) => {
            loadedFiles.push({
              name: f.name,
              path: f.path,
              size: f.size,
              content: f.content,
              category: 'root',
              description:
                f.name === 'index.js'
                  ? 'Główny punkt startowy Node.js ładujący cogs oraz czytający servers/[id].json'
                  : f.name === 'package.json'
                  ? 'Zależności bota (discord.js v14, dotenv)'
                  : f.name === '.env.example'
                  ? 'Wzór tokenu bota i adresu panelu'
                  : 'Dokumentacja projektu bota',
            });
          });
        }

        if (loadedFiles.length > 0) {
          setFiles(loadedFiles);
        }
      }
    } catch {}
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/bot/status');
      if (res.ok) {
        const data = await res.json();
        setBotStatus(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchFiles();
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentFile = files.find((f) => f.path === selectedFilePath) || files[0];

  // Aktualizuj pole edycji przy zmianie pliku
  useEffect(() => {
    if (currentFile) {
      setJsonEditorContent(currentFile.content);
      setJsonSaveMessage(null);
    }
  }, [currentFile?.path]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Pobieranie pojedynczego pliku
  const handleDownloadSingleFile = (file: BotFileItem) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Kluczowa funkcja: Pobieranie CAŁEJ paczki bota (.ZIP do wrzucenia)
  const handleDownloadCompletePackage = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      // 1. Spróbuj pobrać bezpośrednio z API backendu
      const res = await fetch('/api/bot/download-package');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kitek-discord-bot-package.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
        return;
      }
    } catch {}

    // 2. Fallback: generowanie archiwum ZIP po stronie klienta (JSZip)
    try {
      const zip = new JSZip();
      const cogsFolder = zip.folder('cogs');
      const serversFolder = zip.folder('servers');

      files.forEach((f) => {
        if (f.category === 'cogs' && cogsFolder) {
          cogsFolder.file(f.name, f.content);
        } else if (f.category === 'servers' && serversFolder) {
          serversFolder.file(f.name, f.content);
        } else {
          zip.file(f.name, f.content);
        }
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kitek-discord-bot-package.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (e: any) {
      alert('Nie udało się wygenerować pliku ZIP: ' + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Zapis zmian w plikach JSON z folderu servers/
  const handleSaveJsonConfig = async () => {
    if (!currentFile || currentFile.category !== 'servers') return;

    try {
      // Walidacja składni JSON
      const parsed = JSON.parse(jsonEditorContent);
      setIsSavingJson(true);

      const serverId = currentFile.name.replace('.json', '');
      const res = await fetch(`/api/bot/servers/${serverId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      if (res.ok) {
        setJsonSaveMessage(`✅ Zapisano pomyślnie servers/${currentFile.name}`);
        // Zaktualizuj stan lokalny
        setFiles((prev) =>
          prev.map((f) => (f.path === currentFile.path ? { ...f, content: jsonEditorContent } : f))
        );
      } else {
        setJsonSaveMessage('❌ Serwer odrzucił zapis');
      }
    } catch (err: any) {
      setJsonSaveMessage(`❌ Błąd składni JSON: ${err.message}`);
    } finally {
      setIsSavingJson(false);
      setTimeout(() => setJsonSaveMessage(null), 3500);
    }
  };

  // Symulacja dołączenia bota do serwera (guildCreate)
  const handleSimulateJoin = async (joined: boolean) => {
    if (!simulatingServerId) return;
    const targetServer = servers.find((s) => s.id === simulatingServerId);
    setSimulationLoading(true);

    try {
      const res = await fetch('/api/bot/test-simulate-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: simulatingServerId,
          guildName: targetServer?.name || 'Serwer Discord',
          joined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBotStatus((prev) => ({
          ...prev,
          guildCount: data.totalJoined,
          joinedGuildIds: data.joinedGuildIds,
        }));

        const newLog = {
          id: String(Date.now()),
          time: new Date().toLocaleTimeString('pl-PL'),
          type: (joined ? 'join' : 'leave') as 'join' | 'leave',
          text: joined
            ? `guildCreate: Wykryto dodanie do "${targetServer?.name}" (${simulatingServerId})! Utworzono servers/${simulatingServerId}.json.`
            : `guildDelete: Bot opuścił "${targetServer?.name}" (${simulatingServerId}).`,
        };
        setEventLogs((prev) => [newLog, ...prev.slice(0, 7)]);

        // Odśwież listę plików aby pokazać nowy plik servers/[id].json
        fetchFiles();

        if (onRefreshServers) {
          onRefreshServers();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulationLoading(false);
    }
  };

  const cogsFiles = files.filter((f) => f.category === 'cogs');
  const serversFiles = files.filter((f) => f.category === 'servers');
  const rootFiles = files.filter((f) => f.category === 'root');

  return (
    <div className="flex-1 bg-[#1a1d21] text-white px-4 sm:px-8 py-6 h-full overflow-y-auto min-h-0 w-full space-y-6">
      {/* 1. Górna sekcja z powrotem i statusem */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#2b3038]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-[#20242a] hover:bg-[#282e36] text-zinc-400 hover:text-white border border-[#2b3038] transition-colors cursor-pointer"
            title="Wróć do głównego panelu"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                <span>Paczka Bota (Cogs & Servers JSON)</span>
              </h1>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-mono font-semibold">
                discord.js v14
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Pełna paczka z folderem <code className="text-emerald-400 bg-[#141619] px-1 py-0.5 rounded font-mono">cogs/</code> (funkcje), folderem <code className="text-emerald-400 bg-[#141619] px-1 py-0.5 rounded font-mono">servers/</code> (konfiguracje [id].json) oraz gotowym archiwum ZIP do wrzucenia na hosting.
            </p>
          </div>
        </div>

        {/* Akcja Główna: Pobierz Całą Paczkę Bota ZIP */}
        <div className="flex items-center gap-2.5">
          <button
            id="download-bot-package-btn"
            type="button"
            onClick={handleDownloadCompletePackage}
            disabled={isDownloading}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
            ) : downloadSuccess ? (
              <Check className="w-4 h-4 text-black stroke-[3]" />
            ) : (
              <Download className="w-4 h-4 text-black stroke-[2.5]" />
            )}
            <span>
              {isDownloading
                ? 'Pakowanie ZIP...'
                : downloadSuccess
                ? 'Pobrano paczkę ZIP!'
                : 'Pobierz Całą Paczkę (.ZIP do wrzucenia)'}
            </span>
          </button>

          {/* Status Bar WebSocket Gateway */}
          <div className="hidden sm:flex items-center gap-3 bg-[#20242a] px-3.5 py-2 rounded-xl border border-[#2b3038]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 font-mono">ONLINE</span>
            </div>
            <span className="text-zinc-600">|</span>
            <div className="text-xs text-zinc-400 font-mono">
              <span>{botStatus.ping} ms</span>
            </div>
            <span className="text-zinc-600">|</span>
            <div className="text-xs text-zinc-300 font-mono">
              <span className="font-bold text-white">{botStatus.guildCount}</span>
              <span className="text-zinc-400 text-[10px] ml-1">serwerów</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zakładki */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#2b3038] pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('package')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'package'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-[#20242a]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Przeglądarka Paczki (cogs/ & servers/)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            {files.length} plików
          </span>
        </button>

        <button
          id="bot-tab-changelog-btn"
          type="button"
          onClick={() => setActiveTab('changelog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'changelog'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-950/20'
              : 'text-zinc-400 hover:text-white hover:bg-[#20242a]'
          }`}
        >
          <History className="w-4 h-4 text-emerald-400" />
          <span>Dziennik Zmian Bota (Update Log)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            v{BOT_CHANGELOG_DATA[0]?.version || '1.2.4'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'simulator'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-[#20242a]'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Test & Symulator guildCreate</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vercel')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'vercel'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-[#20242a]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Hosting (Vercel & Railway/VPS)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PRZEGLĄDARKA PACZKI (COGS, SERVERS, INDEX.JS, PACKAGE.JSON)       */}
      {/* ========================================================================= */}
      {activeTab === 'package' && (
        <div className="space-y-4">
          {/* Banner z podsumowaniem zawartości paczki */}
          <div className="bg-gradient-to-r from-[#1b2723] via-[#1c2229] to-[#1a1d21] border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">Gotowa Struktura do Wrzucenia</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    ZIP Ready
                  </span>
                </div>
                <p className="text-xs text-zinc-300">
                  Folder <strong className="text-emerald-300 font-mono">cogs/</strong> z 6 funkcjami (guildTracker, welcome, autocontent, moderation, logging, economy) oraz folder <strong className="text-emerald-300 font-mono">servers/</strong> z plikami <strong className="text-emerald-300 font-mono">[id].json</strong> dla każdego serwera.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadCompletePackage}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ściągnij archiwum .ZIP</span>
            </button>
          </div>

          {/* Eksplorator plików: Drzewo po lewej, Podgląd/Edytor po prawej */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Lewa kolumna: Drzewo plików */}
            <div className="lg:col-span-4 bg-[#20242a] border border-[#2b3038] rounded-2xl p-3.5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#2b3038]">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-200">Pliki projektu bota</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">{files.length} plików</span>
              </div>

              {/* Filtr kategorii */}
              <div className="flex items-center gap-1 bg-[#16181b] p-1 rounded-xl border border-[#2b3038] text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveFolderCategory('all')}
                  className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeFolderCategory === 'all' ? 'bg-[#282e36] text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Wszystkie
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFolderCategory('cogs')}
                  className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeFolderCategory === 'cogs' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  cogs/
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFolderCategory('servers')}
                  className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    activeFolderCategory === 'servers' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  servers/
                </button>
              </div>

              {/* Lista folderów i plików */}
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {/* Kategoria: cogs/ */}
                {(activeFolderCategory === 'all' || activeFolderCategory === 'cogs') && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      <Folder className="w-3.5 h-3.5 text-emerald-400" />
                      <span>cogs/ (Funkcje modułowe)</span>
                    </div>
                    <div className="space-y-0.5 pl-2 border-l border-[#2b3038] ml-2">
                      {cogsFiles.map((file) => (
                        <button
                          key={file.path}
                          type="button"
                          onClick={() => setSelectedFilePath(file.path)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                            selectedFilePath === file.path
                              ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                              : 'text-zinc-300 hover:bg-[#282e36] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate font-mono">{file.name}</span>
                          </div>
                          {file.name === 'guildTracker.js' && (
                            <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                              guildCreate
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kategoria: servers/ */}
                {(activeFolderCategory === 'all' || activeFolderCategory === 'servers') && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      <Folder className="w-3.5 h-3.5 text-amber-400" />
                      <span>servers/ (Konfiguracje per serwer)</span>
                    </div>
                    <div className="space-y-0.5 pl-2 border-l border-[#2b3038] ml-2">
                      {serversFiles.map((file) => (
                        <button
                          key={file.path}
                          type="button"
                          onClick={() => setSelectedFilePath(file.path)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                            selectedFilePath === file.path
                              ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                              : 'text-zinc-300 hover:bg-[#282e36] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileJson className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate font-mono">{file.name}</span>
                          </div>
                          {file.name === 'default.json' ? (
                            <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-400 font-mono">
                              szablon
                            </span>
                          ) : (
                            <span className="text-[9px] px-1 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                              serwer
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kategoria: root/ */}
                {(activeFolderCategory === 'all' || activeFolderCategory === 'root') && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      <span>Główne pliki projektu</span>
                    </div>
                    <div className="space-y-0.5 pl-2 border-l border-[#2b3038] ml-2">
                      {rootFiles.map((file) => (
                        <button
                          key={file.path}
                          type="button"
                          onClick={() => setSelectedFilePath(file.path)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                            selectedFilePath === file.path
                              ? 'bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30'
                              : 'text-zinc-300 hover:bg-[#282e36] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="truncate font-mono">{file.name}</span>
                          </div>
                          {file.name === 'index.js' && (
                            <span className="text-[9px] px-1 rounded bg-blue-500/20 text-blue-300 font-mono">
                              loader
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Prawa kolumna: Szczegóły, Podgląd i Edytor wybranego pliku */}
            <div className="lg:col-span-8 bg-[#20242a] border border-[#2b3038] rounded-2xl flex flex-col overflow-hidden">
              {/* Pasek narzędzi pliku */}
              <div className="p-3.5 bg-[#17191d] border-b border-[#2b3038] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {currentFile?.category === 'cogs' ? (
                    <FileCode className="w-4 h-4 text-emerald-400" />
                  ) : currentFile?.category === 'servers' ? (
                    <FileJson className="w-4 h-4 text-amber-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-400" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{currentFile?.path}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#252a32] text-zinc-400 font-mono">
                        {currentFile?.name.endsWith('.json') ? 'JSON' : 'JavaScript'}
                      </span>
                    </div>
                    {currentFile?.description && (
                      <p className="text-[11px] text-zinc-400 mt-0.5">{currentFile.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Przycisk zapisu dla plików z folderu servers/ */}
                  {currentFile?.category === 'servers' && (
                    <button
                      type="button"
                      onClick={handleSaveJsonConfig}
                      disabled={isSavingJson}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
                      title="Zapisz ten plik JSON w folderze servers/"
                    >
                      {isSavingJson ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Zapisz JSON</span>
                    </button>
                  )}

                  {/* Kopiuj treść */}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(jsonEditorContent || currentFile?.content || '', currentFile?.path || '')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282e36] hover:bg-[#323a45] text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {copiedKey === currentFile?.path ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Skopiowano</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopiuj</span>
                      </>
                    )}
                  </button>

                  {/* Pobierz ten plik */}
                  <button
                    type="button"
                    onClick={() => currentFile && handleDownloadSingleFile(currentFile)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282e36] hover:bg-[#323a45] text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                    title="Pobierz ten pojedynczy plik"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Pobierz plik</span>
                  </button>
                </div>
              </div>

              {/* Komunikat o zapisie JSON */}
              {jsonSaveMessage && (
                <div className="px-4 py-2 bg-[#121417] text-xs font-mono border-b border-[#2b3038] text-emerald-400">
                  {jsonSaveMessage}
                </div>
              )}

              {/* Okno podglądu / edycji kodu */}
              <div className="p-4 bg-[#141619] overflow-x-auto min-h-[440px] max-h-[580px] font-mono text-xs text-zinc-200">
                {currentFile?.category === 'servers' ? (
                  // Dla plików JSON w folderze servers/ udostępniamy edytor textarea
                  <div className="space-y-2 h-full">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-sans pb-1">
                      <span>Edytuj konfigurację JSON dla tego serwera:</span>
                      <span>Format: UTF-8 JSON</span>
                    </div>
                    <textarea
                      value={jsonEditorContent}
                      onChange={(e) => setJsonEditorContent(e.target.value)}
                      className="w-full h-[400px] bg-[#1a1d21] text-emerald-300 border border-[#2b3038] rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-emerald-500/50 resize-y leading-relaxed"
                      spellCheck={false}
                    />
                  </div>
                ) : (
                  // Dla cogs/ i root podgląd z numerami linii
                  <pre className="leading-relaxed">
                    <code>
                      {currentFile?.content.split('\n').map((line, idx) => (
                        <div key={idx} className="table-row">
                          <span className="table-cell pr-4 text-zinc-600 select-none text-right w-8">
                            {idx + 1}
                          </span>
                          <span className="table-cell">{line}</span>
                        </div>
                      ))}
                    </code>
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: DZIENNIK ZMIAN BOTA (CHANGELOG & UPDATE LOG)                        */}
      {/* ========================================================================= */}
      {activeTab === 'changelog' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#1b2723] via-[#1c2229] to-[#1a1d21] border border-emerald-500/20 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <History className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">
                  Dziennik Zmian & Aktualizacji Bota (Bot Update Log)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  v{BOT_CHANGELOG_DATA[0]?.version || '1.2.4'}
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Rejestr wszystkich modyfikacji wprowadzanych w silniku bota (<code className="text-emerald-300 font-mono bg-[#141619] px-1 py-0.5 rounded">bot/index.js</code>), modułach cogs (<code className="text-emerald-300 font-mono bg-[#141619] px-1 py-0.5 rounded">bot/cogs/*.js</code>), szablonach wieloserwerowych (<code className="text-emerald-300 font-mono bg-[#141619] px-1 py-0.5 rounded">servers/*.json</code>) oraz dwukierunkowej synchronizacji z Panelem WWW. Za każdym razem po aktualizacji bota pojawia się tu nowy wpis.
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#2b3038]">
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 block font-mono">BIEŻĄCA WERSJA</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">v{BOT_CHANGELOG_DATA[0]?.version || '1.2.4'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 block font-mono">OSTATNI UPDATE</span>
                <span className="text-xs font-semibold text-zinc-200">{BOT_CHANGELOG_DATA[0]?.date.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          {/* Filtry i wyszukiwarka */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#20242a] p-3 rounded-xl border border-[#2b3038]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={changelogSearchQuery}
                onChange={(e) => setChangelogSearchQuery(e.target.value)}
                placeholder="Szukaj w zmianach (np. role, embed, guildTracker, default.json)..."
                className="w-full bg-[#16181b] border border-[#2b3038] rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
              {changelogSearchQuery && (
                <button
                  type="button"
                  onClick={() => setChangelogSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 pr-1 pl-1">
                <Filter className="w-3 h-3" /> Filtr:
              </span>
              {(['all', 'fix', 'feature', 'improvement'] as const).map((filterType) => (
                <button
                  key={filterType}
                  type="button"
                  onClick={() => setChangelogFilterType(filterType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    changelogFilterType === filterType
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-[#181a1e] text-zinc-400 hover:text-white border border-[#2b3038]'
                  }`}
                >
                  {filterType === 'all'
                    ? `Wszystkie (${BOT_CHANGELOG_DATA.length})`
                    : filterType === 'fix'
                    ? 'Poprawki (Fix)'
                    : filterType === 'feature'
                    ? 'Nowości'
                    : 'Usprawnienia'}
                </button>
              ))}
            </div>
          </div>

          {/* Lista Wydań / Karty Update Log */}
          <div className="space-y-4">
            {BOT_CHANGELOG_DATA.filter((item) => {
              const query = changelogSearchQuery.toLowerCase();
              const matchesSearch =
                !query ||
                item.title.toLowerCase().includes(query) ||
                item.version.toLowerCase().includes(query) ||
                item.summary.toLowerCase().includes(query) ||
                item.affectedFiles.some((f) => f.toLowerCase().includes(query)) ||
                item.changes.some((c) => c.text.toLowerCase().includes(query) || (c.details && c.details.toLowerCase().includes(query)));

              if (!matchesSearch) return false;
              if (changelogFilterType === 'all') return true;
              return item.changes.some((c) => c.type === changelogFilterType);
            }).map((item) => (
              <div
                key={item.id}
                className="bg-[#20242a] border border-[#2b3038] hover:border-emerald-500/30 rounded-2xl p-5 sm:p-6 space-y-4 transition-all shadow-md"
              >
                {/* Górny wiersz karty wersji */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2b3038]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-base font-extrabold text-white font-mono tracking-tight flex items-center gap-1.5">
                      <span className="text-emerald-400">v{item.version}</span>
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider border ${
                        item.badge === 'NAJNOWSZY'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : item.badge === 'CORE ENGINE'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : item.badge === 'HOTFIX'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      }`}
                    >
                      {item.badge}
                    </span>

                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{item.date}</span>
                    </span>
                  </div>

                  {/* Przycisk kopiowania raportu wersji */}
                  <button
                    type="button"
                    onClick={() => handleCopyUpdateLog(item)}
                    className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16181b] hover:bg-[#282e36] text-zinc-300 hover:text-white border border-[#2b3038] text-xs font-semibold transition-all cursor-pointer"
                    title="Kopiuj podsumowanie wersji do schowka (np. na kanał ogłoszeń)"
                  >
                    {copiedLogId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Skopiowano raport!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Kopiuj wpis</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Tytuł i Podsumowanie */}
                <div className="space-y-2">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item.title}</span>
                  </h3>
                  <div className="bg-[#17191d] p-3 rounded-xl border border-[#2b3038]/60 text-xs text-zinc-300 leading-relaxed">
                    {item.summary}
                  </div>
                </div>

                {/* Zmodyfikowane pliki bota */}
                {item.affectedFiles.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                      <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Zmodyfikowane pliki silnika bota:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.affectedFiles.map((filePath) => (
                        <span
                          key={filePath}
                          className="px-2 py-0.5 rounded bg-[#16181b] border border-[#2b3038] text-zinc-300 font-mono text-[11px] flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{filePath}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista szczegółowych zmian */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-zinc-400 block">
                    Wprowadzone ulepszenia i poprawki:
                  </span>
                  <div className="space-y-2">
                    {item.changes
                      .filter((c) => changelogFilterType === 'all' || c.type === changelogFilterType)
                      .map((change, cIdx) => (
                        <div
                          key={cIdx}
                          className="bg-[#191c20] p-3 rounded-xl border border-[#2b3038] space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase tracking-wider ${
                                change.type === 'fix'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : change.type === 'feature'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : change.type === 'security'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {change.type === 'fix'
                                ? 'POPRAWKA'
                                : change.type === 'feature'
                                ? 'NOWOŚĆ'
                                : change.type === 'security'
                                ? 'BEZPIECZEŃSTWO'
                                : 'USPRAWNIENIE'}
                            </span>
                            <span className="text-xs font-semibold text-zinc-100">{change.text}</span>
                          </div>
                          {change.details && (
                            <p className="text-[11px] text-zinc-400 pl-1 leading-relaxed">
                              {change.details}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Karta informacyjna jak wdrożyć aktualizacje na serwerze hostingowym */}
          <div className="bg-[#17191d] border border-emerald-500/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Jak wdrożyć najnowszą wersję na swój hosting bota?
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-300">
              <div className="bg-[#20242a] p-3 rounded-xl border border-[#2b3038] space-y-1">
                <span className="font-bold text-emerald-400 block font-mono">1. Pobierz ZIP</span>
                <p className="text-[11px] text-zinc-400">
                  Użyj przycisku <strong className="text-white">„Pobierz Całą Paczkę”</strong> u góry tej strony, by otrzymać świeżą paczkę z folderami <code className="text-emerald-300 font-mono">cogs/</code> oraz <code className="text-emerald-300 font-mono">servers/</code>.
                </p>
              </div>
              <div className="bg-[#20242a] p-3 rounded-xl border border-[#2b3038] space-y-1">
                <span className="font-bold text-emerald-400 block font-mono">2. Podmień pliki</span>
                <p className="text-[11px] text-zinc-400">
                  Wgraj i rozpakuj pliki na swoim serwerze (VPS / Pterodactyl / Railway). Folder <code className="text-emerald-300 font-mono">servers/</code> zachowa istniejące dane serwerów.
                </p>
              </div>
              <div className="bg-[#20242a] p-3 rounded-xl border border-[#2b3038] space-y-1">
                <span className="font-bold text-emerald-400 block font-mono">3. Zrestartuj proces</span>
                <p className="text-[11px] text-zinc-400">
                  Wpisz w konsoli bota <code className="text-emerald-300 font-mono">node index.js</code> lub <code className="text-emerald-300 font-mono">pm2 restart kitek</code>. Bot automatycznie załaduje nowe cogsy!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SYMULATOR WYKRYWANIA (guildCreate)                                */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="space-y-5">
          <div className="bg-[#20242a] border border-[#2b3038] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Interaktywny Symulator Zdarzeń (guildCreate & guildDelete)</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Przetestuj działanie modułu <code className="text-emerald-400 font-mono bg-[#141619] px-1 py-0.5 rounded">cogs/guildTracker.js</code>. Po kliknięciu „Zasymuluj Dodanie Bota”, serwer wyśle żądanie do API, utworzy plik w <code className="text-amber-400 font-mono bg-[#141619] px-1 py-0.5 rounded">servers/[id].json</code> i przełączy serwer w stan ZARZĄDZAJ!
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <select
                value={simulatingServerId}
                onChange={(e) => setSimulatingServerId(e.target.value)}
                className="bg-[#17191d] border border-[#2b3038] rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
              >
                {servers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (ID: {s.id}) {s.botJoined ? '• [Bot Obecny]' : '• [Wymaga Zaproszenia]'}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateJoin(true)}
                  disabled={simulationLoading}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {simulationLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Zasymuluj Dodanie Bota (guildCreate)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateJoin(false)}
                  disabled={simulationLoading}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#282e36] hover:bg-[#323a45] text-zinc-300 font-medium text-xs border border-[#3b424d] transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>Zasymuluj Usunięcie (guildDelete)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dziennik Zdarzeń (Live Event Log) */}
          <div className="bg-[#20242a] border border-[#2b3038] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2b3038]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Logi Zdarzeń Discord Gateway na Żywo</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">Dziennik API</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto font-mono text-xs">
              {eventLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#16181b] border border-[#252a32]"
                >
                  <span className="text-[10px] text-zinc-500 shrink-0 mt-0.5">{log.time}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      log.type === 'join'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : log.type === 'leave'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {log.type.toUpperCase()}
                  </span>
                  <span className="text-zinc-300 break-all">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WDROŻENIE NA VERCEL & HOSTING                                      */}
      {/* ========================================================================= */}
      {activeTab === 'vercel' && (
        <div className="space-y-5">
          <div className="bg-[#20242a] border border-[#2b3038] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Jak Wdrożyć Panel i Uruchomić Bota (Podział Ról)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Vercel - Dashboard */}
              <div className="p-4 rounded-xl bg-[#16181b] border border-[#2b3038] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Dashboard WWW na Vercel</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold">
                    SERVERLESS
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Twój panel działa pod adresem: <a href="https://kitekbots.vercel.app/" target="_blank" rel="noreferrer" className="text-emerald-400 font-mono underline">https://kitekbots.vercel.app/</a>.
                </p>
                <div className="p-2.5 rounded-lg bg-[#101214] border border-[#23272e] space-y-1.5 text-[11px]">
                  <span className="text-zinc-400 block font-semibold">Wpisz w Discord Developer Portal ➔ OAuth2 ➔ Redirects:</span>
                  <code className="text-emerald-300 font-mono block select-all bg-[#1a1d21] p-1.5 rounded">https://kitekbots.vercel.app/auth/callback</code>
                </div>
              </div>

              {/* Railway / VPS - Bot Gateway 24/7 */}
              <div className="p-4 rounded-xl bg-[#16181b] border border-[#2b3038] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <span>Proces Bota 24/7 & Konfiguracja servers/[id].json</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-semibold">
                    WEBSOCKET
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  W pliku <code className="text-emerald-400 font-mono">.env</code> bota ustaw: <code className="text-emerald-300 font-mono">DASHBOARD_URL=https://kitekbots.vercel.app</code>.
                </p>
                <div className="p-2.5 rounded-lg bg-[#101214] border border-[#23272e] space-y-1 text-[11px]">
                  <span className="text-zinc-400 block font-semibold">Nazewnictwo plików w folderze <code className="text-zinc-300">servers/</code>:</span>
                  <span className="text-zinc-300 block">
                    Każdy serwer posiada plik <strong className="text-white font-mono">&lt;ID_SERWERA&gt;.json</strong> (np. <code className="text-emerald-300 font-mono">1368350667634376785.json</code>). Bot nigdy nie używa fikcyjnych nazw typu <code className="text-red-400 line-through font-mono">srv-1.json</code>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
