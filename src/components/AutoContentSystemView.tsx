import { useState, ChangeEvent } from 'react';
import {
  ArrowLeft,
  Radio,
  Hash,
  Clock,
  UploadCloud,
  Link as LinkIcon,
  FileCode,
  CheckCircle2,
  Plus,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CustomSwitch } from './CustomSwitch';
import { CustomSelect } from './CustomSelect';

interface AutoContentSystemViewProps {
  onBackToDashboard: () => void;
}

// Kontent to dokładnie: nazwa + (plik LUB link)
export type ItemType = 'file' | 'link';

export interface ContentItem {
  id: string;
  name: string;
  type: ItemType;
  fileName?: string;
  fileSize?: string;
  linkUrl?: string;
  createdAt: string;
}

// Ramka z kanałem i czasem cool-down
export interface ContentSlot {
  id: number;
  name: string;
  enabled: boolean;
  channel: string;
  cooldownHours: number;
  cooldownLabel: string;
}

const AVAILABLE_CHANNELS = [
  '#kanał-1',
  '#kanał-2',
  '#kanał-3',
  '#auto-drops',
  '#programy',
  '#zasoby-i-pliki',
  '#darmowe-rzeczy',
  '#ogłoszenia',
];

const COOLDOWN_PRESETS = [
  { hours: 0.5, label: 'Co 30 minut' },
  { hours: 1, label: 'Co 1 godzinę' },
  { hours: 2, label: 'Co 2 godziny' },
  { hours: 6, label: 'Co 6 godzin' },
  { hours: 12, label: 'Co 12 godzin' },
  { hours: 24, label: 'Co 24 godziny (1 dzień)' },
  { hours: 48, label: 'Co 48 godzin (2 dni)' },
];

