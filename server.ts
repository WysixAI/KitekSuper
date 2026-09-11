import express from 'express';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Włącz zaufanie do nagłówków proxy (Cloud Run / reverse proxy dla x-forwarded-proto i x-forwarded-host)
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Discord OAuth2 Credentials
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1368350667634376785';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'n-QA42FjxvV-UPd2LG4KihZOjR7EA34a';

// Discord API Endpoint & Permissions
const DISCORD_API_ENDPOINT = 'https://discord.com/api/v10';
const DISCORD_BOT_PERMISSIONS = '8'; // Administrator permissions for the bot

// Przechowalnia serwerów z podłączonym botem Kitek (Gateway / guildCreate)
const botJoinedGuildIds = new Set<string>();

interface SyncedGuild {
  id: string;
  name: string;
  memberCount?: number;
  joinedAt?: string;
  icon?: string | null;
}

let botStatusInfo = {
  online: true,
  tag: 'Kitek#1337',
  id: DISCORD_CLIENT_ID,
  guildCount: 0,
  ping: 32,
  lastHeartbeat: Date.now(),
  syncedGuilds: [] as SyncedGuild[],
};

// Helper do precyzyjnego odzyskiwania redirect_uri (eliminuje błąd invalid_grant / Invalid "redirect_uri")
function getCallbackRedirectUri(req: express.Request): string {
  // 1. Priorytet: parametr state (w OAuth 2.0 Discord odsyła dokładnie ten sam stan, który otrzymał)
  const rawState = req.query.state as string | undefined;
  if (rawState && typeof rawState === 'string') {
    try {
      const decoded = decodeURIComponent(rawState);
      if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
        return decoded;
      }
      // Sprawdź format base64
      const fromB64 = Buffer.from(rawState, 'base64').toString('utf8');
      if (fromB64.startsWith('http://') || fromB64.startsWith('https://')) {
        return fromB64;
      }
      const json = JSON.parse(fromB64);
      if (json && json.redirect_uri) return json.redirect_uri;
    } catch {
      // Ignoruj błędy parsowania
    }
  }

  // 2. Jeśli brak w state, odzyskaj z nagłówków proxy
  const rawForwardedHost = req.headers['x-forwarded-host'] as string | undefined;
  const host = rawForwardedHost ? rawForwardedHost.split(',')[0].trim() : req.get('host') || `localhost:${PORT}`;

  const rawForwardedProto = req.headers['x-forwarded-proto'] as string | undefined;
  let proto = rawForwardedProto ? rawForwardedProto.split(',')[0].trim() : req.protocol || 'https';
  if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
    proto = 'https';
  }

  return `${proto}://${host}/auth/callback`;
}

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    discordClientId: DISCORD_CLIENT_ID,
    timestamp: new Date().toISOString(),
  });
});

// ==============================================================================
// BOT DISCORD GATEWAY & SYNC API
// ==============================================================================

// GET /api/bot/status - Stan połączenia bota Discord i podłączonych serwerów
app.get('/api/bot/status', (_req, res) => {
  const isAlive =
    botStatusInfo.lastHeartbeat > 0 &&
    Date.now() - botStatusInfo.lastHeartbeat < 120000;

  res.json({
    online: isAlive || botStatusInfo.online,
    isAlive,
    tag: botStatusInfo.tag,
    id: botStatusInfo.id,
    guildCount: botJoinedGuildIds.size,
    ping: botStatusInfo.ping || 32,
    lastHeartbeat: botStatusInfo.lastHeartbeat,
    joinedGuildIds: Array.from(botJoinedGuildIds),
    syncedGuilds: botStatusInfo.syncedGuilds,
  });
});

