import { useState } from 'react';
import {
  Server,
  ArrowLeft,
  CheckCircle2,
  Users,
  Hash,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Plus,
  Search,
  Layers,
  Wifi,
  Bot,
  Globe,
  Copy,
  Check,
  Zap,
  Sliders,
  Settings,
} from 'lucide-react';
import { DiscordServer } from '../types';
import { CustomSelect } from './CustomSelect';
import { BotRequiredModal } from './BotRequiredModal';
import {
  getBotInviteUrl,
  DISCORD_CLIENT_ID,
  getCallbackUrl,
} from '../services/discordAuth';

interface ServersViewProps {
  servers: DiscordServer[];
  selectedServerId: string;
  onSelectServer: (serverId: string) => void;
  onBackToDashboard: () => void;
  onInviteBot?: (serverId?: string) => void;
  onMarkBotJoined?: (serverId: string) => void;
}

export const ServersView = ({
  servers,
  selectedServerId,
  onSelectServer,
  onBackToDashboard,
  onInviteBot,
  onMarkBotJoined,
}: ServersViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalGuildId, setModalGuildId] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [requiredBotServer, setRequiredBotServer] = useState<DiscordServer | null>(null);

  // Filtrujemy tylko serwery, na których użytkownik MA uprawnienia do dodania bota (Admin / Manage Guild / Owner)
  const allowedServers = servers.filter(
    (s) => s.canInviteBot !== false && (s.canInviteBot || s.hasAdminPermission)
  );

  const activeServer = allowedServers.find((s) => s.id === selectedServerId) || allowedServers[0];

  const filteredServers = allowedServers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSwitchServer = (id: string) => {
    const target = allowedServers.find((s) => s.id === id);
    onSelectServer(id);
    if (target) {
      showToast(`Przełączono aktywny serwer na: ${target.name}`);
    }
  };

  const handleInviteForServer = (srvId?: string) => {
    const inviteUrl = getBotInviteUrl(srvId);
    window.open(inviteUrl, '_blank');
    if (srvId && onMarkBotJoined) {
      onMarkBotJoined(srvId);
    }
    if (srvId && onSelectServer) {
      onSelectServer(srvId);
    }
    if (onInviteBot) {
      onInviteBot(srvId);
    }
    showToast('Bot został pomyślnie dodany! Przekierowywanie do konfiguracji...');
    setTimeout(() => {
      if (onBackToDashboard) {
        onBackToDashboard();
      }
    }, 400);
  };

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(getCallbackUrl());
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2500);
  };

  return (
    <div className="flex-1 bg-[#1a1d21] text-white px-5 sm:px-7 py-6 h-full overflow-y-auto min-h-0 w-full">
      {/* Toast Notyfikacja */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs shadow-2xl animate-in slide-in-from-top-3 duration-150">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
        {/* Górny Pasek Nawigacji */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262b32] pb-5">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="p-2 rounded-lg bg-[#20242a] hover:bg-[#282e36] text-zinc-400 hover:text-white border border-[#2d333d] transition-colors cursor-pointer"
              title="Powrót do Dashboardu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Server className="w-4 h-4" />
                </div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Wybór Serwera (Servers)
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-mono font-semibold">
                  {allowedServers.length} serwerów
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Sprawdź uprawnienia do dodawania bota, wybierz serwer roboczy lub zaproś bota Kitek na nowy serwer.
              </p>
            </div>
          </div>

          {/* Przycisk Zaproś Bota (Zawsze widoczny na górze) */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setModalGuildId(undefined);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Invite Bot (Dodaj serwer)</span>
            </button>
          </div>
        </div>

        {/* Callback URL Banner dla tego środowiska */}
        <div className="p-3.5 rounded-xl bg-[#15181c] border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-zinc-200">Callback URL tej instancji serwera: </span>
              <span className="font-mono text-emerald-400 text-[11px] select-all bg-[#0e1012] px-2 py-0.5 rounded border border-[#23272f]">
                {getCallbackUrl()}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyCallback}
            className="self-start md:self-auto px-3 py-1.5 rounded-lg bg-[#20252c] hover:bg-emerald-500 hover:text-black text-emerald-300 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 border border-[#2f3542] shrink-0 cursor-pointer"
          >
            {copiedCallback ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Skopiowano callback!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Kopiuj Callback</span>
              </>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SEKCJA 1: GŁÓWNE SELECT MENU WYBORU SERWERA Z AKCJAMI INVITE               */}
        {/* ========================================================================= */}
        <div className="p-5 rounded-2xl bg-[#20242a] border border-[#2d333d] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Menu wyboru serwera (Select Menu):</span>
              </label>
              <p className="text-xs text-zinc-400">
                Wybierz serwer, na którym bot jest aktywny, lub kliknij <strong>Invite</strong> przy serwerze z uprawnieniami.
              </p>
            </div>

            {/* CustomSelect z obsługą Invite oraz stałym Invite Bot na dole */}
            <div className="min-w-[300px] sm:min-w-[380px]">
              <CustomSelect
                value={selectedServerId}
                onChange={(val) => handleSwitchServer(val)}
                options={allowedServers.map((srv) => {
                  const needsInvite = srv.canInviteBot && srv.botJoined === false;
                  return {
                    value: srv.id,
                    label: srv.name,
                    icon: srv.icon,
                    image: srv.iconUrl,
                    description: needsInvite
                      ? 'Wymaga dodania bota (Masz uprawnienia)'
                      : `${srv.memberCount.toLocaleString()} członków`,
                    badge: needsInvite ? 'Invite' : srv.botStatus === 'online' ? 'Online' : 'Aktywny',
                    badgeVariant: needsInvite ? 'invite' : 'default',
                    actionButton: needsInvite
                      ? {
                          label: 'Invite',
                          title: 'Zaproś bota Kitek na ten serwer',
                          onClick: () => handleInviteForServer(srv.id),
                        }
                      : undefined,
                  };
                })}
                footerAction={{
                  label: '+ Invite Bot (Dodaj bota do nowego serwera)',
                  icon: Plus,
                  onClick: () => {
                    setModalGuildId(undefined);
                    setShowAddModal(true);
                  },
                }}
                size="lg"
                triggerClassName="bg-[#16181b] border-2 border-[#2d333d] px-4 py-2.5 rounded-xl shadow-inner"
                ariaLabel="Wybierz serwer z listy"
              />
            </div>
          </div>

          {/* Podsumowanie aktualnie wybranego serwera */}
          {activeServer && (
            <div className="mt-4 p-4 rounded-xl bg-[#16181b] border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shrink-0 shadow-md overflow-hidden">
                  {activeServer.iconUrl ? (
                    <img src={activeServer.iconUrl} alt={activeServer.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{activeServer.icon}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{activeServer.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      AKTYWNY SERWER
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-3 font-mono">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      {activeServer.memberCount.toLocaleString()} członków
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-zinc-500" />
                      {activeServer.channelsCount} kanałów
                    </span>
                    <span className="flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5 text-zinc-500" />
                      {activeServer.region}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-[#20242a] border border-[#2e333d] text-xs font-mono text-zinc-300">
                  Prefix: <span className="text-emerald-400 font-bold">{activeServer.prefix}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[#20242a] border border-[#2e333d] text-xs font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-300">
                    {activeServer.hasAdminPermission ? 'Admin / Właściciel' : 'Uprawniony'}
                  </span>
                </div>
                {activeServer.botJoined ? (
                  <button
                    type="button"
                    onClick={onBackToDashboard}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Konfiguruj ten serwer</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleInviteForServer(activeServer.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Dodaj bota & Konfiguruj</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SEKCJA 2: LISTA KAFELKÓW WSZYSTKICH SERWERÓW                               */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                Twoje Serwery Discord ({filteredServers.length})
              </h2>
            </div>

            {/* Wyszukiwarka serwerów */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj serwera..."
                className="w-full bg-[#20242a] border border-[#2e333d] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 font-mono"
              />
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServers.map((srv) => {
              const isSelected = srv.id === selectedServerId;
              const needsInvite = srv.canInviteBot && srv.botJoined === false;
              const canInvite = srv.canInviteBot || srv.hasAdminPermission;

              return (
                <div
                  key={srv.id}
                  onClick={() => handleSwitchServer(srv.id)}
                  className={`rounded-2xl border transition-all cursor-pointer p-5 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#20242a] border-emerald-500/80 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                      : 'bg-[#181a1e] border-[#292e37] hover:bg-[#1f2329] hover:border-[#38404e]'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Górna linia z ikoną i odznaką */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#252a32] border border-[#353c48] flex items-center justify-center text-2xl shadow-sm overflow-hidden">
                          {srv.iconUrl ? (
                            <img src={srv.iconUrl} alt={srv.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{srv.icon}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white leading-tight">
                            {srv.name}
                          </h3>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            ID: {srv.id}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-black text-[10px] font-bold font-mono">
                          AKTYWNY
                        </span>
                      ) : needsInvite ? (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold font-mono">
                          Zaproś Bota
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-[#252a32] text-zinc-400 text-[10px] font-mono border border-[#303743]">
                          Wybierz
                        </span>
                      )}
                    </div>

                    {/* Statystyki serwera */}
                    <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-[#141618] border border-[#242830] text-center">
                      <div>
                        <div className="text-[10px] text-zinc-500 font-mono">Członkowie</div>
                        <div className="text-xs font-bold text-white mt-0.5">
                          {srv.memberCount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500 font-mono">Kanały</div>
                        <div className="text-xs font-bold text-white mt-0.5">
                          {srv.channelsCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500 font-mono">Uprawnienia</div>
                        <div className="text-xs font-bold text-emerald-400 mt-0.5">
                          {canInvite ? 'Admin / Zarządzanie' : 'Członek'}
                        </div>
                      </div>
                    </div>

                    {/* Szczegóły statusu bota */}
                    <div className="space-y-1.5 text-xs text-zinc-400 font-mono">
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Status Bota:</span>
                        {needsInvite ? (
                          <span className="text-amber-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Wymaga zaproszenia
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {srv.botStatus === 'online' ? 'Online & Gotowy' : 'Aktywny'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Uprawnienie do dodania:</span>
                        {canInvite ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Możesz dodać bota
                          </span>
                        ) : (
                          <span className="text-zinc-500 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            Brak uprawnień
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Przycisk akcji: Invite Bot jeśli brak bota, lub Przejdź do konfiguracji gdy bot dodany */}
                  <div className="pt-4 mt-4 border-t border-[#292e37] flex items-center gap-2">
                    {needsInvite ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInviteForServer(srv.id);
                        }}
                        className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-md cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Dodaj bota na ten serwer</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwitchServer(srv.id);
                          if (onBackToDashboard) {
                            onBackToDashboard();
                          }
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md'
                            : 'bg-[#252a32] hover:bg-emerald-500 hover:text-black text-zinc-300'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{isSelected ? 'Przejdź do konfiguracji serwera' : 'Wybierz i konfiguruj'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* SEKCJA 3: ZAWSZE NA DOLE PISZE "INVITE BOT" I WTEDY DODAJE SIĘ SERWER      */}
          {/* ========================================================================= */}
          <div className="mt-8 pt-6 border-t border-[#262b32]">
            <div className="rounded-2xl bg-gradient-to-r from-[#17221b] via-[#141b21] to-[#171d24] border-2 border-emerald-500/40 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
                  <Bot className="w-7 h-7" />
                </div>
                <div className="space-y-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      Invite Bot (Zaproś bota Kitek na serwer)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/40">
                      ID: {DISCORD_CLIENT_ID}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                    Zawsze możesz zaprosić bota Kitek na dowolny serwer Discord, na którym posiadasz uprawnienia administratorskie lub zarządzania serwerem. Po zaproszeniu serwer automatycznie pojawi się w Twoim panelu!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setModalGuildId(undefined);
                    setShowAddModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#20252c] hover:bg-[#2a313b] text-zinc-200 text-xs font-semibold border border-[#353d49] transition-colors cursor-pointer"
                >
                  Szczegóły OAuth2
                </button>
                <button
                  type="button"
                  onClick={() => handleInviteForServer()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Invite Bot</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: DODAJ BOTA DO NOWEGO SERWERA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#20242a] border border-[#2f3540] w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#2d323b] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Bot className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Połącz Bota Kitek z Serwerem Discord</h3>
                  <p className="text-[11px] text-zinc-400">Wymagane uprawnienie "Zarządzanie serwerem" lub Administrator</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white p-1 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <p>
                Aby dodać bota Kitek do kolejnego serwera Discord, użyj oficjalnego linku OAuth2 aplikacji. Bot automatycznie zażąda uprawnień administratorskich (8) dla komend slash, moderacji, powitań i logów.
              </p>

              <div className="p-3.5 rounded-xl bg-[#16181b] border border-[#2c313a] space-y-2">
                <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                  <span>Oficjalny Link Zaproszenia Bota:</span>
                  <span className="text-emerald-400">Client ID: {DISCORD_CLIENT_ID}</span>
                </div>
                <div className="p-2.5 rounded bg-[#111315] text-[11px] font-mono text-emerald-400 break-all select-all border border-[#22262e]">
                  {getBotInviteUrl(modalGuildId)}
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-zinc-400">
                <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Uprawnienia: Administrator (8) + scope bot, applications.commands</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Wsparcie dla Slash Commands (`/`) oraz Prefixu (`!`)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2d323b]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-[#16181b] hover:bg-[#252a32] text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Zamknij
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  handleInviteForServer(modalGuildId);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Autoryzuj i Zaproś na Discord</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Błędu: Wymagane Dodanie Bota na Serwer */}
      <BotRequiredModal
        isOpen={!!requiredBotServer}
        server={requiredBotServer}
        onClose={() => setRequiredBotServer(null)}
        onBotAddedSuccessfully={(srvId) => {
          if (onMarkBotJoined) onMarkBotJoined(srvId);
          onSelectServer(srvId);
          showToast(`Bot został pomyślnie dodany do serwera!`);
        }}
      />
    </div>
  );
};
