import express from 'express';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';

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
  channels?: any[];
  roles?: any[];
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
app.get(['/api', '/api/'], (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Kitek Discord Bot API',
    discordClientId: DISCORD_CLIENT_ID,
    timestamp: new Date().toISOString(),
  });
});

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
        channels: g.channels || [],
        roles: g.roles || [],
      })),
    };
    console.log(`[BOT SYNC] Zsynchronizowano bota ${botTag || ''} z ${guilds.length} serwerami.`);
  }

  // Wczytaj aktualne konfiguracje z bot/servers/ aby odesłać je do bota
  const serversDir = path.join(process.cwd(), 'bot', 'servers');
  const configsMap: Record<string, any> = {};
  if (fs.existsSync(serversDir)) {
    try {
      const files = fs.readdirSync(serversDir).filter((f) => f.endsWith('.json'));
      for (const f of files) {
        const sId = f.replace('.json', '');
        try {
          configsMap[sId] = JSON.parse(fs.readFileSync(path.join(serversDir, f), 'utf8'));
        } catch {}
      }
    } catch {}
  }

  // Przekaż oczekujące akcje (np. wysyłanie embedów) i wyczyść kolejkę
  const actionsToSend = [...pendingBotActions];
  pendingBotActions.length = 0;

  res.json({
    success: true,
    guildCount: botJoinedGuildIds.size,
    joinedGuildIds: Array.from(botJoinedGuildIds),
    configs: configsMap,
    actions: actionsToSend,
  });
});

// Kolejka akcji dla bota (np. wysyłanie embedów przez bota)
interface PendingBotAction {
  id: string;
  type: string;
  guildId?: string;
  channelId?: string;
  channelName?: string;
  content?: string;
  embeds?: any[];
  components?: any[];
  v2Components?: any[];
  flags?: number;
  createdAt: number;
}
const pendingBotActions: PendingBotAction[] = [];