// POST /api/bot/sync - Bot Node.js synchronizuje listę serwerów przy starcie/cyklicznie
app.post('/api/bot/sync', (req, res) => {
  const { botTag, botId, guilds, ping } = req.body;
  if (Array.isArray(guilds)) {
    guilds.forEach((g: any) => {
      if (g && g.id) {
        botJoinedGuildIds.add(String(g.id));
      }
    });

    botStatusInfo = {
      online: true,
      tag: botTag || botStatusInfo.tag || 'Kitek Bot',
      id: botId || DISCORD_CLIENT_ID,
      guildCount: botJoinedGuildIds.size,
      ping: ping || 28,
      lastHeartbeat: Date.now(),
      syncedGuilds: guilds.map((g: any) => ({
        id: String(g.id),
        name: g.name || 'Discord Server',
        memberCount: g.memberCount,
        icon: g.icon,
        joinedAt: g.joinedAt || new Date().toISOString(),
      })),
    };
    console.log(`[BOT SYNC] Zsynchronizowano bota ${botTag || ''} z ${guilds.length} serwerami.`);
  }

  res.json({
    success: true,
    guildCount: botJoinedGuildIds.size,
    joinedGuildIds: Array.from(botJoinedGuildIds),
  });
});

// POST /api/bot/guild-joined - KLUCZOWE: Wywoływane przez zdarzenie client.on('guildCreate')
app.post('/api/bot/guild-joined', (req, res) => {
  const { guildId, guildName, memberCount, icon } = req.body;
  if (guildId) {
    const sId = String(guildId);
    botJoinedGuildIds.add(sId);

    const existingIndex = botStatusInfo.syncedGuilds.findIndex((g) => g.id === sId);
    if (existingIndex >= 0) {
      botStatusInfo.syncedGuilds[existingIndex].name =
        guildName || botStatusInfo.syncedGuilds[existingIndex].name;
    } else {
      botStatusInfo.syncedGuilds.push({
        id: sId,
        name: guildName || 'Nowy Serwer Discord',
        memberCount: memberCount || 1,
        joinedAt: new Date().toISOString(),
        icon,
      });
    }

    botStatusInfo.guildCount = botJoinedGuildIds.size;
    botStatusInfo.online = true;
    botStatusInfo.lastHeartbeat = Date.now();

    // Wygeneruj plik konfiguracyjny servers/[id].json z default.json
    try {
      const serversDir = path.join(process.cwd(), 'bot', 'servers');
      const defaultJsonPath = path.join(serversDir, 'default.json');
      const guildJsonPath = path.join(serversDir, `${sId}.json`);
      if (fs.existsSync(defaultJsonPath) && !fs.existsSync(guildJsonPath)) {
        const defaultData = JSON.parse(fs.readFileSync(defaultJsonPath, 'utf8'));
        defaultData.guildId = sId;
        defaultData.guildName = guildName || defaultData.guildName;
        fs.writeFileSync(guildJsonPath, JSON.stringify(defaultData, null, 2), 'utf8');
        console.log(`[BOT AUTO-CONFIG] Wygenerowano plik konfiguracyjny servers/${sId}.json`);
      }
    } catch (e) {
      console.warn('Błąd generowania servers/[id].json:', e);
    }

    console.log(`🎉 [DISCORD BOT GATEWAY] guildCreate: Bot został dodany do serwera "${guildName}" (${guildId})!`);
  }

  res.json({
    success: true,
    guildId,
    joined: true,
    totalGuilds: botJoinedGuildIds.size,
  });
});

// POST /api/bot/guild-left - Wywoływane przez client.on('guildDelete')
app.post('/api/bot/guild-left', (req, res) => {
  const { guildId, guildName } = req.body;
  if (guildId) {
    const sId = String(guildId);
    botJoinedGuildIds.delete(sId);
    botStatusInfo.syncedGuilds = botStatusInfo.syncedGuilds.filter((g) => g.id !== sId);
    botStatusInfo.guildCount = botJoinedGuildIds.size;

    // Usuń plik konfiguracyjny serwera przy wyjściu (jeśli to nie default.json)
    try {
      const guildJsonPath = path.join(process.cwd(), 'bot', 'servers', `${sId}.json`);
      if (fs.existsSync(guildJsonPath) && sId !== 'default') {
        fs.unlinkSync(guildJsonPath);
      }
    } catch (e) {
      console.warn('Błąd usuwania servers/[id].json:', e);
    }

    console.log(`⚠️ [DISCORD BOT GATEWAY] guildDelete: Bot opuścił serwer "${guildName || sId}" (${guildId})`);
  }

  res.json({
    success: true,
    guildId,
    joined: false,
    totalGuilds: botJoinedGuildIds.size,
  });
});