export const AutoContentSystemView = ({ onBackToDashboard }: AutoContentSystemViewProps) => {
  const [notification, setNotification] = useState<string | null>(null);

  // 1. Biblioteka kontentów (nazwa + plik LUB link)
  const [library, setLibrary] = useState<ContentItem[]>([
    {
      id: 'c-1',
      name: 'OptiFine 1.20.4 HD Ultra Pack',
      type: 'file',
      fileName: 'OptiFine_1.20.4_HD.jar',
      fileSize: '6.4 MB',
      createdAt: 'Dzisiaj, 11:20',
    },
    {
      id: 'c-2',
      name: 'Oficjalna Baza Narzędzi Discord Dev',
      type: 'link',
      linkUrl: 'https://discord.com/developers/docs',
      createdAt: 'Wczoraj',
    },
    {
      id: 'c-3',
      name: 'Paczka Tapet Serwerowych 4K',
      type: 'file',
      fileName: 'Tapety_Serwera_4K.zip',
      fileSize: '18.2 MB',
      createdAt: '2 dni temu',
    },
    {
      id: 'c-4',
      name: 'Repozytorium Skryptów Botów',
      type: 'link',
      linkUrl: 'https://github.com/kitek-bot/scripts-archive',
      createdAt: '3 dni temu',
    },
  ]);

  // 2. Widoczne 3 Ramki (Sloty) z kanałem i czasem cooldown
  const [slots, setSlots] = useState<ContentSlot[]>([
    {
      id: 1,
      name: 'Ramka 1',
      enabled: true,
      channel: '#kanał-1',
      cooldownHours: 6,
      cooldownLabel: 'Co 6 godzin',
    },
    {
      id: 2,
      name: 'Ramka 2',
      enabled: true,
      channel: '#kanał-2',
      cooldownHours: 12,
      cooldownLabel: 'Co 12 godzin',
    },
    {
      id: 3,
      name: 'Ramka 3',
      enabled: true,
      channel: '#kanał-3',
      cooldownHours: 24,
      cooldownLabel: 'Co 24 godziny (1 dzień)',
    },
  ]);

  // Formularz dodawania nowego kontentu
  const [newContentName, setNewContentName] = useState('');
  const [newContentType, setNewContentType] = useState<ItemType>('link');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState('');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Obsługa pliku (max 25 MB)
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast('⚠️ Plik przekracza limit (max 25 MB)! Użyj linku.');
      return;
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setNewFileName(file.name);
    setNewFileSize(`${sizeMb} MB`);
    if (!newContentName.trim()) {
      setNewContentName(file.name.replace(/\.[^/.]+$/, ''));
    }
    showToast(`Załadowano plik: ${file.name} (${sizeMb} MB)`);
  };

  // Dodanie kontentu do biblioteki
  const handleAddContent = () => {
    if (!newContentName.trim()) {
      showToast('Wpisz nazwę kontentu!');
      return;
    }

    if (newContentType === 'link') {
      if (!newLinkUrl.trim()) {
        showToast('Wklej poprawny adres URL linku!');
        return;
      }
    } else {
      if (!newFileName.trim()) {
        showToast('Wybierz plik z dysku (do 25 MB)!');
        return;
      }
    }

    const newItem: ContentItem = {
      id: `c-${Date.now()}`,
      name: newContentName.trim(),
      type: newContentType,
      linkUrl: newContentType === 'link' ? newLinkUrl.trim() : undefined,
      fileName: newContentType === 'file' ? newFileName.trim() : undefined,
      fileSize: newContentType === 'file' ? newFileSize.trim() : undefined,
      createdAt: 'Przed chwilą',
    };

    setLibrary([newItem, ...library]);
    showToast(`Dodano do biblioteki: "${newItem.name}"`);

    // Reset formularza
    setNewContentName('');
    setNewLinkUrl('');
    setNewFileName('');
    setNewFileSize('');
  };

  // Usunięcie kontentu z biblioteki
  const handleDeleteContent = (id: string) => {
    setLibrary(library.filter((c) => c.id !== id));
    showToast('Usunięto pozycję z biblioteki.');
  };

  // Aktualizacja ustawień ramki (kanał, cooldown, włączenie)
  const handleUpdateSlot = (slotId: number, patch: Partial<ContentSlot>) => {
    setSlots(slots.map((s) => (s.id === slotId ? { ...s, ...patch } : s)));
    showToast('Zaktualizowano ustawienia ramki');
  };

  return (
    <div className="flex-1 bg-[#1a1d21] text-white px-5 sm:px-7 py-6 h-full overflow-y-auto min-h-0 w-full">
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
        {/* Toast Notyfikacja */}
        {notification && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs shadow-2xl animate-in slide-in-from-top-3 duration-150">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification}</span>
          </div>
        )}

        {/* Nagłówek Górny */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262b32] pb-5">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="p-2 rounded-lg bg-[#20242a] hover:bg-[#282e36] text-zinc-400 hover:text-white border border-[#2d333d] transition-colors"
              title="Powrót do Dashboardu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Radio className="w-4 h-4" />
                </div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Auto-Kontent
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-mono font-semibold">
                  3 Ramki & Biblioteka
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Ustaw kanał i czas cool-down w 3 widocznych ramkach oraz zarządzaj biblioteką linków i plików.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SEKCJA GŁÓWNA: 3 WIDOCZNE RAMKI (TYLKO KANAŁ + CZAS COOL-DOWN)            */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                3 Ramki (Kanał & Cool-down)
              </h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              3 sloty czasowe
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                  slot.enabled
                    ? 'bg-[#20242a] border-[#313744] shadow-lg shadow-black/20 hover:border-emerald-500/40'
                    : 'bg-[#181a1e] border-[#252932] opacity-75'
                }`}
              >
                {/* Pasek Tytułowy Ramki */}
                <div className="p-4 bg-[#1b1e24] border-b border-[#2a2f3a] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      #{slot.id}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{slot.name}</h3>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {slot.enabled ? 'Aktywna' : 'Wyłączona'}
                      </span>
                    </div>
                  </div>
                  <CustomSwitch
                    checked={slot.enabled}
                    onChange={(val) => handleUpdateSlot(slot.id, { enabled: val })}
                    id={`slot-switch-${slot.id}`}
                  />
                </div>

                {/* Konfiguracja Ramki: Wyłącznie Kanał + Czas Cool-down */}
                <div className="p-5 space-y-4 flex-1">
                  {/* 1. Ustawienie Kanału */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Kanał Discord:</span>
                    </label>
                    <CustomSelect
                      value={slot.channel}
                      onChange={(val) => handleUpdateSlot(slot.id, { channel: val })}
                      options={AVAILABLE_CHANNELS.map((ch) => ({
                        value: ch,
                        label: ch,
                        prefix: '#',
                      }))}
                      size="md"
                    />
                  </div>

                  {/* 2. Ustawienie Czasu Cool-down */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Czas Cool-down:</span>
                    </label>
                    <CustomSelect
                      value={String(slot.cooldownHours)}
                      onChange={(val) => {
                        const numVal = parseFloat(val);
                        const preset = COOLDOWN_PRESETS.find((p) => p.hours === numVal);
                        handleUpdateSlot(slot.id, {
                          cooldownHours: numVal,
                          cooldownLabel: preset ? preset.label : `Co ${numVal} godz.`,
                        });
                      }}
                      options={COOLDOWN_PRESETS.map((p) => ({
                        value: String(p.hours),
                        label: p.label,
                      }))}
                      size="md"
                    />
                  </div>
                </div>

                {/* Stopka Ramki: Podsumowanie interwału */}
                <div className="p-3.5 bg-[#1b1e24] border-t border-[#2a2f3a] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Interwał zrzutów:</span>
                  <span className="text-emerald-400 font-bold">{slot.cooldownLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DOLNA SEKCJA: DODAWANIE KONTENTU & BIBLIOTEKA KONTENTÓW                   */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* LEWA KOLUMNA (5/12): DODAJ KONTENT (NAZWA + PLIK LUB LINK) */}
          <div className="lg:col-span-5 rounded-2xl bg-[#20242a] border border-[#2d323b] p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#2c313a] pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Dodaj Nowy Kontent</h3>
                <p className="text-[11px] text-zinc-400">
                  Nazwa oraz plik (do 25 MB) lub link
                </p>
              </div>
            </div>

            {/* 1. Nazwa Kontentu */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Nazwa kontentu:
              </label>
              <input
                type="text"
                value={newContentName}
                onChange={(e) => setNewContentName(e.target.value)}
                placeholder="np. OptiFine 1.20, Paczka Tekstur, Link do narzędzia"
                className="w-full bg-[#16181b] border border-[#2e333d] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
              />
            </div>

            {/* 2. Przełącznik Typu: Link LUB Plik */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">
                  Typ kontentu:
                </label>
                <div className="flex rounded-lg bg-[#16181b] p-0.5 border border-[#2c313a]">
                  <button
                    type="button"
                    onClick={() => setNewContentType('link')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      newContentType === 'link'
                        ? 'bg-emerald-500 text-black font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewContentType('file')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      newContentType === 'file'
                        ? 'bg-emerald-500 text-black font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Plik</span>
                  </button>
                </div>
              </div>

              {/* Pole dla Linku */}
              {newContentType === 'link' && (
                <div className="space-y-1">
                  <input
                    type="url"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#16181b] border border-[#2e333d] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}

              {/* Pole dla Pliku */}
              {newContentType === 'file' && (
                <div className="border border-dashed border-[#3d4554] hover:border-emerald-500 rounded-xl p-5 bg-[#16181b] text-center transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <UploadCloud className="w-8 h-8 text-emerald-400 mx-auto mb-1.5" />
                  <div className="text-xs font-bold text-white">
                    {newFileName ? newFileName : 'Wybierz lub upuść plik z komputera'}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {newFileSize
                      ? `Załadowano: ${newFileSize}`
                      : 'Limit pliku: do 25 MB'}
                  </p>
                </div>
              )}
            </div>

            {/* Przycisk Dodaj */}
            <button
              type="button"
              id="btn-add-to-library"
              onClick={handleAddContent}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Dodaj do Biblioteki</span>
            </button>
          </div>

          {/* PRAWA KOLUMNA (7/12): BIBLIOTEKA KONTENTÓW */}
          <div className="lg:col-span-7 rounded-2xl bg-[#20242a] border border-[#2d323b] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2c313a] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Biblioteka Kontentów</h3>
                  <p className="text-[11px] text-zinc-400">
                    Zapisane pozycje ({library.length})
                  </p>
                </div>
              </div>

              <span className="text-[11px] text-zinc-500 font-mono">
                Nazwa + Plik lub Link
              </span>
            </div>

            {library.length === 0 ? (
              <div className="p-8 text-center bg-[#17191d] rounded-xl border border-[#292e37] text-zinc-500 text-xs">
                Biblioteka jest pusta. Dodaj pierwszy link lub plik za pomocą formularza.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {library.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#17191d] border border-[#292e37] hover:border-[#3b4250] transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          item.type === 'file'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {item.type === 'file' ? (
                          <FileCode className="w-4 h-4" />
                        ) : (
                          <LinkIcon className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="font-bold text-xs text-white truncate">
                          {item.name}
                        </div>

                        {item.type === 'file' ? (
                          <div className="text-[11px] text-zinc-400 font-mono truncate">
                            📁 {item.fileName}{' '}
                            <span className="text-emerald-400 font-bold">({item.fileSize})</span>
                          </div>
                        ) : (
                          <a
                            href={item.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-400 hover:text-blue-300 font-mono truncate flex items-center gap-1"
                          >
                            <span className="truncate max-w-[280px]">{item.linkUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Przycisk usuwania */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDeleteContent(item.id)}
                        className="p-1.5 rounded-lg bg-[#20242a] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-[#2b3039] hover:border-rose-500/40 transition-colors cursor-pointer"
                        title="Usuń z biblioteki"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