// POST /api/bot/send-embed - Wysyła embed na wybrany kanał Discord
app.post('/api/bot/send-embed', async (req, res) => {
  const { guildId, channelId, channelName, plainText, containers, formatMode = 'v2' } = req.body;

  if (!channelId && !channelName) {
    return res.status(400).json({ error: 'Nie podano kanału docelowego.' });
  }

  // 1. Konwersja na standard Discord Components V2 (Container type 17, flags: 32768)
  // 2. Oraz konwersja na klasyczne Discord Embeds + Action Rows (kompatybilność)
  const embeds: any[] = [];
  const actionRows: any[] = [];
  const v2TopLevelComponents: any[] = [];
  const interactionConfigs: Record<string, any> = {};

  if (plainText && plainText.trim()) {
    v2TopLevelComponents.push({
      type: 10, // Text Display
      content: plainText.trim(),
    });
  }

  if (Array.isArray(containers)) {
    for (const cont of containers) {
      let description = '';
      let thumbnailUrl = '';
      let imageUrl = '';

      const hexColor = cont.color ? cont.color.replace('#', '') : '10b981';
      const colorInt = parseInt(hexColor, 16) || 0x10b981;

      // Obiekt kontenera Discord Components V2 (type 17)
      const v2Container: any = {
        type: 17, // Container
        accent_color: colorInt,
        spoiler: Boolean(cont.spoiler),
        components: [],
      };

      for (const comp of cont.components || []) {
        // 1. Sekcja tekstowa i akcesoria (V2 Section type 9)
        if (comp.type === 'section') {
          if (comp.sectionContent) {
            description = description ? `${description}\n\n${comp.sectionContent}` : comp.sectionContent;
          }
          if (comp.accessory?.fileUrl) {
            if (comp.accessory.type === 'Thumbnail') {
              thumbnailUrl = comp.accessory.fileUrl;
            } else if (comp.accessory.type === 'Image') {
              imageUrl = comp.accessory.fileUrl;
            }
          }

          const secObj: any = {
            type: 9, // Section
            components: [
              {
                type: 10, // Text Display
                content: comp.sectionContent || ' ',
              },
            ],
          };
          if (comp.accessory?.fileUrl) {
            secObj.accessory = {
              type: 11, // Thumbnail / Media
              media: {
                url: comp.accessory.fileUrl,
                description: comp.accessory.description || undefined,
              },
            };
          }
          v2Container.components.push(secObj);
        }

        // 2. Text Display (wyświetlanie kodu/tekstu - V2 type 10)
        if (comp.type === 'text_display' && comp.content) {
          description = description ? `${description}\n\n${comp.content}` : comp.content;
          v2Container.components.push({
            type: 10,
            content: comp.content,
          });
        }

        // 3. Separator (V2 type 14)
        if (comp.type === 'separator') {
          const sepText =
            comp.divider !== false
              ? '\n───────────────────────────────\n'
              : comp.spacing === 'Large'
              ? '\n\n\n'
              : comp.spacing === 'Medium'
              ? '\n\n'
              : '\n';
          description = description ? `${description}${sepText}` : '';

          v2Container.components.push({
            type: 14,
            divider: comp.divider !== false,
            spacing: comp.spacing === 'Large' ? 2 : 1,
          });
        }

        // 4. Media Gallery (V2 type 12)
        if (comp.type === 'media_gallery' && Array.isArray(comp.mediaUrls) && comp.mediaUrls.length > 0) {
          if (!imageUrl && comp.mediaUrls[0]) {
            imageUrl = comp.mediaUrls[0];
          }
          const validUrls = comp.mediaUrls.filter(Boolean);
          if (validUrls.length > 0) {
            v2Container.components.push({
              type: 12,
              items: validUrls.map((u: string) => ({
                media: { url: u },
              })),
            });
          }
        }

        // 5. Button Row (Wiersz przycisków Discord - type 1 ActionRow, type 2 Button)
        if (comp.type === 'button_row' && Array.isArray(comp.buttons) && comp.buttons.length > 0) {
          const buttonsList = comp.buttons.slice(0, 5).map((btn: any, bIdx: number) => {
            const isLink = btn.style === 'link';
            const styleMap: Record<string, number> = {
              primary: 1, // Blurple
              secondary: 2, // Grey
              success: 3, // Green
              danger: 4, // Red
              link: 5, // Link URL
            };
            const btnStyle = styleMap[btn.style] || 1;

            const actionType = btn.actionType || 'none';
            const roleId = btn.targetRoleId || 'none';
            const cleanId = (btn.id || `btn_${bIdx}`).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
            const customId = `ktk:act:${actionType}:${roleId}:${cleanId}`;

            const btnPayload: any = {
              type: 2,
              style: btnStyle,
              label: (btn.label || 'Przycisk').slice(0, 80),
            };

            if (btn.emoji) {
              btnPayload.emoji = { name: btn.emoji };
            }

            if (isLink) {
              btnPayload.url = btn.url || 'https://kitek.pl';
            } else {
              btnPayload.custom_id = customId;
              interactionConfigs[customId] = {
                id: btn.id,
                label: btn.label,
                actionType,
                targetRoleId: btn.targetRoleId,
                targetRoleName: btn.targetRoleName,
                customMessage: btn.customMessage,
              };
            }

            return btnPayload;
          });

          if (buttonsList.length > 0) {
            if (actionRows.length < 5) {
              actionRows.push({
                type: 1,
                components: buttonsList,
              });
            }
            v2Container.components.push({
              type: 1,
              components: buttonsList,
            });
          }
        }

        // 6. Select Menu (Lista rozwijana Discord - type 1 ActionRow, type 3 StringSelect)
        if (comp.type === 'select_menu' && Array.isArray(comp.options) && comp.options.length > 0) {
          const cleanSelId = (comp.id || 'sel').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 25);
          const selectCustomId = `ktk:sel:${cleanSelId}`;

          const optionsList = comp.options.slice(0, 25).map((opt: any, oIdx: number) => {
            const actionType = opt.actionType || 'none';
            const roleId = opt.targetRoleId || 'none';
            const cleanOptId = (opt.id || opt.value || `opt_${oIdx}`).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
            const optValue = `ktk:opt:${actionType}:${roleId}:${cleanOptId}`;

            interactionConfigs[optValue] = {
              id: opt.id,
              label: opt.label,
              actionType,
              targetRoleId: opt.targetRoleId,
              targetRoleName: opt.targetRoleName,
              customMessage: opt.customMessage,
            };

            const optPayload: any = {
              label: (opt.label || 'Opcja').slice(0, 100),
              value: optValue,
              description: opt.description ? opt.description.slice(0, 100) : undefined,
            };

            if (opt.emoji) {
              optPayload.emoji = { name: opt.emoji };
            }

            return optPayload;
          });

          if (optionsList.length > 0) {
            const selectRow = {
              type: 1,
              components: [
                {
                  type: 3,
                  custom_id: selectCustomId,
                  placeholder: (comp.placeholder || 'Wybierz opcję...').slice(0, 150),
                  disabled: Boolean(comp.disabled),
                  options: optionsList,
                },
              ],
            };
            if (actionRows.length < 5) {
              actionRows.push(selectRow);
            }
            v2Container.components.push(selectRow);
          }
        }
      }

      if (v2Container.components.length === 0) {
        v2Container.components.push({ type: 10, content: ' ' });
      }
      v2TopLevelComponents.push(v2Container);

      const embedObj: any = {
        color: colorInt,
      };

      if (description) embedObj.description = description;
      if (thumbnailUrl) embedObj.thumbnail = { url: thumbnailUrl };
      if (imageUrl) embedObj.image = { url: imageUrl };

      if (embedObj.description || embedObj.thumbnail || embedObj.image) {
        embeds.push(embedObj);
      }
    }
  }

  // Zapisz konfigurację akcji interaktywnych do servers/[guildId].json
  if (guildId && Object.keys(interactionConfigs).length > 0) {
    try {
      const serversDir = path.join(process.cwd(), 'bot', 'servers');
      if (fs.existsSync(serversDir)) {
        const guildJsonPath = path.join(serversDir, `${guildId}.json`);
        let cfg: any = {};
        if (fs.existsSync(guildJsonPath)) {
          try {
            cfg = JSON.parse(fs.readFileSync(guildJsonPath, 'utf8'));
          } catch {}
        }
        cfg.customInteractions = {
          ...(cfg.customInteractions || {}),
          ...interactionConfigs,
        };
        fs.writeFileSync(guildJsonPath, JSON.stringify(cfg, null, 2), 'utf8');
      }
    } catch (err: any) {
      console.warn('[SEND-EMBED] Nie udało się zapisać akcji interakcji do pliku serwera:', err.message);
    }
  }

  const botToken = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;

  // 1. Próba wysłania bezpośrednio przez Discord REST API
  if (botToken && channelId && /^\d+$/.test(channelId)) {
    let sendSuccess = false;
    let sendMode = 'legacy';

    // Próba wysłania Components V2 (flags: 32768, kontenery type 17)
    if (formatMode !== 'legacy' && v2TopLevelComponents.length > 0) {
      try {
        const v2Res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flags: 32768,
            components: v2TopLevelComponents,
          }),
        });

        if (v2Res.ok) {
          sendSuccess = true;
          sendMode = 'v2';
        } else {
          const errText = await v2Res.text();
          console.warn('[SEND-EMBED] REST API V2 zwróciło status błędu:', v2Res.status, errText);
        }
      } catch (err: any) {
        console.warn('[SEND-EMBED] REST API V2 próba nieudana:', err.message);
      }
    }

    // Fallback: Klasyczny embed + Action Rows
    if (!sendSuccess) {
      try {
        const restRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: plainText || undefined,
            embeds: embeds.length > 0 ? embeds : undefined,
            components: actionRows.length > 0 ? actionRows : undefined,
          }),
        });

        if (restRes.ok) {
          sendSuccess = true;
          sendMode = 'legacy';
        } else {
          const errText = await restRes.text();
          console.warn('[SEND-EMBED] REST API legacy zwróciło status błędu:', restRes.status, errText);
        }
      } catch (err: any) {
        console.warn('[SEND-EMBED] REST API legacy próba nieudana:', err.message);
      }
    }

    if (sendSuccess) {
      return res.json({
        success: true,
        mode: sendMode,
        message:
          sendMode === 'v2'
            ? `🚀 Wiadomość Discord Components v2 (nowy standard z kontenerami type 17, przyciskami i akcjami ról) została natychmiast wysłana na kanał #${channelName || channelId}!`
            : `✅ Wiadomość Embed wraz z ${actionRows.length} wierszami komponentów (przyciskami i menu akcji ról) została natychmiast wysłana na kanał #${channelName || channelId}!`,
      });
    }
  }

  // 2. Dodaj do kolejki akcji bota (bot pobiera w cyklu sync i wysyła)
  pendingBotActions.push({
    id: Date.now().toString(),
    type: 'send_embed',
    guildId,
    channelId,
    channelName,
    content: plainText,
    embeds,
    components: actionRows,
    v2Components: v2TopLevelComponents,
    flags: 32768,
    createdAt: Date.now(),
  });

  return res.json({
    success: true,
    mode: formatMode === 'v2' ? 'v2' : 'legacy',
    message: `✅ Wiadomość Discord Components v2 wraz z kontenerami i akcjami ról została przekazana do bota i zostanie natychmiast wysłana na kanał #${channelName || channelId}!`,
  });
});