// POST /api/bot/test-simulate-join - Umożliwia przetestowanie symulacji dodania bota z poziomu UI
app.post('/api/bot/test-simulate-join', (req, res) => {
  const { guildId, guildName, joined } = req.body;
  if (guildId) {
    const sId = String(guildId);
    const serversDir = path.join(process.cwd(), 'bot', 'servers');
    const defaultJsonPath = path.join(serversDir, 'default.json');
    const guildJsonPath = path.join(serversDir, `${sId}.json`);

    if (joined !== false) {
      botJoinedGuildIds.add(sId);
      if (!botStatusInfo.syncedGuilds.some((g) => g.id === sId)) {
        botStatusInfo.syncedGuilds.push({
          id: sId,
          name: guildName || 'Testowy Serwer Discord',
          joinedAt: new Date().toISOString(),
        });
      }

      // Automatycznie utwórz plik w servers/
      try {
        if (fs.existsSync(defaultJsonPath) && !fs.existsSync(guildJsonPath)) {
          const defaultData = JSON.parse(fs.readFileSync(defaultJsonPath, 'utf8'));
          defaultData.guildId = sId;
          defaultData.guildName = guildName || defaultData.guildName;
          fs.writeFileSync(guildJsonPath, JSON.stringify(defaultData, null, 2), 'utf8');
        }
      } catch (e) {}
    } else {
      botJoinedGuildIds.delete(sId);
      botStatusInfo.syncedGuilds = botStatusInfo.syncedGuilds.filter((g) => g.id !== sId);
      try {
        if (fs.existsSync(guildJsonPath) && sId !== 'default') {
          fs.unlinkSync(guildJsonPath);
        }
      } catch (e) {}
    }
    botStatusInfo.guildCount = botJoinedGuildIds.size;
    botStatusInfo.lastHeartbeat = Date.now();
  }

  res.json({
    success: true,
    guildId,
    joined: botJoinedGuildIds.has(String(guildId)),
    totalJoined: botJoinedGuildIds.size,
    joinedGuildIds: Array.from(botJoinedGuildIds),
  });
});

// GET /api/bot/download-package - Generuje i pobiera pełną paczkę bota ze wszystkimi cogs/ i servers/*.json
app.get('/api/bot/download-package', async (_req, res) => {
  try {
    const zip = new JSZip();
    const botDir = path.join(process.cwd(), 'bot');

    // Funkcja pomocnicza do rekursywnego dodawania plików
    const addDirToZip = (dirPath: string, zipFolder: JSZip) => {
      if (!fs.existsSync(dirPath)) return;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          const subFolder = zipFolder.folder(entry.name);
          if (subFolder) {
            addDirToZip(fullPath, subFolder);
          }
        } else if (entry.isFile()) {
          const fileContent = fs.readFileSync(fullPath);
          zipFolder.file(entry.name, fileContent);
        }
      }
    };

    if (fs.existsSync(botDir)) {
      addDirToZip(botDir, zip);
    }

    // Dodaj także vercel.json dla wygody
    const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
    if (fs.existsSync(vercelJsonPath)) {
      zip.file('vercel.json', fs.readFileSync(vercelJsonPath, 'utf8'));
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="kitek-discord-bot-package.zip"');
    res.setHeader('Content-Length', zipBuffer.length.toString());
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('Error generating bot zip package:', err);
    res.status(500).json({ error: 'Nie udało się wygenerować archiwum ZIP', details: err.message });
  }
});

