import {
  LayoutGrid,
  UserPlus,
  Shield,
  Layers,
  ShieldAlert,
  Coins,
  Radio,
  Plus,
  Bot,
  ExternalLink,
  Server,
} from 'lucide-react';
import { DiscordServer } from '../types';
import { CustomSelect } from './CustomSelect';
import { getBotInviteUrl } from '../services/discordAuth';

interface SidebarProps {
  activeItem: string;
  onSelectItem: (item: string) => void;
  activeSubdomain?: string;
  onChangeSubdomain?: (sub: string) => void;
  servers?: DiscordServer[];
  selectedServerId?: string;
  onSelectServer?: (id: string) => void;
  onOpenInviteModal?: () => void;
}

export const Sidebar = ({
  activeItem,
  onSelectItem,
  servers = [],
  selectedServerId,
  onSelectServer,
  onOpenInviteModal,
}: SidebarProps) => {
  const currentServer = servers.find((s) => s.id === (selectedServerId || servers[0]?.id)) || servers[0];

  const handleInvite = (guildId?: string) => {
    window.open(getBotInviteUrl(guildId), '_blank');
  };

  return (
    <aside className="w-64 shrink-0 bg-[#16181b] border-r border-[#24272c] h-full flex flex-col select-none">
      {/* Sidebar Navigation Items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 text-xs font-medium space-y-4">
        {/* Kategoria MAIN */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-3 pb-0.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
              SERWERY & MAIN
            </span>
            <button
              type="button"
              onClick={() => onOpenInviteModal ? onOpenInviteModal() : handleInvite()}
              className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer"
              title="Zaproś bota Kitek na serwer"
            >
              <Plus className="w-3 h-3" />
              <span>Invite</span>
            </button>
          </div>

          {/* Szybkie Custom Select Menu Wyboru Serwera w MAIN */}
          {servers.length > 0 && (
            <div className="px-1.5 pb-1 space-y-1.5">
              <CustomSelect
                value={selectedServerId || servers[0]?.id}
                onChange={(val) => onSelectServer && onSelectServer(val)}
                options={servers.map((srv) => {
                  const needsInvite = srv.canInviteBot && srv.botJoined === false;
                  return {
                    value: srv.id,
                    label: srv.name,
                    icon: srv.icon,
                    image: srv.iconUrl,
                    description: needsInvite
                      ? 'Wymaga zaproszenia bota'
                      : `${srv.memberCount.toLocaleString()} członków`,
                    badge: needsInvite ? 'Invite' : srv.botStatus === 'online' ? 'Online' : undefined,
                    badgeVariant: needsInvite ? 'invite' : 'default',
                    actionButton: needsInvite
                      ? {
                          label: 'Invite',
                          title: 'Zaproś bota na ten serwer',
                          onClick: () => handleInvite(srv.id),
                        }
                      : undefined,
                  };
                })}
                footerAction={{
                  label: '+ Invite Bot (Dodaj serwer)',
                  icon: Plus,
                  onClick: () => (onOpenInviteModal ? onOpenInviteModal() : handleInvite()),
                }}
                size="md"
                triggerClassName="bg-[#121417] hover:bg-[#181b1f] border-[#272c35]"
                ariaLabel="Wybierz aktywny serwer"
              />
            </div>
          )}

          {/* Pozycja Dashboard */}
          <button
            id="sidebar-dashboard-btn"
            onClick={() => onSelectItem('Dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
              activeItem === 'Dashboard'
                ? 'bg-[#252a30] text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-300 hover:bg-[#1d2024] hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">Dashboard</span>
          </button>

          {/* Pozycja Serwery & Wybór */}
          <button
            id="sidebar-servers-btn"
            onClick={() => onSelectItem('Servers')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
              activeItem === 'Servers'
                ? 'bg-[#252a30] text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-300 hover:bg-[#1d2024] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold">Wybór Serwera</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {servers.length}
            </span>
          </button>
        </div>

        {/* Kategoria BOTS */}
        <div className="space-y-1">
          <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
            BOT DISCORD
          </div>

          <button
            id="sidebar-bots-btn"
            onClick={() => onSelectItem('Bots')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
              activeItem === 'Bots'
                ? 'bg-[#252a30] text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-300 hover:bg-[#1d2024] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold">Pliki & Status Bota</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>
        </div>

        {/* Kategoria MODULES (Funkcje Bota) */}
        <div className="space-y-1">
          <div className="px-3 pt-1 pb-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
            MODULES
          </div>

          {/* Przycisk Welcome System */}
          <button
            id="sidebar-welcome-system-btn"
            onClick={() => onSelectItem('Welcome System')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
              activeItem === 'Welcome System'
                ? 'bg-[#252a30] text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-300 hover:bg-[#1d2024] hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">Welcome System</span>
          </button>

          {/* Przycisk Logging System */}
          <button
            id="sidebar-logging-system-btn"
            onClick={() => onSelectItem('Logging System')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
              activeItem === 'Logging System'
                ? 'bg-[#252a30] text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-300 hover:bg-[#1d2024] hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">Logging System</span>
          </button>

          {/* Przycisk Embed Creator */}
          <button
            id="sidebar-embed-creator-btn"
            onClick={() => onSelectItem('Embed Creator')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
              activeItem === 'Embed Creator'
                ? 'bg-[#252a30] text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-300 hover:bg-[#1d2024] hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">Embed Creator</span>
          </button>

          {/* Przycisk Moderation & Automod */}
          <button
            id="sidebar-moderation-btn"
            onClick={() => onSelectItem('Moderacja')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
              activeItem === 'Moderacja'
                ? 'bg-[#252a30] text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-300 hover:bg-[#1d2024] hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">Moderacja & Automod</span>
          </button>

          {/* Przycisk Economy System */}
          <button
            id="sidebar-economy-btn"
            onClick={() => onSelectItem('Ekonomia System')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
              activeItem === 'Ekonomia System'
                ? 'bg-[#252a30] text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-300 hover:bg-[#1d2024] hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">Ekonomia System</span>
          </button>

          {/* Przycisk Auto-Kontent */}
          <button
            id="sidebar-auto-content-btn"
            onClick={() => onSelectItem('Auto-Kontent')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
              activeItem === 'Auto-Kontent'
                ? 'bg-[#252a30] text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-300 hover:bg-[#1d2024] hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">Auto-Kontent</span>
          </button>
        </div>
      </div>

      {/* Pinned Bottom: Zaproś Bota (Zawsze na dole pisze Invite Bot) */}
      <div className="p-2.5 border-t border-[#24272c] bg-[#121417]">
        <button
          type="button"
          onClick={() => (onOpenInviteModal ? onOpenInviteModal() : handleInvite())}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Invite Bot</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-emerald-400/80" />
        </button>
      </div>
    </aside>
  );
};