// POST /api/bot/guild-joined - KLUCZOWE: Wywoływane przez zdarzenie client.on('guildCreate')
app.post('/api/bot/guild-joined', (req, res) => {
  const { guildId, guildName, memberCount, icon, channels, roles } = req.body;
  if (guildId) {
    const sId = String(guildId);
    botJoinedGuildIds.add(sId);

    const existingIndex = botStatusInfo.syncedGuilds.findIndex((g) => g.id === sId);
    if (existingIndex >= 0) {
      botStatusInfo.syncedGuilds[existingIndex].name =
        guildName || botStatusInfo.syncedGuilds[existingIndex].name;
      botStatusInfo.syncedGuilds[existingIndex].channels = channels || botStatusInfo.syncedGuilds[existingIndex].channels || [];
      botStatusInfo.syncedGuilds[existingIndex].roles = roles || botStatusInfo.syncedGuilds[existingIndex].roles || [];
    } else {
      botStatusInfo.syncedGuilds.push({
        id: sId,
        name: guildName || 'Nowy Serwer Discord',
        memberCount: memberCount || 1,
        joinedAt: new Date().toISOString(),
        icon,
        channels: channels || [],
        roles: roles || [],
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

// POST /api/bot/servers/:id/config - Zapisuje i scala konfigurację konkretnego serwera do servers/[id].json
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
    let existingConfig: any = {};
    if (fs.existsSync(filePath)) {
      try {
        existingConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {}
    } else {
      const defaultPath = path.join(serversDir, 'default.json');
      if (fs.existsSync(defaultPath)) {
        try {
          existingConfig = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
        } catch {}
      }
    }

    const mergedConfig = {
      ...existingConfig,
      ...config,
      guildId,
      modules: {
        ...(existingConfig.modules || {}),
        ...(config.modules || {}),
      },
      welcomeSystem: config.welcomeSystem
        ? { ...(existingConfig.welcomeSystem || {}), ...config.welcomeSystem }
        : existingConfig.welcomeSystem,
      logging: config.logging
        ? { ...(existingConfig.logging || {}), ...config.logging }
        : existingConfig.logging,
      moderation: config.moderation
        ? { ...(existingConfig.moderation || {}), ...config.moderation }
        : existingConfig.moderation,
      economy: config.economy
        ? { ...(existingConfig.economy || {}), ...config.economy }
        : existingConfig.economy,
      autoContent: config.autoContent
        ? { ...(existingConfig.autoContent || {}), ...config.autoContent }
        : existingConfig.autoContent,
    };

    fs.writeFileSync(filePath, JSON.stringify(mergedConfig, null, 2), 'utf8');
    res.json({ success: true, guildId, message: `Zapisano i zaktualizowano servers/${guildId}.json`, config: mergedConfig });
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

      // Automatyczny fallback na alternatywne redirectUri (w tym kitekbots.vercel.app i http/https)
      const candidateUris: string[] = [];
      if (redirectUri.startsWith('http://')) {
        candidateUris.push(redirectUri.replace('http://', 'https://'));
      } else if (redirectUri.startsWith('https://')) {
        candidateUris.push(redirectUri.replace('https://', 'http://'));
      }
      candidateUris.push('https://kitekbots.vercel.app/auth/callback');
      candidateUris.push('https://kitekbots.vercel.app/api/auth/discord/callback');

      let retrySucceeded = false;
      if (errorData.includes('redirect_uri')) {
        for (const candidate of candidateUris) {
          if (candidate === redirectUri) continue;
          console.log('Retrying exchange with alternative redirectUri:', candidate);
          const altParams = new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: candidate,
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
            retrySucceeded = true;
            break;
          }
        }
      }

      if (!tokenResponse.ok && !retrySucceeded) {
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

export default app;