// GET /api/bot/files - Zwraca listę plików z cogs/ i servers/ do przeglądania i podglądu w UI
app.get('/api/bot/files', (_req, res) => {
  try {
    const botDir = path.join(process.cwd(), 'bot');
    const cogsDir = path.join(botDir, 'cogs');
    const serversDir = path.join(botDir, 'servers');

    const readFilesFromDir = (dirPath: string, relFolder: string) => {
      if (!fs.existsSync(dirPath)) return [];
      return fs.readdirSync(dirPath).map((fileName) => {
        const fullPath = path.join(dirPath, fileName);
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          return {
            name: fileName,
            path: `${relFolder}/${fileName}`,
            size: stat.size,
            content: fs.readFileSync(fullPath, 'utf8'),
          };
        }
        return null;
      }).filter(Boolean);
    };

    const cogs = readFilesFromDir(cogsDir, 'cogs');
    const servers = readFilesFromDir(serversDir, 'servers');

    const rootFileNames = ['index.js', 'package.json', '.env.example', 'README.md'];
    const rootFiles = rootFileNames.map((fileName) => {
      const fullPath = path.join(botDir, fileName);
      if (fs.existsSync(fullPath)) {
        return {
          name: fileName,
          path: fileName,
          size: fs.statSync(fullPath).size,
          content: fs.readFileSync(fullPath, 'utf8'),
        };
      }
      return null;
    }).filter(Boolean);

    res.json({
      success: true,
      files: {
        root: rootFiles,
        cogs,
        servers,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Błąd pobierania struktury plików', details: err.message });
  }
});

// GET /api/bot/servers/:id/config - Zwraca konfigurację konkretnego serwera z servers/[id].json
app.get('/api/bot/servers/:id/config', (req, res) => {
  const guildId = req.params.id;
  const filePath = path.join(process.cwd(), 'bot', 'servers', `${guildId}.json`);
  const defaultPath = path.join(process.cwd(), 'bot', 'servers', 'default.json');

  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return res.json({ success: true, guildId, config: data, isCustom: true });
    } catch {}
  }

  if (fs.existsSync(defaultPath)) {
    try {
      const defaultData = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
      return res.json({
        success: true,
        guildId,
        config: { ...defaultData, guildId },
        isCustom: false,
      });
    } catch {}
  }

  res.status(404).json({ error: 'Nie znaleziono konfiguracji serwera' });
});

