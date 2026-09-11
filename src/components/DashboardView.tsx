import { useState } from 'react';
import {
  UserPlus,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Shield,
  Layers,
  ShieldAlert,
  Coins,
  Radio,
  Server,
  Terminal,
  ExternalLink,
  AlertTriangle,
  Bot,
} from 'lucide-react';
import { WelcomeSystemModal } from './WelcomeSystemModal';
import { BotRequiredModal } from './BotRequiredModal';
import { DiscordServer } from '../types';
import { getBotInviteUrl } from '../services/discordAuth';

interface DashboardViewProps {
  currentEdition: string;
  onOpenChangelog: () => void;
  activeSubdomain: string;
  isWelcomeModalOpen?: boolean;
  onCloseWelcomeModal?: () => void;
  onOpenWelcomeModal?: () => void;
  onOpenWelcomeSystem?: () => void;
  onOpenLoggingSystem?: () => void;
  onOpenEmbedCreator?: () => void;
  onOpenModerationSystem?: () => void;
  onOpenEconomySystem?: () => void;
  onOpenAutoContent?: () => void;
  servers?: DiscordServer[];
  selectedServerId?: string;
  onSelectServer?: (id: string) => void;
  onOpenIdeas?: () => void;
  onNavigateToServers?: () => void;
  onMarkBotJoined?: (serverId: string) => void;
}

