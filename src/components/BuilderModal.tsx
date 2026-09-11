import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Terminal, Calendar, MessageSquare, Plus, Save, Sparkles, Check } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface BuilderModalProps {
  type: 'command' | 'event' | 'message' | null;
  onClose: () => void;
  onSaveNotice: (msg: string) => void;
}

export const BuilderModal = ({ type, onClose, onSaveNotice }: BuilderModalProps) => {
  // Command Builder State
  const [commandName, setCommandName] = useState('kotek');
  const [commandDesc, setCommandDesc] = useState('Wysyła urocze zdjęcie kotka i losowy koci cytat.');
  const [commandResponse, setCommandResponse] = useState('Miau! 🐾 Oto Twój kotek z Kitek 1.0: https://cataas.com/cat');

  // Event Builder State
  const [eventName, setEventName] = useState('onMemberJoin');
  const [eventTrigger, setEventTrigger] = useState('Gdy nowy członek dołącza na serwer');
  const [eventAction, setEventAction] = useState('Wyślij powitanie na #powitania oraz nadaj rolę Nowy Kotek');

  // Message Builder State
  const [embedTitle, setEmbedTitle] = useState('Oficjalne Ogłoszenie Kitek 1.0');
  const [embedColor, setEmbedColor] = useState('#22c55e');
  const [embedContent, setEmbedContent] = useState('Witamy w nowym, zaktualizowanym dashboardzie bota Kitek! Ciesz się ciemnym motywem, builderami i zoptymalizowanym czasem odpowiedzi.');

  if (!type) return null;

  const handleSave = () => {
    if (type === 'command') {
      onSaveNotice(`Pomyślnie zapisano komendę /${commandName} w Kitek 1.0!`);
    } else if (type === 'event') {
      onSaveNotice(`Zdarzenie "${eventName}" zostało wdrożone na aktywnym serwerze!`);
    } else {
      onSaveNotice(`Szablon wiadomości Embed "${embedTitle}" został zapisany!`);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-2xl bg-[#1a1d21] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden z-10 text-white"
        >
          {/* Animated top stripe */}
          <div className="h-1.5 w-full bg-gradient-flow" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2f36] bg-[#16181b]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {type === 'command' && <Terminal className="w-5 h-5" />}
                {type === 'event' && <Calendar className="w-5 h-5" />}
                {type === 'message' && <MessageSquare className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  {type === 'command' && 'Kitek Command Builder (Kreator Komend)'}
                  {type === 'event' && 'Kitek Event Builder (Kreator Zdarzeń)'}
                  {type === 'message' && 'Kitek Message Builder (Discord Embeds)'}
                </h3>
                <p className="text-xs text-zinc-400">
                  Dostosuj konfigurację dla aktywnej instancji Discord API v10
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#25292e]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {type === 'command' && (
              <div className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-zinc-400 mb-1">Nazwa komendy slash (np. /kotek):</label>
                  <div className="flex items-center bg-[#111315] border border-[#2e333a] rounded-lg px-3 py-2 text-white">
                    <span className="text-emerald-400 font-bold mr-1">/</span>
                    <input
                      type="text"
                      value={commandName}
                      onChange={(e) => setCommandName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      className="bg-transparent w-full outline-none text-emerald-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Opis widoczny w Discord:</label>
                  <input
                    type="text"
                    value={commandDesc}
                    onChange={(e) => setCommandDesc(e.target.value)}
                    className="w-full bg-[#111315] border border-[#2e333a] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-400 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Odpowiedź bota Kitek (tekst lub link):</label>
                  <textarea
                    rows={3}
                    value={commandResponse}
                    onChange={(e) => setCommandResponse(e.target.value)}
                    className="w-full bg-[#111315] border border-[#2e333a] rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-emerald-400 font-sans"
                  />
                </div>

                {/* Discord Preview */}
                <div className="bg-[#121518] p-3.5 rounded-xl border border-[#2b2f35]">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Podgląd w Discord:</div>
                  <div className="flex items-start gap-3 bg-[#1e2227] p-3 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-xs">
                      🐱
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">Kitek BOT</span>
                        <span className="text-[9px] bg-[#5865F2] text-white px-1 rounded font-bold">BOT</span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1 font-sans">{commandResponse}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {type === 'event' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1 font-mono">Typ zdarzenia (Trigger):</label>
                  <CustomSelect
                    value={eventName}
                    onChange={(val) => {
                      setEventName(val);
                      if (val === 'onMemberJoin') setEventTrigger('Gdy nowy członek dołącza na serwer');
                      if (val === 'onMessageDelete') setEventTrigger('Gdy wiadomość zostanie usunięta na dowolnym kanale');
                      if (val === 'onRoleUpdate') setEventTrigger('Gdy role użytkownika ulegną zmianie');
                    }}
                    options={[
                      { value: 'onMemberJoin', label: 'onMemberJoin (Dołączenie członka)', prefix: '⚡' },
                      { value: 'onMessageDelete', label: 'onMessageDelete (Usunięcie wiadomości)', prefix: '🗑️' },
                      { value: 'onRoleUpdate', label: 'onRoleUpdate (Aktualizacja ról)', prefix: '👑' },
                    ]}
                    size="md"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-mono">Warunek wyzwalacza:</label>
                  <input
                    type="text"
                    value={eventTrigger}
                    onChange={(e) => setEventTrigger(e.target.value)}
                    className="w-full bg-[#111315] border border-[#2e333a] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-mono">Działanie automatyczne Kitek:</label>
                  <textarea
                    rows={3}
                    value={eventAction}
                    onChange={(e) => setEventAction(e.target.value)}
                    className="w-full bg-[#111315] border border-[#2e333a] rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            )}

            {type === 'message' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">Tytuł Embedu:</label>
                  <input
                    type="text"
                    value={embedTitle}
                    onChange={(e) => setEmbedTitle(e.target.value)}
                    className="w-full bg-[#111315] border border-[#2e333a] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Kolor paska bocznego (HEX):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={embedColor}
                      onChange={(e) => setEmbedColor(e.target.value)}
                      className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                    />
                    <span className="font-mono text-emerald-400">{embedColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Treść wiadomości:</label>
                  <textarea
                    rows={3}
                    value={embedContent}
                    onChange={(e) => setEmbedContent(e.target.value)}
                    className="w-full bg-[#111315] border border-[#2e333a] rounded-lg px-3 py-2 text-zinc-200 outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Live Discord Embed preview */}
                <div className="bg-[#121518] p-3.5 rounded-xl border border-[#2b2f35]">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Podgląd Discord Embed:</div>
                  <div
                    className="bg-[#1f2329] p-3 rounded-lg border-l-4"
                    style={{ borderLeftColor: embedColor }}
                  >
                    <h4 className="font-bold text-white text-sm mb-1">{embedTitle}</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed">{embedContent}</p>
                    <div className="mt-2 text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Kitek 1.0 Message Builder • Dzisiaj</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-[#2b2f36] bg-[#16181b] flex items-center justify-between text-xs">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#25292e] hover:bg-[#30353b] text-zinc-300 font-medium transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-neon-green-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Zapisz w Kitek 1.0</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