// POST /api/bot/servers/:id/config - Zapisuje konfigurację konkretnego serwera do servers/[id].json
app.post('/api/bot/servers/:id/config', (req, res) => {
  const guildId = req.params.id;
  const config = req.body;
  if (!config) {
    return res.status(400).json({ error: 'Brak danych konfiguracyjnych' });
  }

  const serversDir = path.join(process.cwd(), 'bot', 'servers');
  if (!fs.existsSync(serversDir)) {
    fs.mkdirSync(serversDir, { recursive: true });
  }

  const filePath = path.join(serversDir, `${guildId}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8');
    res.json({ success: true, guildId, message: `Zapisano servers/${guildId}.json` });
  } catch (err: any) {
    res.status(500).json({ error: 'Błąd zapisu pliku konfiguracyjnego', details: err.message });
  }
});

// Returns Discord Bot & OAuth config
app.get('/api/auth/discord/config', (req, res) => {
  const defaultCallback = getCallbackRedirectUri(req);

  res.json({
    clientId: DISCORD_CLIENT_ID,
    botInviteUrl: `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=${DISCORD_BOT_PERMISSIONS}&integration_type=0&scope=bot+applications.commands`,
    defaultCallback,
    scopes: ['identify', 'email', 'guilds'],
  });
});

// Generates Discord OAuth2 Authorize URL
app.get('/api/auth/discord/url', (req, res) => {
  const redirectUri = (req.query.redirect_uri as string) || getCallbackRedirectUri(req);

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email guilds',
    prompt: 'consent',
    state: encodeURIComponent(redirectUri),
  });

  const url = `https://discord.com/oauth2/authorize?${params.toString()}`;
  res.json({ url, redirectUri, clientId: DISCORD_CLIENT_ID });
});

// Exchanges OAuth2 Code for Access Token and fetches User + Guilds
app.post('/api/auth/discord/token', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Brak kodu autoryzacyjnego (code is required)' });
    }

    const redirectUri = redirect_uri || getCallbackRedirectUri(req);

    // 1. Wymiana kodu na token w Discord API
    const tokenParams = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    let tokenResponse = await fetch(`${DISCORD_API_ENDPOINT}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Discord Token Exchange Error on redirectUri:', redirectUri, errorData);

      // Automatyczny fallback http/https
      let altRedirectUri: string | null = null;
      if (redirectUri.startsWith('http://')) {
        altRedirectUri = redirectUri.replace('http://', 'https://');
      } else if (redirectUri.startsWith('https://')) {
        altRedirectUri = redirectUri.replace('https://', 'http://');
      }

      if (altRedirectUri && errorData.includes('redirect_uri')) {
        console.log('Retrying exchange with alternative redirectUri:', altRedirectUri);
        const altParams = new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: altRedirectUri,
        });
        const retryRes = await fetch(`${DISCORD_API_ENDPOINT}/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: altParams.toString(),
        });
        if (retryRes.ok) {
          tokenResponse = retryRes;
        } else {
          return res.status(tokenResponse.status).json({
            error: 'Nie udało się wymienić kodu autoryzacyjnego na token Discord.',
            details: errorData,
          });
        }
      } else {
        return res.status(tokenResponse.status).json({
          error: 'Nie udało się wymienić kodu autoryzacyjnego na token Discord.',
          details: errorData,
        });
      }
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token: string;
      scope: string;
    };

    const accessToken = tokenData.access_token;

    // 2. Pobierz dane zalogowanego użytkownika (@me)
    const userResponse = await fetch(`${DISCORD_API_ENDPOINT}/users/@me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return res.status(userResponse.status).json({
        error: 'Nie udało się pobrać profilu użytkownika z Discord API.',
      });
    }

    const userData = (await userResponse.json()) as {
      id: string;
      username: string;
      discriminator: string;
      avatar: string | null;
      global_name?: string;
      email?: string;
    };

    // 3. Pobierz listę serwerów użytkownika (@me/guilds?with_counts=true)
    const guildsResponse = await fetch(`${DISCORD_API_ENDPOINT}/users/@me/guilds?with_counts=true`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let rawGuilds: any[] = [];
    if (guildsResponse.ok) {
      rawGuilds = await guildsResponse.json();
    } else {
      console.warn('Failed to fetch user guilds:', await guildsResponse.text());
    }

    // 4. Przelicz uprawnienia dla każdego serwera
    // Discord: MANAGE_GUILD = 0x20 (32), ADMINISTRATOR = 0x8 (8), OWNER = true
    // Usuwamy serwery, na których użytkownik nie ma uprawnień do dodania bota
    const processedGuilds = rawGuilds
      .filter((g) => {
        const perms = BigInt(g.permissions || '0');
        const isOwner = Boolean(g.owner);
        const isAdmin = (perms & 0x8n) === 0x8n;
        const canManageGuild = (perms & 0x20n) === 0x20n;
        return isOwner || isAdmin || canManageGuild;
      })
      .map((g) => {
        const perms = BigInt(g.permissions || '0');
        const isOwner = Boolean(g.owner);
        const isAdmin = (perms & 0x8n) === 0x8n;
        const canManageGuild = (perms & 0x20n) === 0x20n;
        const canInviteBot = isOwner || isAdmin || canManageGuild;

      const iconUrl = g.icon
        ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
        : null;

      // Wygeneruj akronim nazwy serwera
      const acronym = g.name
        .replace(/'s /g, ' ')
        .replace(/\w+/g, (e: string) => e[0])
        .replace(/\s/g, '')
        .substring(0, 3)
        .toUpperCase();

      return {
        id: g.id,
        name: g.name,
        icon: iconUrl || '🐱',
        iconUrl,
        acronym,
        memberCount: g.approximate_member_count || 1,
        channelsCount: 15,
        rolesCount: 10,
        prefix: '!',
        region: 'Discord Cloud',
        joinedAt: new Date().toLocaleDateString('pl-PL'),
        botStatus: 'online' as const,
        hasAdminPermission: isAdmin || isOwner,
        canInviteBot,
        botJoined: botJoinedGuildIds.has(g.id), // Wykrywane automatycznie przez zdarzenie guildCreate
        isRealGuild: true,
        active: false,
      };
    });

    // Przygotuj format użytkownika pasujący do aplikacji Kitek
    const avatarUrl = userData.avatar
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
      : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=120&auto=format&fit=crop&q=80';

    return res.json({
      success: true,
      accessToken,
      user: {
        id: userData.id,
        username: userData.global_name || userData.username,
        discriminator: userData.discriminator === '0' ? '' : userData.discriminator,
        avatarUrl,
        role: 'Zalogowany Użytkownik',
        isAdmin: true,
        email: userData.email,
      },
      guilds: processedGuilds,
      botClientId: DISCORD_CLIENT_ID,
    });
  } catch (error) {
    console.error('API /api/auth/discord/token Exception:', error);
    return res.status(500).json({
      error: 'Wewnętrzny błąd serwera podczas autoryzacji Discord.',
      details: String(error),
    });
  }
});

// OAuth2 Callback handler for Popup & Redirect flow
const handleOAuthCallback = async (req: express.Request, res: express.Response) => {
  const code = req.query.code as string | undefined;
  const error = req.query.error as string | undefined;
  const errorDescription = req.query.error_description as string | undefined;

  let isSuccess = false;
  let userData: any = null;
  let processedGuilds: any[] = [];
  let errorMessage = errorDescription || error || null;

  if (code) {
    try {
      const redirectUri = getCallbackRedirectUri(req);
      console.log('OAuth Callback starting exchange with redirectUri:', redirectUri);

      // 1. Wymiana kodu na token Discord
      const tokenParams = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      });

      let tokenRes = await fetch(`${DISCORD_API_ENDPOINT}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString(),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error('Callback Exchange Error on primary redirectUri (', redirectUri, '):', errText);

        // Fallback w razie rozbieżności http vs https
        let altRedirectUri: string | null = null;
        if (redirectUri.startsWith('http://')) {
          altRedirectUri = redirectUri.replace('http://', 'https://');
        } else if (redirectUri.startsWith('https://')) {
          altRedirectUri = redirectUri.replace('https://', 'http://');
        }

        if (altRedirectUri && errText.includes('redirect_uri')) {
          console.log('Retrying callback exchange with alternative redirectUri:', altRedirectUri);
          const altParams = new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: altRedirectUri,
          });
          const retryRes = await fetch(`${DISCORD_API_ENDPOINT}/oauth2/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: altParams.toString(),
          });
          if (retryRes.ok) {
            tokenRes = retryRes;
          } else {
            errorMessage = 'Błąd autoryzacji Discord: ' + errText;
          }
        } else {
          errorMessage = 'Błąd autoryzacji Discord: ' + errText;
        }
      }

      if (tokenRes.ok) {
        const tokenData = (await tokenRes.json()) as any;
        const accessToken = tokenData.access_token;

        // 2. Pobierz profil (@me)
        const userRes = await fetch(`${DISCORD_API_ENDPOINT}/users/@me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (userRes.ok) {
          const rawUser = (await userRes.json()) as any;
          const avatarUrl = rawUser.avatar
            ? `https://cdn.discordapp.com/avatars/${rawUser.id}/${rawUser.avatar}.png`
            : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=120&auto=format&fit=crop&q=80';

          userData = {
            id: rawUser.id,
            username: rawUser.global_name || rawUser.username,
            discriminator: rawUser.discriminator === '0' ? '' : rawUser.discriminator,
            avatarUrl,
            role: 'Zalogowany Użytkownik',
            isAdmin: true,
            email: rawUser.email,
            isDiscordLogged: true,
          };

          // 3. Pobierz serwery (@me/guilds)
          const guildsRes = await fetch(`${DISCORD_API_ENDPOINT}/users/@me/guilds?with_counts=true`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (guildsRes.ok) {
            const rawGuilds = (await guildsRes.json()) as any[];
            processedGuilds = rawGuilds
              .filter((g: any) => {
                const permissions = BigInt(g.permissions || '0');
                const isAdmin = (permissions & BigInt(0x8)) === BigInt(0x8);
                const isOwner = Boolean(g.owner);
                const isManageGuild = (permissions & BigInt(0x20)) === BigInt(0x20);
                return isAdmin || isOwner || isManageGuild;
              })
              .map((g: any) => {
                const permissions = BigInt(g.permissions || '0');
                const isAdmin = (permissions & BigInt(0x8)) === BigInt(0x8);
                const isOwner = Boolean(g.owner);
                const isManageGuild = (permissions & BigInt(0x20)) === BigInt(0x20);
                const canInviteBot = isAdmin || isOwner || isManageGuild;

              return {
                id: g.id,
                name: g.name,
                icon: g.name ? g.name.substring(0, 2).toUpperCase() : 'SRV',
                iconUrl: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
                acronym: g.name ? g.name.substring(0, 3).toUpperCase() : 'SRV',
                memberCount: g.approximate_member_count || 1,
                channelsCount: 12,
                rolesCount: 8,
                prefix: '!',
                region: 'Discord Cloud',
                joinedAt: new Date().toLocaleDateString('pl-PL'),
                botStatus: 'online' as const,
                hasAdminPermission: isAdmin || isOwner,
                canInviteBot,
                botJoined: botJoinedGuildIds.has(g.id), // Wykrywane automatycznie przez zdarzenie guildCreate
                isRealGuild: true,
                active: false,
              };
            });
          }

          isSuccess = true;
        }
      }
    } catch (err: any) {
      console.error('Callback error:', err);
      errorMessage = err?.message || 'Wystąpił nieoczekiwany błąd podczas logowania.';
    }
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="pl">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Autoryzacja Discord - Kitek Bot</title>
        <style>
          * { box-sizing: border-box; }
          body {
            background-color: #121417;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
            text-align: center;
          }
          .card {
            background: #1a1d21;
            border: 1px solid ${isSuccess ? '#10b981' : '#ef4444'};
            border-radius: 20px;
            padding: 36px 28px;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.7);
            position: relative;
          }
          .avatar-wrap {
            width: 72px;
            height: 72px;
            margin: 0 auto 18px auto;
            border-radius: 20px;
            overflow: hidden;
            border: 2px solid ${isSuccess ? '#10b981' : '#ef4444'};
            background: #252a32;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          }
          .avatar-wrap img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .avatar-wrap .icon {
            font-size: 32px;
          }
          .title {
            font-size: 20px;
            font-weight: 800;
            margin-bottom: 8px;
            color: ${isSuccess ? '#34d399' : '#f87171'};
          }
          .desc {
            font-size: 14px;
            color: #9ca3af;
            line-height: 1.5;
            margin-bottom: 24px;
          }
          .user-name {
            color: #ffffff;
            font-weight: bold;
          }
          .actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            padding: 12px 20px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.15s ease;
            border: none;
          }
          .btn-primary {
            background: #10b981;
            color: #000000;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
          }
          .btn-primary:hover {
            background: #34d399;
          }
          .btn-secondary {
            background: #252a32;
            color: #d1d5db;
            border: 1px solid #374151;
          }
          .btn-secondary:hover {
            background: #2d343f;
            color: #ffffff;
          }
          .status-note {
            font-size: 12px;
            color: #6b7280;
            margin-top: 14px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="avatar-wrap">
            ${
              userData && userData.avatarUrl
                ? `<img src="${userData.avatarUrl}" alt="${userData.username}" />`
                : `<span class="icon">${isSuccess ? '🐱' : '⚠️'}</span>`
            }
          </div>

          <div class="title">
            ${isSuccess ? 'Zalogowano pomyślnie!' : 'Błąd logowania'}
          </div>

          <div class="desc">
            ${
              isSuccess
                ? `Witaj, <span class="user-name">${userData.username}</span>! Twoje konto zostało połączone z panelem bota Kitek. Zsynchronizowano serwery (${processedGuilds.length}).`
                : `Discord zwrócił błąd: ${errorMessage || 'Nieznany błąd'}`
            }
          </div>

          <div class="actions">
            <button id="close-btn" class="btn btn-primary" onclick="closeThisWindow()">
              ${isSuccess ? 'Zamknij to okno' : 'Zamknij okno'}
            </button>
            <button id="dashboard-btn" class="btn btn-secondary" onclick="goToDashboard()">
              Przejdź do Panelu Kitek
            </button>
          </div>

          <div id="status-note" class="status-note">
            ${isSuccess ? 'Okno zamknie się automatycznie za chwilę...' : ''}
          </div>
        </div>

        <script>
          (function() {
            var userData = ${JSON.stringify(userData)};
            var guildsData = ${JSON.stringify(processedGuilds)};
            var code = ${JSON.stringify(code || null)};
            var isSuccess = ${JSON.stringify(isSuccess)};
            var errorMessage = ${JSON.stringify(errorMessage)};

            if (isSuccess && userData) {
              // 1. Zapisz bezpośrednio w localStorage pod kluczami bota
              try {
                localStorage.setItem('kitek_discord_user_v2', JSON.stringify(userData));
                localStorage.setItem('kitek_discord_guilds_v2', JSON.stringify(guildsData));
                localStorage.setItem('kitek_discord_auth_event', JSON.stringify({
                  type: 'LOGIN_SUCCESS',
                  user: userData,
                  guilds: guildsData,
                  time: Date.now()
                }));
              } catch (e) {
                console.warn('Storage write error:', e);
              }

              // 2. BroadcastChannel dla wszystkich kart
              try {
                var bc = new BroadcastChannel('kitek_discord_auth');
                bc.postMessage({
                  type: 'LOGIN_SUCCESS',
                  user: userData,
                  guilds: guildsData
                });
              } catch (e) {}

              // 3. PostMessage do okna rodzica (opener)
              try {
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'OAUTH_AUTH_SUCCESS',
                    code: code,
                    user: userData,
                    guilds: guildsData
                  }, '*');
                }
              } catch (e) {}

              // Próba automatycznego zamknięcia po krótkiej chwili
              setTimeout(function() {
                try {
                  window.close();
                } catch (e) {}
              }, 1200);
            }
          })();

          function closeThisWindow() {
            try {
              window.close();
            } catch (e) {}
            setTimeout(function() {
              var note = document.getElementById('status-note');
              if (note) {
                note.textContent = 'Możesz teraz bezpiecznie zamknąć tę kartę w przeglądarce [X].';
              }
            }, 250);
          }

          function goToDashboard() {
            window.location.href = '/#dashboard';
          }
        </script>
      </body>
    </html>
  `);
};

app.get('/auth/callback', handleOAuthCallback);
app.get('/auth/callback/', handleOAuthCallback);

// Vite middleware / static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kitek Bot Dashboard Server running on http://0.0.0.0:${PORT}`);
  });
}

// Jeśli nie jesteśmy w środowisku serverless (np. Vercel), uruchom standardowy serwer Node.js
if (!process.env.VERCEL) {
  startServer();
}

export default app;
