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
          {/* Czerwony pasek ostrzegawczy na górze */}
          <div className="bg-red-500/15 border-b border-red-500/30 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-400">
                  Wymagane Dodanie Bota na Serwer!
                </h3>
                <span className="text-[10px] font-mono text-zinc-400">
                  [BŁĄD: BOT_NOT_ON_SERVER]
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

          {/* Treść okna błędu */}
          <div className="p-5 space-y-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Nie możesz zarządzać modułami tego serwera ani odczytać jego konfiguracji, ponieważ bot{' '}
              <strong className="text-white">Kitek</strong> nie został jeszcze dodany na serwer{' '}
              <strong className="text-white font-mono">{server.name}</strong>!
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
                  <div className="text-[11px] font-mono text-zinc-500">ID: {server.id}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <span>Brak bota</span>
              </div>
            </div>

            {/* Wyjaśnienie techniczne co się stanie po dodaniu */}
            <div className="p-3 rounded-xl bg-[#20242a] border border-[#2e343e] space-y-1.5 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Jak działa aktywacja serwera?</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Gdy dodasz bota na serwer przez link OAuth2, zdarzenie{' '}
                <code className="text-emerald-400 bg-[#141619] px-1 py-0.5 rounded font-mono">guildCreate</code>{' '}
                automatycznie utworzy plik konfiguracyjny{' '}
                <code className="text-amber-400 bg-[#141619] px-1 py-0.5 rounded font-mono">
                  servers/{server.id}.json
                </code>{' '}
                i odblokuje dostęp do modułów bota w panelu.
              </p>
            </div>

            {simulatedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zasymulowano guildCreate! Plik servers/{server.id}.json został utworzony. Przełączanie...</span>
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
