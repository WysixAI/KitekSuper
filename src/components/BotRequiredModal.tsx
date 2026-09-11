import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Bot,
  ExternalLink,
  Zap,
  X,
  CheckCircle2,
  RefreshCw,
  Server,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import { DiscordServer } from '../types';
import { getBotInviteUrl } from '../services/discordAuth';

interface BotRequiredModalProps {
  isOpen: boolean;
  server: DiscordServer | null;
  onClose: () => void;
  onBotAddedSuccessfully?: (serverId: string) => void;
}

export const BotRequiredModal = ({
  isOpen,
  server,
  onClose,
  onBotAddedSuccessfully,
}: BotRequiredModalProps) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);

  if (!isOpen || !server) return null;

  const handleOpenInvite = () => {
    const inviteUrl = getBotInviteUrl(server.id);
    window.open(inviteUrl, '_blank');
  };

  const handleSimulateJoin = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/bot/test-simulate-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: server.id,
          guildName: server.name,
          joined: true,
        }),
      });

      if (res.ok) {
        setSimulatedSuccess(true);
        setTimeout(() => {
          setSimulatedSuccess(false);
          setIsSimulating(false);
          if (onBotAddedSuccessfully) {
            onBotAddedSuccessfully(server.id);
          }
          onClose();
        }, 1200);
      } else {
        setIsSimulating(false);
      }
    } catch (e) {
      setIsSimulating(false);
      if (onBotAddedSuccessfully) {
        onBotAddedSuccessfully(server.id);
      }
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-[#1a1d21] border border-red-500/40 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col"
        >
          {/* Pasek nagłówka */}
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Zaproś bota na ten serwer
                </h3>
                <span className="text-[10px] text-zinc-400">
                  Wymagane jednorazowe dodanie bota
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Treść okna */}
          <div className="p-5 space-y-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Aby w pełni zarządzać modułami i komendami tego serwera, dodaj bota{' '}
              <strong className="text-emerald-400">Kitek</strong> na serwer{' '}
              <strong className="text-white">{server.name}</strong>.
            </p>

            {/* Karta serwera z informacją o braku bota */}
            <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2b3038] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#20242a] border border-[#303743] flex items-center justify-center text-lg overflow-hidden shrink-0">
                  {server.iconUrl ? (
                    <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{server.icon || '🎮'}</span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-white">{server.name}</div>
                  <div className="text-[11px] text-zinc-500">{server.memberCount} członków</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Oczekuje na bota</span>
              </div>
            </div>

            {/* Wyjaśnienie co się stanie po dodaniu */}
            <div className="p-3 rounded-xl bg-[#20242a] border border-[#2e343e] space-y-1.5 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-[11px]">
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                <span>Jak działa aktywacja bota?</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Po autoryzacji bota przez oficjalny link Discord bot natychmiastowo połączy się z serwerem i włączy wszystkie wybrane moduły oraz powitania.
              </p>
            </div>

            {simulatedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bot został pomyślnie dodany na serwer! Przełączanie...</span>
              </div>
            )}
          </div>

          {/* Dolne przyciski akcji */}
          <div className="p-4 bg-[#141619] border-t border-[#262b32] flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#20242a] hover:bg-[#282e36] text-zinc-300 text-xs font-semibold border border-[#2e343e] transition-colors cursor-pointer"
            >
              Anuluj
            </button>

            {/* Przycisk symulacji testowej dla dewelopera / podglądu */}
            <button
              type="button"
              onClick={handleSimulateJoin}
              disabled={isSimulating || simulatedSuccess}
              className="px-4 py-2 rounded-xl bg-[#282e36] hover:bg-[#323a45] text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Szybkie zasymulowanie dodania bota na ten serwer (test bez otwierania Discorda)"
            >
              {isSimulating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Symuluj dodanie bota (Test)</span>
            </button>

            {/* Główny przycisk: Zaproś Bota przez oficjalny link OAuth2 */}
            <button
              type="button"
              onClick={handleOpenInvite}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Dodaj Bota na Serwer (Discord)</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
