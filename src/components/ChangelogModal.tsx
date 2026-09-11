import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, FolderArchive, Sparkles } from 'lucide-react';
import { CHANGELOG_DATA } from '../data/changelog';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEdition?: string;
}

export const ChangelogModal = ({ isOpen, onClose }: ChangelogModalProps) => {
  // Zawsze najnowsza wersja na wierzchu (indeks 0)
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(0);

  const currentLog = CHANGELOG_DATA[selectedVersionIndex] || CHANGELOG_DATA[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            id="changelog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            id="changelog-modal-card"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg bg-[#1a1d21] border border-[#2b2f35] rounded-xl shadow-2xl overflow-hidden z-10 text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2b2f35] bg-[#16181b]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-wide text-zinc-100">Historia Wydań (Changelog)</h2>
                  <p className="text-[10px] text-zinc-400 font-mono">Dziennik aktualizacji bota Kitek</p>
                </div>
              </div>
              <button
                id="close-changelog-btn"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-[#25292e] transition-colors"
                aria-label="Zamknij"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Teczki / Kwadraciki Wersji (Archiwum Wydań) */}
            <div className="px-5 pt-3.5 pb-2.5 bg-[#141619] border-b border-[#24272d] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                  <FolderArchive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Teczki Wersji (Kliknij, aby otworzyć wydanie):</span>
                </span>
                <span className="text-[10px] text-zinc-500">Najnowsza zawsze na wierzchu</span>
              </div>

              {/* Kwadraciki wydań */}
              <div className="grid grid-cols-3 gap-2">
                {CHANGELOG_DATA.map((log, idx) => {
                  const isSelected = selectedVersionIndex === idx;
                  const isLatest = idx === 0;

                  return (
                    <button
                      key={log.version}
                      type="button"
                      onClick={() => setSelectedVersionIndex(idx)}
                      className={`p-2 rounded-lg border text-left transition-all flex flex-col justify-between min-h-[58px] ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-[#1b1e22] border-[#292d34] text-zinc-400 hover:text-white hover:border-[#383f4a] hover:bg-[#202429]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-xs font-bold text-white flex items-center gap-1">
                          <FolderArchive className={`w-3 h-3 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                          <span>v{log.version}</span>
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                            isLatest
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {log.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 truncate mt-1">
                        {log.date}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body z zawartością wybranej teczki / wersji */}
            <div className="p-5 space-y-4 max-h-[360px] overflow-y-auto">
              {/* Nagłówek aktualnie otwartej wersji */}
              <div className="flex items-center justify-between border-b border-[#25292f] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold text-white font-mono">
                    Wersja {currentLog?.version}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold font-mono tracking-wider rounded border ${
                      currentLog?.badge === 'NAJNOWSZA'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : currentLog?.badge === 'UPDATE'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {currentLog?.badge}
                  </span>
                </div>
                <span className="text-xs text-zinc-400 font-mono">{currentLog?.date}</span>
              </div>

              {/* Tytuł wydania */}
              <div className="text-xs font-bold text-zinc-200">
                {currentLog?.title}
              </div>

              {/* Co zostało dodane */}
              <div>
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5 font-mono">
                  Lista zmian i nowości:
                </div>
                <ul className="space-y-2">
                  {currentLog?.added.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-200 leading-relaxed">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#15171a] border-t border-[#2b2f35]">
              <span className="text-[11px] text-zinc-500 font-mono">
                Wybrano teczkę: v{currentLog?.version} ({currentLog?.badge})
              </span>
              <button
                id="close-changelog-bottom-btn"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Zamknij
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
