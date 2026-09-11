export interface ChangelogItem {
  version: string;
  tag: string;
  date: string;
  badgeType: 'major' | 'beta' | 'patch' | 'initial';
  title: string;
  description: string;
  changes: {
    category: 'Nowość' | 'Ulepszenie' | 'Poprawka' | 'Bezpieczeństwo';
    text: string;
  }[];
}

export interface DiscordUser {
  id?: string;
  username: string;
  discriminator: string;
  avatarUrl: string;
  role: string;
  isAdmin: boolean;
  email?: string;
  isDiscordLogged?: boolean;
}

export interface DiscordServer {
  id: string;
  name: string;
  icon: string;
  iconUrl?: string | null;
  acronym: string;
  memberCount: number;
  channelsCount: number;
  rolesCount: number;
  prefix: string;
  region: string;
  joinedAt: string;
  botStatus: 'online' | 'limited' | 'offline';
  hasAdminPermission: boolean;
  canInviteBot?: boolean;
  botJoined?: boolean;
  isRealGuild?: boolean;
  active: boolean;
}

export interface BotIdea {
  id: string;
  title: string;
  category: 'Społeczność' | 'Gry & Eventy' | 'Narzędzia' | 'Bezpieczeństwo' | 'AI & Integracje';
  description: string;
  impact: 'Bardzo wysoki' | 'Wysoki' | 'Średni';
  difficulty: 'Łatwy' | 'Średni' | 'Zaawansowany';
  suggestedCommands: string[];
  votes: number;
  tags: string[];
  status: 'Dostępny wkrótce' | 'Propozycja' | 'Gotowy do wdrożenia';
}

export interface BotGuild {
  id: string;
  name: string;
  icon: string;
  memberCount: number;
  subdomain: string;
  active: boolean;
}

export interface BotStats {
  guildsCount: number;
  membersCount: number;
  pingMs: number;
  uptime: string;
  commandsExecuted: number;
  status: 'online' | 'idle' | 'dnd' | 'maintenance';
}

export interface BotModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  category: 'Ochrona' | 'Społeczność' | 'Narzędzia';
}

export interface DiscordBotGatewayStatus {
  online: boolean;
  isAlive: boolean;
  tag: string;
  id: string;
  guildCount: number;
  ping: number;
  lastHeartbeat: number;
  joinedGuildIds: string[];
  syncedGuilds?: { id: string; name: string; memberCount?: number; joinedAt?: string }[];
}
