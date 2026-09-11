import { DiscordUser, DiscordServer } from '../types';

export const DISCORD_CLIENT_ID = '1368350667634376785';

export function getCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

export function getBotInviteUrl(guildId?: string): string {
  const base = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=8&integration_type=0&scope=bot+applications.commands`;
  if (guildId) {
    return `${base}&guild_id=${guildId}&disable_guild_select=true`;
  }
  return base;
}

export async function fetchDiscordAuthUrl(redirectUri?: string): Promise<string> {
  const finalRedirectUri = redirectUri || getCallbackUrl();
  try {
    const res = await fetch(`/api/auth/discord/url?redirect_uri=${encodeURIComponent(finalRedirectUri)}`);
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
  } catch (err) {
    console.warn('Could not fetch auth url from server endpoint, falling back to direct URL:', err);
  }

  // Fallback direct URL if server API not ready
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: finalRedirectUri,
    response_type: 'code',
    scope: 'identify email guilds',
    prompt: 'consent',
    state: encodeURIComponent(finalRedirectUri),
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeDiscordCode(code: string, redirectUri?: string): Promise<{
  user: DiscordUser;
  guilds: DiscordServer[];
  accessToken: string;
}> {
  const finalRedirectUri = redirectUri || getCallbackUrl();
  const res = await fetch('/api/auth/discord/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      redirect_uri: finalRedirectUri,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Błąd autoryzacji Discord: ${errText}`);
  }

  const data = await res.json();
  return {
    user: {
      ...data.user,
      isDiscordLogged: true,
    },
    guilds: data.guilds || [],
    accessToken: data.accessToken,
  };
}

// Storage helpers
const STORAGE_USER_KEY = 'kitek_discord_user_v2';
const STORAGE_GUILDS_KEY = 'kitek_discord_guilds_v2';

export function saveDiscordSession(user: DiscordUser, guilds: DiscordServer[]) {
  try {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    localStorage.setItem(STORAGE_GUILDS_KEY, JSON.stringify(guilds));
  } catch (e) {
    console.error('Failed to save Discord session to localStorage:', e);
  }
}

export function loadDiscordSession(): { user: DiscordUser | null; guilds: DiscordServer[] | null } {
  try {
    const u = localStorage.getItem(STORAGE_USER_KEY);
    const g = localStorage.getItem(STORAGE_GUILDS_KEY);
    return {
      user: u ? JSON.parse(u) : null,
      guilds: g ? JSON.parse(g) : null,
    };
  } catch {
    return { user: null, guilds: null };
  }
}

export function clearDiscordSession() {
  try {
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_GUILDS_KEY);
  } catch (e) {
    console.error('Failed to clear Discord session from localStorage:', e);
  }
}

export function convertDiscordGuildsToServers(guilds: any[]): DiscordServer[] {
  if (!Array.isArray(guilds)) return [];
  return guilds
    .filter((g) => {
      if (g.permissions !== undefined && g.permissions !== null) {
        const perms = BigInt(g.permissions || '0');
        const isOwner = Boolean(g.owner);
        const isAdmin = (perms & 0x8n) === 0x8n;
        const canManageGuild = (perms & 0x20n) === 0x20n;
        return isOwner || isAdmin || canManageGuild;
      }
      if (g.canInviteBot !== undefined || g.hasAdminPermission !== undefined) {
        return Boolean(g.canInviteBot || g.hasAdminPermission || g.owner);
      }
      return true;
    })
    .map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon || '🐱',
      iconUrl: g.iconUrl || (g.icon && g.icon.startsWith('http') ? g.icon : null),
      acronym: g.acronym || g.name?.substring(0, 3)?.toUpperCase() || 'SRV',
      memberCount: g.memberCount || 1,
      channelsCount: g.channelsCount || 10,
      rolesCount: g.rolesCount || 8,
      prefix: g.prefix || '!',
      region: g.region || 'Discord Cloud',
      joinedAt: g.joinedAt || '2025-01-01',
      botStatus: g.botStatus || 'online',
      hasAdminPermission: Boolean(g.hasAdminPermission),
      canInviteBot: Boolean(g.canInviteBot ?? g.hasAdminPermission),
      botJoined: Boolean(g.botJoined),
      isRealGuild: true,
      active: Boolean(g.active),
    }));
}