export const DashboardView = ({
  isWelcomeModalOpen: externalWelcomeOpen,
  onCloseWelcomeModal,
  onOpenWelcomeModal,
  onOpenWelcomeSystem,
  onOpenLoggingSystem,
  onOpenEmbedCreator,
  onOpenModerationSystem,
  onOpenEconomySystem,
  onOpenAutoContent,
  servers = [],
  selectedServerId,
  onSelectServer,
  onNavigateToServers,
  onMarkBotJoined,
}: DashboardViewProps) => {
  const [internalWelcomeOpen, setInternalWelcomeOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showBotRequired, setShowBotRequired] = useState(false);

  const currentServer = servers.find((s) => s.id === (selectedServerId || servers[0]?.id)) || servers[0];

  const requireBotOrRun = (action?: () => void) => {
    if (currentServer && currentServer.botJoined === false) {
      setShowBotRequired(true);
      return;
    }
    if (action) action();
  };

  const isWelcomeOpen = externalWelcomeOpen ?? internalWelcomeOpen;

  const handleOpenWelcome = () => {
    if (onOpenWelcomeSystem) {
      onOpenWelcomeSystem();
    } else if (onOpenWelcomeModal) {
      onOpenWelcomeModal();
    } else {
      setInternalWelcomeOpen(true);
    }
  };

  const handleCloseWelcome = () => {
    if (onCloseWelcomeModal) {
      onCloseWelcomeModal();
    } else {
      setInternalWelcomeOpen(false);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex-1 bg-[#1a1d21] text-white px-5 sm:px-7 py-6 h-full overflow-y-auto min-h-0 w-full">
      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#15181a] border border-emerald-500/80 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-mono font-bold animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Rozciągnięte od boku do boku z lekką przerwą */}
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="border-b border-[#2b2f35] pb-5">
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">
              DASHBOARD • MAIN
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Zarządzanie botem i serwerem
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Przejdź do konfiguracji modułów i systemów bota.
            </p>
          </div>
        </div>

        {/* Banner Aktywnego Serwera z możliwością zmiany i Invite Bot */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#17231c] via-[#151c22] to-[#181d24] border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0 overflow-hidden shadow-inner">
              {currentServer?.iconUrl ? (
                <img src={currentServer.iconUrl} alt={currentServer.name} className="w-full h-full object-cover" />
              ) : (
                <span>{currentServer?.icon || '🐱'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{currentServer?.name || 'Wybierz serwer'}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                  AKTYWNY SERWER
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-3 font-mono">
                <span>{currentServer?.memberCount.toLocaleString() || 0} członków</span>
                <span>•</span>
                <span>Prefix: <strong className="text-emerald-400">{currentServer?.prefix || '!'}</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-emerald-400">{currentServer?.botStatus === 'online' ? 'Online' : 'Gotowy'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onNavigateToServers && (
              <button
                type="button"
                onClick={onNavigateToServers}
                className="px-3.5 py-2 rounded-xl bg-[#20252c] hover:bg-[#282f38] text-zinc-200 text-xs font-semibold border border-[#2f3542] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>Przełącz serwer ({servers.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (currentServer?.botJoined === false) {
                  setShowBotRequired(true);
                } else {
                  window.open(getBotInviteUrl(currentServer?.id), '_blank');
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Invite Bot</span>
            </button>
          </div>
        </div>

        {/* Banner Ostrzegawczy gdy bot nie jest dodany na ten serwer */}
        {currentServer && currentServer.botJoined === false && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/70 via-[#231518] to-[#1a1416] border border-red-500/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-red-400">BŁĄD: Bot nie został dodany na ten serwer!</span>
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-mono font-bold">
                    WYMAGANA AKCJA
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  Aby móc konfigurować moduły oraz wygenerować plik <code className="text-amber-400 font-mono">servers/{currentServer.id}.json</code> dla serwera <strong className="text-white font-mono">{currentServer.name}</strong>, musisz najpierw dodać bota Kitek na serwer.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowBotRequired(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-500/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Bot className="w-4 h-4" />
                <span>Dodaj Bota na Serwer</span>
              </button>
            </div>
          </div>
        )}

        {/* Sekcja Moduły */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
            MODULES (FUNKCJE BOTA)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {/* Karta Welcome System */}
            <div
              id="module-welcome-system"
              onClick={() => requireBotOrRun(handleOpenWelcome)}
              className="group cursor-pointer rounded-xl bg-[#20242a] hover:bg-[#262b32] border border-[#2b3038] hover:border-emerald-500/60 p-5 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Aktywny</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Welcome System
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Automatyczne powitania, pożegnania, role oraz cichy Auto Ping (Ghost Ping) na wybranych kanałach.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2b3038] flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-500 font-mono">Kanał: #powitania</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    requireBotOrRun(handleOpenWelcome);
                  }}
                  className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Zarządzaj</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Karta Logging System */}
            <div
              id="module-logging-system"
              onClick={() => requireBotOrRun(onOpenLoggingSystem)}
              className="group cursor-pointer rounded-xl bg-[#20242a] hover:bg-[#262b32] border border-[#2b3038] hover:border-emerald-500/60 p-5 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>2 Formaty</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Logging System
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Audyt zdarzeń (wiadomości, bany, role, kanały) w formacie zwykłego tekstu lub nowoczesnych Embed v2.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2b3038] flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-500 font-mono">Kanał: #logi-serwera</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    requireBotOrRun(onOpenLoggingSystem);
                  }}
                  className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Zarządzaj</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Karta Embed Creator */}
            <div
              id="module-embed-creator"
              onClick={() => requireBotOrRun(onOpenEmbedCreator)}
              className="group cursor-pointer rounded-xl bg-[#20242a] hover:bg-[#262b32] border border-[#2b3038] hover:border-emerald-500/60 p-5 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Live Builder</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Embed Creator
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Wizualny edytor Discord Components v2 z podglądem na żywo i bezpośrednią wysyłką na kanały.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2b3038] flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-500 font-mono">Components v2</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    requireBotOrRun(onOpenEmbedCreator);
                  }}
                  className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Otwórz Kreator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Karta Moderacja & Automod */}
            <div
              id="module-moderation-system"
              onClick={() => requireBotOrRun(onOpenModerationSystem)}
              className="group cursor-pointer rounded-xl bg-[#20242a] hover:bg-[#262b32] border border-[#2b3038] hover:border-emerald-500/60 p-5 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Taryfikator Kar</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Moderacja & Automod
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Taryfa kar i warnów (Ban, Kick, Timeout, Mute, Purge, Lock), Anti-Spam, Anti-Raid, Anti-Link i czarna lista słów.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2b3038] flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-500 font-mono">Drabina Warnów</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    requireBotOrRun(onOpenModerationSystem);
                  }}
                  className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Konfiguruj Taryfę</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Karta Ekonomia System */}
            <div
              id="module-economy-system"
              onClick={() => requireBotOrRun(onOpenEconomySystem)}
              className="group cursor-pointer rounded-xl bg-[#20242a] hover:bg-[#262b32] border border-[#2b3038] hover:border-emerald-500/60 p-5 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Coins className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Bank & Sklep</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Ekonomia System
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Wirtualna waluta, zarobki /daily, /work, /crime, /rob, kasyno, oprocentowany bank oraz sklep serwerowy z rolami.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2b3038] flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-500 font-mono">Waluta: 🪙</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    requireBotOrRun(onOpenEconomySystem);
                  }}
                  className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Panel Ekonomii</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Karta Auto-Kontent */}
            <div
              id="module-auto-content"
              onClick={() => requireBotOrRun(onOpenAutoContent)}
              className="group cursor-pointer rounded-xl bg-[#20242a] hover:bg-[#262b32] border border-[#2b3038] hover:border-emerald-500/60 p-5 transition-all flex flex-col justify-between min-h-[170px]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Radio className="w-5 h-5" />
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>3 Ramki Cool-down</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Auto-Kontent
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    3 widoczne ramki z ustawieniem kanału i czasu cool-down oraz biblioteka kontentów (nazwa + link lub plik bota).
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2b3038] flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-500 font-mono">3 Sloty Publikacji</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    requireBotOrRun(onOpenAutoContent);
                  }}
                  className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Zarządzaj Kontentem</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fallback Interactive Welcome System Modal */}
      <WelcomeSystemModal
        isOpen={isWelcomeOpen}
        onClose={handleCloseWelcome}
        onSaveNotice={showNotification}
      />

      {/* Modal Błędu: Wymagane Dodanie Bota na Serwer */}
      <BotRequiredModal
        isOpen={showBotRequired}
        server={currentServer}
        onClose={() => setShowBotRequired(false)}
        onBotAddedSuccessfully={(srvId) => {
          if (onMarkBotJoined) {
            onMarkBotJoined(srvId);
          }
          showNotification(`Bot został pomyślnie dodany na serwer ${currentServer?.name || srvId}!`);
        }}
      />
    </div>
  );
};
