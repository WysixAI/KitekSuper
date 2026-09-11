import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChangelogModal } from './components/ChangelogModal';
import { DashboardView } from './components/DashboardView';
import { WelcomeSystemView } from './components/WelcomeSystemView';
import { LoggingSystemView } from './components/LoggingSystemView';
import { EmbedCreatorView } from './components/EmbedCreatorView';
import { ModerationSystemView } from './components/ModerationSystemView';
import { EconomySystemView } from './components/EconomySystemView';
import { AutoContentSystemView } from './components/AutoContentSystemView';
import { ServersView } from './components/ServersView';
import { IdeasView } from './components/IdeasView';
import { BotsView } from './components/BotsView';
import { LoginView } from './components/LoginView';
import { BotRequiredModal } from './components/BotRequiredModal';
import { DiscordUser, DiscordServer } from './types';
import { INITIAL_SERVERS } from './data/botData';
import {
  loadDiscordSession,
  clearDiscordSession,
  convertDiscordGuildsToServers,
  getBotInviteUrl,
} from './services/discordAuth';

export default function App() {
  const [activePath, setActivePath] = useState<'/dashboard' | '/login'>('/dashboard');
  const [currentEdition] = useState<string>('Kitek 1.0');
  const [activeSubdomain, setActiveSubdomain] = useState<string>('bot.kitek.pl');
  const [isChangelogOpen, setIsChangelogOpen] = useState<boolean>(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('Dashboard');

  // Załaduj sesję użytkownika z OAuth jeśli istnieje
  const [user, setUser] = useState<DiscordUser>(() => {
    const session = loadDiscordSession();
    return session?.user || {
      username: 'KitekDev',
      discriminator: '1337',
      avatarUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=120&auto=format&fit=crop&q=80',
      role: 'Właściciel Bota (Owner)',
      isAdmin: true,
    };
  });

  // Stan serwerów Discord (początkowo z sesji lub domyślna baza z realnymi ID Discord)
  const [servers, setServers] = useState<DiscordServer[]>(() => {
    const session = loadDiscordSession();
    if (session?.guilds && session.guilds.length > 0) {
      const validGuilds = session.guilds.filter((g) => !g.id.startsWith('srv-'));
      if (validGuilds.length > 0) {
        return convertDiscordGuildsToServers(validGuilds);
      }
    }
    return INITIAL_SERVERS;
  });

  const [selectedServerId, setSelectedServerId] = useState<string>(() => {
    const session = loadDiscordSession();
    if (session?.guilds && session.guilds.length > 0) {
      const valid = session.guilds.find((g) => !g.id.startsWith('srv-'));
      if (valid) return valid.id;
    }
    return INITIAL_SERVERS[0].id;
  });

  const [botRequiredServer, setBotRequiredServer] = useState<DiscordServer | null>(null);

  const handleSelectServer = (id: string, force = false) => {
    const target = servers.find((s) => s.id === id);
    if (!force && target && target.botJoined === false) {
      // Wyskakuje error że trzeba dodać bota na ten serwer!
      setBotRequiredServer(target);
      return;
    }
    setSelectedServerId(id);
    setServers((prev) =>
      prev.map((s) => ({
        ...s,
        active: s.id === id,
      }))
    );
  };

  const handleMarkBotJoined = (srvId: string) => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id === srvId) {
          const channels = s.channels && s.channels.length > 0 ? s.channels : [
            { id: 'c1', name: 'powitania', type: 'text' },
            { id: 'c2', name: 'ogólny', type: 'text' },
            { id: 'c3', name: 'ogłoszenia', type: 'text' }
          ];
          const roles = s.roles && s.roles.length > 0 ? s.roles : [
            { id: 'r1', name: 'Użytkownik', color: '#99aab5' },
            { id: 'r2', name: 'VIP', color: '#f1c40f' },
            { id: 'r3', name: 'Moderator', color: '#e74c3c' }
          ];
          return { ...s, botJoined: true, botStatus: 'online', channels, roles };
        }
        return s;
      })
    );
  };

  const pathToViewMap: Record<string, { activePath: '/dashboard' | '/login'; sidebarItem: string }> = {
    '/dashboard': { activePath: '/dashboard', sidebarItem: 'Dashboard' },
    '/': { activePath: '/dashboard', sidebarItem: 'Dashboard' },
    '/servers': { activePath: '/dashboard', sidebarItem: 'Servers' },
    '/bots': { activePath: '/dashboard', sidebarItem: 'Bots' },
    '/ideas': { activePath: '/dashboard', sidebarItem: 'Pomysły' },
    '/pomysly': { activePath: '/dashboard', sidebarItem: 'Pomysły' },
    '/welcome': { activePath: '/dashboard', sidebarItem: 'Welcome System' },
    '/logging': { activePath: '/dashboard', sidebarItem: 'Logging System' },
    '/logs': { activePath: '/dashboard', sidebarItem: 'Logging System' },
    '/embed': { activePath: '/dashboard', sidebarItem: 'Embed Creator' },
    '/embed-creator': { activePath: '/dashboard', sidebarItem: 'Embed Creator' },
    '/moderation': { activePath: '/dashboard', sidebarItem: 'Moderacja' },
    '/automod': { activePath: '/dashboard', sidebarItem: 'Moderacja' },
    '/economy': { activePath: '/dashboard', sidebarItem: 'Ekonomia System' },
    '/ekonomia': { activePath: '/dashboard', sidebarItem: 'Ekonomia System' },
    '/auto-content': { activePath: '/dashboard', sidebarItem: 'Auto-Kontent' },
    '/autokontent': { activePath: '/dashboard', sidebarItem: 'Auto-Kontent' },
    '/login': { activePath: '/login', sidebarItem: 'Dashboard' },
  };

  const sidebarItemToPathMap: Record<string, string> = {
    'Dashboard': '/dashboard',
    'Servers': '/servers',
    'Bots': '/bots',
    'Pomysły': '/ideas',
    'Welcome System': '/welcome',
    'Logging System': '/logging',
    'Embed Creator': '/embed',
    'Moderacja': '/moderation',
    'Ekonomia System': '/economy',
    'Auto-Kontent': '/auto-content',
  };

  const handleLocationRouting = () => {
    let currentPath = window.location.pathname;

    // Automatyczne usuwanie znaku '#' i przekształcanie starych linków (np. #dashboard -> /dashboard)
    if (window.location.hash) {
      const hashContent = window.location.hash.replace(/^#\/?/, '');
      if (hashContent) {
        currentPath = '/' + hashContent;
      }
      try {
        window.history.replaceState(null, '', currentPath);
      } catch {}
    }

    const cleanPath = currentPath.endsWith('/') && currentPath.length > 1 ? currentPath.slice(0, -1) : currentPath;
    const match = pathToViewMap[cleanPath] || pathToViewMap[currentPath];

    if (match) {
      setActivePath(match.activePath);
      setActiveSidebarItem(match.sidebarItem);
    } else {
      setActivePath('/dashboard');
      setActiveSidebarItem('Dashboard');
    }
  };

  const navigate = (path: string, replace = false) => {
    try {
      if (replace || window.location.pathname === path) {
        window.history.replaceState(null, '', path);
      } else {
        window.history.pushState(null, '', path);
      }
    } catch {}
    handleLocationRouting();
  };

  useEffect(() => {
    window.addEventListener('popstate', handleLocationRouting);
    window.addEventListener('hashchange', handleLocationRouting);
    handleLocationRouting();

    return () => {
      window.removeEventListener('popstate', handleLocationRouting);
      window.removeEventListener('hashchange', handleLocationRouting);
    };
  }, []);

  // Cross-window auth event listener (handles completion from Discord OAuth popup)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('kitek_discord_auth');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'LOGIN_SUCCESS') {
          handleLoginSuccess(event.data.user, event.data.guilds);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'kitek_discord_auth_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.type === 'LOGIN_SUCCESS') {
            handleLoginSuccess(parsed.user, parsed.guilds);
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Automatyczna synchronizacja statusu dołączenia bota (z wykrywania guildCreate)
  useEffect(() => {
    const syncBotStatus = async () => {
      try {
        const res = await fetch('/api/bot/status');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.joinedGuildIds) && data.joinedGuildIds.length > 0) {
            const joinedSet = new Set(data.joinedGuildIds);
            setServers((prev) => {
              let hasChanged = false;
              const next = prev.map((s) => {
                const isJoined = joinedSet.has(s.id);
                if (s.botJoined !== isJoined) {
                  hasChanged = true;
                  return { ...s, botJoined: isJoined };
                }
                return s;
              });
              return hasChanged ? next : prev;
            });
          }
        }
      } catch {}
    };

    syncBotStatus();
    const interval = setInterval(syncBotStatus, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (path: '/dashboard' | '/login') => {
    navigate(path);
  };

  const handleLogout = () => {
    clearDiscordSession();
    setUser({
      username: 'Gość',
      discriminator: '0000',
      role: 'Użytkownik',
      isAdmin: false,
    });
    navigate('/login');
  };

  const handleLoginSuccess = (discordUser?: DiscordUser, discordGuilds?: DiscordServer[]) => {
    if (discordUser) {
      setUser(discordUser);
    } else {
      const session = loadDiscordSession();
      if (session?.user) {
        setUser(session.user);
      }
    }

    if (discordGuilds && discordGuilds.length > 0) {
      const realServers = convertDiscordGuildsToServers(discordGuilds);
      setServers(realServers);
      if (realServers.length > 0) {
        setSelectedServerId(realServers[0].id);
      }
    } else {
      const session = loadDiscordSession();
      if (session?.guilds && session.guilds.length > 0) {
        const realServers = convertDiscordGuildsToServers(session.guilds);
        setServers(realServers);
        if (realServers.length > 0) {
          setSelectedServerId(realServers[0].id);
        }
      }
    }
    navigate('/dashboard');
  };

  return (
    <div className="h-screen bg-[#16181b] text-white flex flex-col selection:bg-emerald-500 selection:text-black overflow-hidden">
      {/* Top Navigation Bar */}
      <Navbar
        currentEdition={currentEdition}
        onOpenChangelog={() => setIsChangelogOpen(true)}
        user={user}
        onLogout={handleLogout}
        activePath={activePath}
        onNavigate={handleNavigate}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activePath === '/dashboard' ? (
          <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
            {/* Left Sidebar (fixed, never scrolls with the dashboard content) */}
            <div className="hidden md:block h-full shrink-0">
              <Sidebar
                activeItem={activeSidebarItem}
                onSelectItem={(item) => {
                  const targetPath = sidebarItemToPathMap[item] || '/dashboard';
                  navigate(targetPath);
                }}
                activeSubdomain={activeSubdomain}
                onChangeSubdomain={setActiveSubdomain}
                servers={servers}
                selectedServerId={selectedServerId}
                onSelectServer={handleSelectServer}
                onOpenInviteModal={() => {
                  navigate('/servers');
                }}
              />
            </div>

            {/* Center / Right Content Area */}
            <div className="flex-1 h-full min-h-0 overflow-hidden flex flex-col">
              {activeSidebarItem === 'Servers' ? (
                <ServersView
                  servers={servers}
                  selectedServerId={selectedServerId}
                  onSelectServer={handleSelectServer}
                  onBackToDashboard={() => {
                    navigate('/dashboard');
                  }}
                  onMarkBotJoined={handleMarkBotJoined}
                />
              ) : activeSidebarItem === 'Bots' ? (
                <BotsView
                  servers={servers}
                  selectedServerId={selectedServerId}
                  onSelectServer={handleSelectServer}
                  onBackToDashboard={() => {
                    navigate('/dashboard');
                  }}
                  onRefreshServers={() => {
                    fetch('/api/bot/status')
                      .then((r) => r.json())
                      .then((data) => {
                        if (Array.isArray(data.joinedGuildIds)) {
                          const jSet = new Set(data.joinedGuildIds);
                          setServers((prev) =>
                            prev.map((s) => ({
                              ...s,
                              botJoined: jSet.has(s.id),
                            }))
                          );
                        }
                      })
                      .catch(() => {});
                  }}
                />
              ) : activeSidebarItem === 'Pomysły' ? (
                <IdeasView
                  onBackToDashboard={() => {
                    navigate('/dashboard');
                  }}
                  onNavigateToServers={() => {
                    navigate('/servers');
                  }}
                />
              ) : activeSidebarItem === 'Welcome System' ? (
                <WelcomeSystemView
                  onBackToDashboard={() => {
                    navigate('/dashboard');
                  }}
                />
              ) : activeSidebarItem === 'Logging System' ? (
                <LoggingSystemView
                  onBackToDashboard={() => {
                    navigate('/dashboard');
                  }}
                />
              ) : activeSidebarItem === 'Embed Creator' ? (
                <EmbedCreatorView
                  onBackToDashboard={() => {
                    navigate('/dashboard');
                  }}
                />
              ) : activeSidebarItem === 'Moderacja' ? (
                <ModerationSystemView
                  onBackToDashboard={() => {
                    navigate('/dashboard');
                  }}
                />
              ) : activeSidebarItem === 'Ekonomia System' ? (
                <EconomySystemView
                  onBackToDashboard={() => {
                    navigate('/dashboard');
                  }}
                />
              ) : activeSidebarItem === 'Auto-Kontent' ? (
                <AutoContentSystemView
                  onBackToDashboard={() => {
                    navigate('/dashboard');
                  }}
                />
              ) : (
                <DashboardView
                  currentEdition={currentEdition}
                  onOpenChangelog={() => setIsChangelogOpen(true)}
                  activeSubdomain={activeSubdomain}
                  servers={servers}
                  selectedServerId={selectedServerId}
                  onSelectServer={handleSelectServer}
                  onNavigateToServers={() => {
                    navigate('/servers');
                  }}
                  onOpenWelcomeSystem={() => {
                    navigate('/welcome');
                  }}
                  onOpenLoggingSystem={() => {
                    navigate('/logging');
                  }}
                  onOpenEmbedCreator={() => {
                    navigate('/embed');
                  }}
                  onOpenModerationSystem={() => {
                    navigate('/moderation');
                  }}
                  onOpenEconomySystem={() => {
                    navigate('/economy');
                  }}
                  onOpenAutoContent={() => {
                    navigate('/auto-content');
                  }}
                  onMarkBotJoined={handleMarkBotJoined}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <LoginView
              onLoginSuccess={handleLoginSuccess}
              currentEdition={currentEdition}
              activeSubdomain={activeSubdomain}
            />
          </div>
        )}
      </main>

      {/* Modal Błędu: Wymagane Dodanie Bota na Serwer przy wyborze w Sidebarze / Menu */}
      <BotRequiredModal
        isOpen={!!botRequiredServer}
        server={botRequiredServer}
        onClose={() => setBotRequiredServer(null)}
        onBotAddedSuccessfully={(srvId) => {
          handleMarkBotJoined(srvId);
          handleSelectServer(srvId, true);
        }}
      />

      {/* Changelog Modal */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
        currentEdition={currentEdition}
      />
    </div>
  );
}
