import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Check, Sparkles, MessageSquare, Shield, Send, Hash } from 'lucide-react';
import { CustomSelect, SelectOption } from './CustomSelect';
import { CustomSwitch } from './CustomSwitch';
import { DiscordServer } from '../types';

interface WelcomeSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNotice: (msg: string) => void;
  server?: DiscordServer;
}

export const WelcomeSystemModal = ({
  isOpen,
  onClose,
  onSaveNotice,
  server,
}: WelcomeSystemModalProps) => {
  const serverChannels = server?.channels ?? [];
  const serverRoles = server?.roles ?? [];

  const modalChannelOptions: SelectOption[] = serverChannels.map((ch) => ({
    value: ch.name,
    label: ch.name,
    prefix: '#',
  }));

  const modalRoleOptions: SelectOption[] = serverRoles.length > 0
    ? [
        { value: 'Brak', label: 'Brak (Wyłączone)' },
        ...serverRoles.map((r) => ({
          value: r.name,
          label: r.name,
          prefix: '@',
        })),
      ]
    : [];

  const [isEnabled, setIsEnabled] = useState(true);
  const [channel, setChannel] = useState<string>(serverChannels[0]?.name || '');
  const [welcomeMessage, setWelcomeMessage] = useState('Witaj {user} na serwerze {server}! Cieszymy się, że z nami jesteś. Jesteś naszym {memberCount}. kotkiem! 🐱');
  const [autoRole, setAutoRole] = useState<string>(serverRoles[0]?.name || 'Brak');
  const [sendDM, setSendDM] = useState(false);

  useEffect(() => {
    if (serverChannels.length > 0) {
      if (!serverChannels.some((c) => c.name === channel)) {
        setChannel(serverChannels[0].name);
      }
    } else {
      setChannel('');
    }

    if (serverRoles.length > 0) {
      if (!serverRoles.some((r) => r.name === autoRole) && autoRole !== 'Brak') {
        setAutoRole(serverRoles[0].name);
      }
    } else {
      setAutoRole('');
    }
  }, [server?.id, serverChannels.length, serverRoles.length]);

  const handleSave = () => {
    onSaveNotice('Konfiguracja modułu Welcome System została pomyślnie zapisana!');
    onClose();
  };

  const handleSendTest = () => {
    onSaveNotice('Wysłano testową wiadomość powitalną na kanał ' + channel + '!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-2xl bg-[#1a1d21] border border-[#2b2f35] rounded-2xl shadow-2xl overflow-hidden z-10 text-white flex flex-col max-h-[90vh]"
          >
            {/* Top Green Stripe */}
            <div className="h-1 w-full bg-emerald-500" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2f35] bg-[#16181b]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">Welcome System</h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      MODUŁ
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">Konfiguracja automatycznych powitań nowych użytkowników</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#25292e] transition-colors"
                aria-label="Zamknij"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Główny przełącznik modułu */}
              <CustomSwitch
                checked={isEnabled}
                onChange={setIsEnabled}
                label="Status modułu"
                description="Włącz lub wyłącz powitania na tym serwerze"
              />

              {/* Kanał powitań */}
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kanał powitań</span>
                </label>
                <CustomSelect
                  value={channel}
                  onChange={setChannel}
                  options={modalChannelOptions}
                  icon={Hash}
                  placeholder={modalChannelOptions.length === 0 ? "Brak kanałów na serwerze" : "Wybierz kanał"}
                  disabled={modalChannelOptions.length === 0}
                  ariaLabel="Wybierz kanał powitań"
                />
              </div>

              {/* Treść wiadomości powitalnej */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Wiadomość powitalna</span>
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Zmienne: <strong className="text-emerald-300">{'{user}'}</strong>, <strong className="text-emerald-300">{'{server}'}</strong>, <strong className="text-emerald-300">{'{memberCount}'}</strong>
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full bg-[#15171a] border border-[#2e333b] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-lg p-3 text-white outline-none text-xs leading-relaxed transition-all"
                />
              </div>

              {/* Auto-rola dla nowego członka */}
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Automatyczna rola (Auto-Role)</span>
                </label>
                <CustomSelect
                  value={autoRole}
                  onChange={setAutoRole}
                  options={modalRoleOptions}
                  icon={Shield}
                  placeholder={modalRoleOptions.length === 0 ? "Brak ról na serwerze" : "Wybierz automatyczną rolę"}
                  disabled={modalRoleOptions.length === 0}
                  ariaLabel="Wybierz automatyczną rolę"
                />
              </div>

              {/* Opcja DM */}
              <CustomSwitch
                checked={sendDM}
                onChange={setSendDM}
                label="Wyślij też w wiadomości prywatnej (DM)"
                description="Wiadomość trafi bezpośrednio na skrzynkę użytkownika"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-[#15171a] border-t border-[#2b2f35]">
              <button
                type="button"
                onClick={handleSendTest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25292e] hover:bg-[#2e333a] text-zinc-300 hover:text-white text-xs font-semibold border border-[#353b44] hover:border-emerald-500/50 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Wyślij test</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-transparent hover:bg-[#25292e] text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Zapisz zmiany</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
