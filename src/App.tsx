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

  // Stan serwerów Discord (początkowo z sesji lub domyślna baza)
  const [servers, setServers] = useState<DiscordServer[]>(() => {
    const session = loadDiscordSession();
    if (session?.guilds && session.guilds.length > 0) {
      return convertDiscordGuildsToServers(session.guilds);
    }
    return INITIAL_SERVERS;
  });

  const [selectedServerId, setSelectedServerId] = useState<string>(() => {
    const session = loadDiscordSession();
    if (session?.guilds && session.guilds.length > 0) {
      return session.guilds[0].id;
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
      prev.map((s) =>
        s.id === srvId ? { ...s, botJoined: true, botStatus: 'online' } : s
      )
    );
  };

  useEffect(() => {
    const handleLocationRouting = () => {
      const hash = window.location.hash.replace('#', '');
      const pathname = window.location.pathname;

      if (hash === 'servers' || pathname === '/servers') {
        setActivePath('/dashboard');
        setActiveSidebarItem('Servers');
      } else if (hash === 'ideas' || hash === 'pomysly' || pathname === '/ideas' || pathname === '/pomysly') {
        setActivePath('/dashboard');
        setActiveSidebarItem('Pomysły');
      } else if (hash === 'bots' || hash === 'bot' || pathname === '/bots') {
        setActivePath('/dashboard');
        setActiveSidebarItem('Bots');
      } else if (hash === 'welcome' || pathname === '/welcome') {
        setActivePath('/dashboard');
        setActiveSidebarItem('Welcome System');
      } else if (hash === 'logging' || hash === 'logs' || pathname === '/logging' || pathname === '/logs') {
        setActivePath('/dashboard');
        setActiveSidebarItem('Logging System');
      } else if (hash === 'embed' || hash === 'embed-creator' || pathname === '/embed' || pathname === '/embed-creator') {
        setActivePath('/dashboard');
        setActiveSidebarItem('Embed Creator');
      } else if (hash === 'moderation' || hash === 'automod' || pathname === '/moderation') {
        setActivePath('/dashboard');
        setActiveSidebarItem('Moderacja');
      } else if (hash === 'economy' || hash === 'ekonomia' || pathname === '/economy') {
        setActivePath('/dashboard');
        setActiveSidebarItem('Ekonomia System');
      } else if (hash === 'auto-content' || hash === 'autokontent' || hash === 'auto-kontent' || pathname === '/auto-content') {
        setActivePath('/dashboard');
        setActiveSidebarItem('Auto-Kontent');
      } else if (hash === 'login' || pathname === '/login') {
        setActivePath('/login');
      } else if (hash === 'dashboard' || pathname === '/dashboard') {
        setActivePath('/dashboard');
        setActiveSidebarItem('Dashboard');
      }
    };

    window.addEventListener('hashchange', handleLocationRouting);
    handleLocationRouting();

    return () => window.removeEventListener('hashchange', handleLocationRouting);
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
    setActivePath(path);
    if (path === '/dashboard') {
      setActiveSidebarItem('Dashboard');
    }
    window.location.hash = path.replace('/', '');
  };

  const handleLogout = () => {
    clearDiscordSession();
    setUser({
      username: 'Gość',
      discriminator: '0000',
      role: 'Użytkownik',
      isAdmin: false,
    });
    setActivePath('/login');
    window.location.hash = 'login';
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
    setActivePath('/dashboard');
    setActiveSidebarItem('Dashboard');
    window.location.hash = 'dashboard';
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
                  setActiveSidebarItem(item);
                  if (item === 'Servers') {
                    window.location.hash = 'servers';
                  } else if (item === 'Bots') {
                    window.location.hash = 'bots';
                  } else if (item === 'Pomysły') {
                    window.location.hash = 'ideas';
                  } else if (item === 'Welcome System') {
                    window.location.hash = 'welcome';
                  } else if (item === 'Logging System') {
                    window.location.hash = 'logging';
                  } else if (item === 'Embed Creator') {
                    window.location.hash = 'embed';
                  } else if (item === 'Moderacja') {
                    window.location.hash = 'moderation';
                  } else if (item === 'Ekonomia System') {
                    window.location.hash = 'economy';
                  } else if (item === 'Auto-Kontent') {
                    window.location.hash = 'auto-content';
                  } else if (item === 'Dashboard') {
                    window.location.hash = 'dashboard';
                  }
                }}
                activeSubdomain={activeSubdomain}
                onChangeSubdomain={setActiveSubdomain}
                servers={servers}
                selectedServerId={selectedServerId}
                onSelectServer={handleSelectServer}
                onOpenInviteModal={() => {
                  setActiveSidebarItem('Servers');
                  window.location.hash = 'servers';
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
                    setActiveSidebarItem('Dashboard');
                    window.location.hash = 'dashboard';
                  }}
                  onMarkBotJoined={handleMarkBotJoined}
                />
              ) : activeSidebarItem === 'Bots' ? (
                <BotsView
                  servers={servers}
                  selectedServerId={selectedServerId}
                  onSelectServer={handleSelectServer}
                  onBackToDashboard={() => {
                    setActiveSidebarItem('Dashboard');
                    window.location.hash = 'dashboard';
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
                    setActiveSidebarItem('Dashboard');
                    window.location.hash = 'dashboard';
                  }}
                  onNavigateToServers={() => {
                    setActiveSidebarItem('Servers');
                    window.location.hash = 'servers';
                  }}
                />
              ) : activeSidebarItem === 'Welcome System' ? (
                <WelcomeSystemView
                  onBackToDashboard={() => {
                    setActiveSidebarItem('Dashboard');
                    window.location.hash = 'dashboard';
                  }}
                />
              ) : activeSidebarItem === 'Logging System' ? (
                <LoggingSystemView
                  onBackToDashboard={() => {
                    setActiveSidebarItem('Dashboard');
                    window.location.hash = 'dashboard';
                  }}
                />
              ) : activeSidebarItem === 'Embed Creator' ? (
                <EmbedCreatorView
                  onBackToDashboard={() => {
                    setActiveSidebarItem('Dashboard');
                    window.location.hash = 'dashboard';
                  }}
                />
              ) : activeSidebarItem === 'Moderacja' ? (
                <ModerationSystemView
                  onBackToDashboard={() => {
                    setActiveSidebarItem('Dashboard');
                    window.location.hash = 'dashboard';
                  }}
                />
              ) : activeSidebarItem === 'Ekonomia System' ? (
                <EconomySystemView
                  onBackToDashboard={() => {
                    setActiveSidebarItem('Dashboard');
                    window.location.hash = 'dashboard';
                  }}
                />
              ) : activeSidebarItem === 'Auto-Kontent' ? (
                <AutoContentSystemView
                  onBackToDashboard={() => {
                    setActiveSidebarItem('Dashboard');
                    window.location.hash = 'dashboard';
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
                    setActiveSidebarItem('Servers');
                    window.location.hash = 'servers';
                  }}
                  onOpenWelcomeSystem={() => {
                    setActiveSidebarItem('Welcome System');
                    window.location.hash = 'welcome';
                  }}
                  onOpenLoggingSystem={() => {
                    setActiveSidebarItem('Logging System');
                    window.location.hash = 'logging';
                  }}
                  onOpenEmbedCreator={() => {
                    setActiveSidebarItem('Embed Creator');
                    window.location.hash = 'embed';
                  }}
                  onOpenModerationSystem={() => {
                    setActiveSidebarItem('Moderacja');
                    window.location.hash = 'moderation';
                  }}
                  onOpenEconomySystem={() => {
                    setActiveSidebarItem('Ekonomia System');
                    window.location.hash = 'economy';
                  }}
                  onOpenAutoContent={() => {
                    setActiveSidebarItem('Auto-Kontent');
                    window.location.hash = 'auto-content';
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
