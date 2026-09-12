import { useState } from 'react';
import {
  ShieldAlert,
  ArrowLeft,
  Gavel,
  AlertTriangle,
  Clock,
  UserX,
  UserMinus,
  MessageSquareOff,
  VolumeX,
  Volume2,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  Bot,
  Link,
  AtSign,
  FileText,
  Radio,
  Plus,
  X,
  Check,
  Zap,
  Sparkles,
  Info,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { CustomSwitch } from './CustomSwitch';
import { DiscordServer } from '../types';
import { CustomSelect, SelectOption } from './CustomSelect';

interface ModerationSystemViewProps {
  server?: DiscordServer;
  onBackToDashboard: () => void;
}

interface WarnThreshold {
  warns: number;
  punishment: 'mute' | 'kick' | 'tempban' | 'ban';
  duration?: string; // np. "1 godzina", "24 godziny", "7 dni"
}

interface AutomodRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  action: 'warn_1' | 'warn_2' | 'delete' | 'timeout_10m' | 'timeout_1h' | 'mute' | 'kick' | 'tempban' | 'ban';
  detailValue?: string | number;
}

const PUNISHMENT_OPTIONS: SelectOption[] = [
  { value: 'warn_1', label: 'Taryfa: Dodaj 1 Warn (+1 Ostrzeżenie)' },
  { value: 'warn_2', label: 'Taryfa: Dodaj 2 Warny (+2 Ostrzeżenia)' },
  { value: 'delete', label: 'Tylko usuń wiadomość (bez warna)' },
  { value: 'timeout_10m', label: 'Timeout na 10 minut' },
  { value: 'timeout_1h', label: 'Timeout na 1 godzinę' },
  { value: 'mute', label: 'Wycisz członka (Rola Mute)' },
  { value: 'kick', label: 'Wyrzuć z serwera (Kick)' },
  { value: 'tempban', label: 'Tymczasowy Ban (TempBan 24h)' },
  { value: 'ban', label: 'Permanentny Ban' },
];

const WARN_EXPIRE_OPTIONS: SelectOption[] = [
  { value: '24h', label: '24 godziny (1 dzień)' },
  { value: '3d', label: '3 dni' },
  { value: '7d', label: '7 dni (1 tydzień)' },
  { value: '14d', label: '14 dni (2 tygodnie)' },
  { value: '30d', label: '30 dni (1 miesiąc)' },
  { value: 'never', label: 'Nigdy (Warny są permanentne)' },
];

const SLOWMODE_OPTIONS: SelectOption[] = [
  { value: '0', label: 'Wyłączony (0s)' },
  { value: '5', label: '5 sekund' },
  { value: '10', label: '10 sekund' },
  { value: '30', label: '30 sekund' },
  { value: '60', label: '1 minuta' },
  { value: '120', label: '2 minuty' },
  { value: '300', label: '5 minut' },
  { value: '900', label: '15 minut' },
  { value: '21600', label: '6 godzin' },
];

export const ModerationSystemView = ({ onBackToDashboard, server }: ModerationSystemViewProps) => {
  const [activeTab, setActiveTab] = useState<'tariff_automod' | 'commands' | 'simulator'>('tariff_automod');
  const [notification, setNotification] = useState<string | null>(null);

  // ================= Taryfikator Warnów (Drabina kar) =================
  const [warnExpire, setWarnExpire] = useState<string>('7d');
  const [warnLadder, setWarnLadder] = useState<WarnThreshold[]>([
    { warns: 2, punishment: 'mute', duration: '1 godzina' },
    { warns: 3, punishment: 'mute', duration: '12 godzin' },
    { warns: 4, punishment: 'kick', duration: '' },
    { warns: 5, punishment: 'tempban', duration: '3 dni' },
    { warns: 7, punishment: 'ban', duration: 'Permanentny' },
  ]);

  // Nowy próg ostrzeżeń formularz
  const [newWarnCount, setNewWarnCount] = useState<number>(6);
  const [newWarnPunishment, setNewWarnPunishment] = useState<'mute' | 'kick' | 'tempban' | 'ban'>('tempban');
  const [newWarnDuration, setNewWarnDuration] = useState<string>('7 dni');

  // ================= Reguły Automod z przypisaną karą/taryfą =================
  const [automodRules, setAutomodRules] = useState<Record<string, AutomodRule>>({
    antiSpam: {
      id: 'antiSpam',
      name: 'Anti-Spam',
      description: 'Wykrywa zbyt szybkie wysyłanie wiadomości (np. >5 wiadomości w 5 sekund).',
      enabled: true,
      action: 'warn_1',
      detailValue: '5 wiadomości / 5s',
    },
    antiLink: {
      id: 'antiLink',
      name: 'Anti-Link',
      description: 'Blokuje wysyłanie zewnętrznych linków URL (z wyjątkiem białej listy domen).',
      enabled: true,
      action: 'warn_1',
      detailValue: 'youtube.com, tenor.com, spotify.com',
    },
    antiInvite: {
      id: 'antiInvite',
      name: 'Anti-Invite',
      description: 'Wykrywa i natychmiast usuwa zaproszenia na inne serwery Discord (discord.gg/*).',
      enabled: true,
      action: 'warn_2',
      detailValue: 'Wszystkie zaproszenia',
    },
    antiCaps: {
      id: 'antiCaps',
      name: 'Anti-Caps',
      description: 'Blokuje wiadomości zawierające powyżej 70% wielkich liter (min. 8 znaków).',
      enabled: true,
      action: 'delete',
      detailValue: 'Próg: 70% wielkich liter',
    },
    antiMention: {
      id: 'antiMention',
      name: 'Anti-Mention',
      description: 'Chroni przed masowym oznaczaniem członków (np. >4 wzmianki) oraz @everyone / @here.',
      enabled: true,
      action: 'warn_2',
      detailValue: 'Maks. 4 wzmianki',
    },
    blacklistWords: {
      id: 'blacklistWords',
      name: 'Blacklist słów (Czarna lista)',
      description: 'Filtruje wulgaryzmy, obraźliwe frazy oraz zakazane słowa kluczowe.',
      enabled: true,
      action: 'warn_1',
      detailValue: '12 zdefiniowanych słów',
    },
    antiRaid: {
      id: 'antiRaid',
      name: 'Anti-Raid',
      description: 'Wykrywa zmasowany napływ podejrzanych kont (np. >10 kont w ciągu 30 sekund).',
      enabled: true,
      action: 'kick',
      detailValue: 'Wykrycie: >8 dołączeń / 30s',
    },
    antiBot: {
      id: 'antiBot',
      name: 'Anti-Bot',
      description: 'Blokuje dodawanie niezweryfikowanych botów przez użytkowników bez roli Administratora.',
      enabled: true,
      action: 'ban',
      detailValue: 'Tylko autoryzowani',
    },
  });

  // Blacklist słów edycja
  const [blacklistKeywords, setBlacklistKeywords] = useState<string[]>([
    'scam',
    'free nitro',
    'steam gift',
    't.me/',
    'grabify',
    'ip logger',
    'raid',
  ]);
  const [newKeywordInput, setNewKeywordInput] = useState('');

  // Komendy moderacji - stan podręczny
  const [channelLocked, setChannelLocked] = useState(false);
  const [currentSlowmode, setCurrentSlowmode] = useState('0');
  const [purgeCount, setPurgeCount] = useState(25);
  const [purgeFilter, setPurgeFilter] = useState<'all' | 'bots' | 'links'>('all');

  // Symulator
  const [simTargetUser, setSimTargetUser] = useState('NiesfornyKotek#1337');
  const [simAction, setSimAction] = useState<string>('warn');
  const [simReason, setSimReason] = useState('Złamanie regulaminu §2.4 (Spamowanie na czacie)');
  const [simDuration, setSimDuration] = useState('10 minut');
  const [simLogs, setSimLogs] = useState<Array<{ time: string; text: string; badge: string }>>([
    {
      time: '12:44:02',
      text: 'AutoMod nałożył Warn (+1) na @Spamer#0001 za wysyłanie zaproszenia discord.gg/abc.',
      badge: 'AUTOMOD',
    },
    {
      time: '12:42:15',
      text: 'Moderator Alex wyciszył (Timeout: 1h) @Kacper za prowokowanie kłótni.',
      badge: 'TIMEOUT',
    },
  ]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddWarnThreshold = () => {
    if (warnLadder.some((item) => item.warns === newWarnCount)) {
      showToast(`Próg dla ${newWarnCount} warnów już istnieje!`);
      return;
    }
    const updated = [...warnLadder, { warns: newWarnCount, punishment: newWarnPunishment, duration: newWarnDuration }]
      .sort((a, b) => a.warns - b.warns);
    setWarnLadder(updated);
    showToast(`Dodano próg: ${newWarnCount} warnów = ${newWarnPunishment.toUpperCase()}!`);
  };

  const handleRemoveWarnThreshold = (warns: number) => {
    setWarnLadder(warnLadder.filter((item) => item.warns !== warns));
    showToast(`Usunięto próg dla ${warns} warnów`);
  };

  const handleUpdateAutomodRule = (ruleId: string, action: AutomodRule['action']) => {
    setAutomodRules((prev) => ({
      ...prev,
      [ruleId]: { ...prev[ruleId], action },
    }));
    showToast(`Zaktualizowano taryfę dla: ${automodRules[ruleId].name}`);
  };

  const handleToggleAutomodRule = (ruleId: string, enabled: boolean) => {
    setAutomodRules((prev) => ({
      ...prev,
      [ruleId]: { ...prev[ruleId], enabled },
    }));
  };

  const handleAddKeyword = () => {
    const trimmed = newKeywordInput.trim().toLowerCase();
    if (!trimmed) return;
    if (blacklistKeywords.includes(trimmed)) {
      showToast('To słowo już znajduje się na liście!');
      return;
    }
    setBlacklistKeywords([...blacklistKeywords, trimmed]);
    setNewKeywordInput('');
    showToast(`Dodano "${trimmed}" do czarnej listy słów!`);
  };

  const handleRemoveKeyword = (word: string) => {
    setBlacklistKeywords(blacklistKeywords.filter((w) => w !== word));
    showToast(`Usunięto "${word}" z czarnej listy`);
  };

  const handleRunSimAction = () => {
    const timeNow = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let logText = '';
    let badgeText = simAction.toUpperCase();

    switch (simAction) {
      case 'warn':
        logText = `Nadano Warn (+1) dla ${simTargetUser} | Powód: ${simReason}. Aktualny stan ostrzeżeń: 2/5.`;
        break;
      case 'timeout':
        logText = `Wyciszono (Timeout: ${simDuration}) dla ${simTargetUser} | Powód: ${simReason}.`;
        break;
      case 'kick':
        logText = `Wyrzucono z serwera (Kick) użytkownika ${simTargetUser} | Powód: ${simReason}.`;
        break;
      case 'tempban':
        logText = `Zbanowano czasowo (TempBan: 7 dni) użytkownika ${simTargetUser} | Powód: ${simReason}.`;
        break;
      case 'ban':
        logText = `Zbanowano permanentnie (Ban) użytkownika ${simTargetUser} | Usunięto wiadomości z 7 dni | Powód: ${simReason}.`;
        break;
      case 'purge':
        logText = `Skasowano ${purgeCount} wiadomości na kanale #ogólny (Filtr: ${purgeFilter}).`;
        badgeText = 'PURGE';
        break;
      case 'lock':
        logText = `Kanał #ogólny został ZABLOKOWANY (Lockdown). Użytkownicy bez roli Moderatora nie mogą pisać.`;
        badgeText = 'LOCK';
        break;
    }

    setSimLogs([{ time: timeNow, text: logText, badge: badgeText }, ...simLogs.slice(0, 7)]);
    showToast(`Wykonano akcję: ${badgeText}!`);
  };

  return (
    <div className="flex-1 bg-[#1a1d21] text-white px-5 sm:px-7 py-6 h-full overflow-y-auto min-h-0 w-full">
      <div className="w-full max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
        {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs shadow-2xl shadow-emerald-500/30 animate-in slide-in-from-top-3 duration-150">
          <Check className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Nagłówek widoku */}
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
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                System Moderacji & Taryfikator Kar
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Zintegrowany taryfikator ostrzeżeń, zaawansowane reguły Automod oraz panel komend moderatorskich.
            </p>
          </div>
        </div>

        {/* Zakładki nawigacyjne */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#16181b] border border-[#272b32]">
          <button
            id="tab-tariff-automod"
            onClick={() => setActiveTab('tariff_automod')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'tariff_automod'
                ? 'bg-[#252a30] text-emerald-400 border border-[#363c46]'
                : 'text-zinc-400 hover:text-white hover:bg-[#1d2024]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Taryfikator & Automod</span>
          </button>

          <button
            id="tab-commands"
            onClick={() => setActiveTab('commands')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'commands'
                ? 'bg-[#252a30] text-emerald-400 border border-[#363c46]'
                : 'text-zinc-400 hover:text-white hover:bg-[#1d2024]'
            }`}
          >
            <Gavel className="w-3.5 h-3.5 text-emerald-400" />
            <span>Narzędzia & Komendy</span>
          </button>

          <button
            id="tab-simulator"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'simulator'
                ? 'bg-[#252a30] text-emerald-400 border border-[#363c46]'
                : 'text-zinc-400 hover:text-white hover:bg-[#1d2024]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Symulator Akcji</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZAKŁADKA 1: TARYFIKATOR WARNÓW I AUTOMOD                                 */}
      {/* ========================================================================= */}
      {activeTab === 'tariff_automod' && (
        <div className="space-y-6">
          {/* SEKCJA GŁÓWNA: TARYFIKATOR WARNÓW (DRABINA KAR) */}
          <div className="p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2c313a] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white">
                    Taryfikator Ostrzeżeń (Warning Ladder)
                  </h2>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Ustal, ile uzbieranych warnów skutkuje jaką automatyczną karą oraz po jakim czasie pojedynczy warn wygasa.
                </p>
              </div>

              {/* Wybór czasu wygasania warna */}
              <div className="flex items-center gap-2.5 shrink-0">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-xs text-zinc-300 font-semibold">Wygasanie warna:</div>
                <div className="w-48">
                  <CustomSelect
                    value={warnExpire}
                    onChange={(val) => {
                      setWarnExpire(val);
                      showToast(`Ustawiono wygasanie warna: ${val}`);
                    }}
                    options={WARN_EXPIRE_OPTIONS}
                  />
                </div>
              </div>
            </div>

            {/* Wizualizacja drabiny progów kar */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                Aktywne Progi w Taryfie Kar:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {warnLadder.map((item) => {
                  const badgeColor =
                    item.punishment === 'ban'
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                      : item.punishment === 'tempban'
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                      : item.punishment === 'kick'
                      ? 'border-orange-500/50 bg-orange-500/10 text-orange-300'
                      : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300';

                  return (
                    <div
                      key={item.warns}
                      className="p-3.5 rounded-xl bg-[#17191d] border border-[#2b3038] flex items-center justify-between gap-3 group hover:border-emerald-500/40 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#252a31] border border-[#343a45] text-xs font-mono font-bold text-emerald-400 flex items-center justify-center">
                            {item.warns}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {item.warns === 1 ? '1 Warn' : `${item.warns} Warny`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${badgeColor}`}>
                            {item.punishment}
                          </span>
                          {item.duration && (
                            <span className="text-[11px] text-zinc-400 font-mono">
                              ({item.duration})
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveWarnThreshold(item.warns)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Usuń ten próg kary"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Dodawanie nowego progu kary */}
              <div className="p-3.5 rounded-xl bg-[#16181b] border border-[#2b3038] flex flex-wrap items-center gap-3 text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Dodaj kolejny próg:</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <label className="text-zinc-400 text-[11px]">Liczba warnów:</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newWarnCount}
                    onChange={(e) => setNewWarnCount(parseInt(e.target.value) || 1)}
                    className="w-16 bg-[#20242a] border border-[#31363f] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 min-w-[160px]">
                  <label className="text-zinc-400 text-[11px] shrink-0">Kara:</label>
                  <CustomSelect
                    value={newWarnPunishment}
                    onChange={(val) => setNewWarnPunishment(val as any)}
                    options={[
                      { value: 'mute', label: 'Mute / Timeout', prefix: '🔇' },
                      { value: 'kick', label: 'Kick (Wyrzucenie)', prefix: '👢' },
                      { value: 'tempban', label: 'TempBan (Czasowy)', prefix: '⏳' },
                      { value: 'ban', label: 'Ban permanentny', prefix: '🔨' },
                    ]}
                    size="sm"
                    triggerClassName="bg-[#20242a] border-[#31363f]"
                  />
                </div>

                {(newWarnPunishment === 'mute' || newWarnPunishment === 'tempban') && (
                  <div className="flex items-center gap-1.5">
                    <label className="text-zinc-400 text-[11px]">Czas:</label>
                    <input
                      type="text"
                      value={newWarnDuration}
                      onChange={(e) => setNewWarnDuration(e.target.value)}
                      placeholder="np. 24 godziny"
                      className="w-28 bg-[#20242a] border border-[#31363f] rounded-lg px-2.5 py-1.5 text-white text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddWarnThreshold}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-sm transition-all"
                >
                  Dodaj próg
                </button>
              </div>
            </div>
          </div>

          {/* REGUŁY AUTOMOD I PRZYPISANIE DO TARYFY */}
          <div className="p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-5">
            <div className="flex items-center justify-between border-b border-[#2c313a] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white">
                    Reguły Ochrony AutoMod & Taryfy
                  </h2>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Wybierz, co otrzymuje użytkownik za złamanie każdej z reguł: dodanie warna do taryfy lub bezpośrednią karę.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#16181b] text-emerald-400 border border-[#2d323b]">
                Aktywne reguły: {(Object.values(automodRules) as AutomodRule[]).filter((r) => r.enabled).length} / {Object.keys(automodRules).length}
              </span>
            </div>

            {/* Lista reguł automod */}
            <div className="space-y-3">
              {(Object.values(automodRules) as AutomodRule[]).map((rule) => {
                const getIcon = () => {
                  switch (rule.id) {
                    case 'antiSpam':
                      return <MessageSquareOff className="w-4 h-4 text-emerald-400" />;
                    case 'antiLink':
                      return <Link className="w-4 h-4 text-emerald-400" />;
                    case 'antiInvite':
                      return <Radio className="w-4 h-4 text-emerald-400" />;
                    case 'antiCaps':
                      return <FileText className="w-4 h-4 text-emerald-400" />;
                    case 'antiMention':
                      return <AtSign className="w-4 h-4 text-emerald-400" />;
                    case 'blacklistWords':
                      return <AlertTriangle className="w-4 h-4 text-emerald-400" />;
                    case 'antiRaid':
                      return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
                    case 'antiBot':
                      return <Bot className="w-4 h-4 text-emerald-400" />;
                    default:
                      return <ShieldAlert className="w-4 h-4 text-emerald-400" />;
                  }
                };

                return (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-xl border transition-all ${
                      rule.enabled
                        ? 'bg-[#181a1e] border-[#2c323a] hover:border-emerald-500/40'
                        : 'bg-[#141618] border-[#22252a] opacity-60'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Nazwa, opis i przełącznik */}
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-[#22272e] border border-[#2e343e] flex items-center justify-center shrink-0 mt-0.5">
                          {getIcon()}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{rule.name}</span>
                            {rule.detailValue && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#20252b] text-zinc-300 border border-[#2d333b]">
                                {rule.detailValue}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            {rule.description}
                          </p>
                        </div>
                      </div>

                      {/* Wybór taryfy kary i przełącznik statusu */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-64">
                          <CustomSelect
                            value={rule.action}
                            onChange={(val) => handleUpdateAutomodRule(rule.id, val as any)}
                            options={PUNISHMENT_OPTIONS}
                          />
                        </div>

                        {/* Włącznik reguły */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={rule.enabled}
                          onClick={() => handleToggleAutomodRule(rule.id, !rule.enabled)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            rule.enabled
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-950/60'
                              : 'bg-[#15171a] border-[#2e333b]'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              rule.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Dodatkowa konfiguracja dla czarnej listy słów */}
                    {rule.id === 'blacklistWords' && rule.enabled && (
                      <div className="mt-4 pt-4 border-t border-[#262b32] space-y-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-zinc-300">
                            Słowa i frazy na czarnej liście:
                          </span>
                          <span className="text-zinc-500 font-mono">
                            Łącznie: {blacklistKeywords.length}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {blacklistKeywords.map((word) => (
                            <span
                              key={word}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#22272e] border border-[#303640] text-[11px] text-zinc-200 font-mono"
                            >
                              <span>{word}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveKeyword(word)}
                                className="text-zinc-500 hover:text-rose-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 max-w-md">
                          <input
                            type="text"
                            value={newKeywordInput}
                            onChange={(e) => setNewKeywordInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddKeyword();
                              }
                            }}
                            placeholder="Wpisz słowo/frazę i naciśnij Enter..."
                            className="flex-1 bg-[#16181b] border border-[#2f353e] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddKeyword}
                            className="px-3 py-1.5 rounded-lg bg-[#252a31] hover:bg-[#2e343d] text-emerald-400 border border-[#363c46] text-xs font-semibold transition-colors"
                          >
                            Dodaj
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ZAKŁADKA 2: NARZĘDZIA I KOMENDY MODERACYJNE                               */}
      {/* ========================================================================= */}
      {activeTab === 'commands' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Karta: Ban & TempBan */}
            <div className="p-4 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <UserX className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">Ban & TempBan</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16181b] text-zinc-400 border border-[#2b3038]">
                  /ban, /tempban
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Permanentna lub czasowa blokada wstępu na serwer. Automatyczne kasowanie historii wiadomości z ostatnich 1–7 dni oraz powiadomienie użytkownika na DM.
              </p>
              <div className="pt-2 border-t border-[#2a2f37] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Wymagane uprawnienie:</span>
                <span className="text-rose-400 font-semibold">BAN_MEMBERS</span>
              </div>
            </div>

            {/* Karta: Kick */}
            <div className="p-4 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <UserMinus className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">Kick (Wyrzucenie)</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16181b] text-zinc-400 border border-[#2b3038]">
                  /kick
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Wyrzucenie członka z serwera z możliwością ponownego dołączenia nowym zaproszeniem. Wysyła DM z powodem wyrzucenia.
              </p>
              <div className="pt-2 border-t border-[#2a2f37] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Wymagane uprawnienie:</span>
                <span className="text-orange-400 font-semibold">KICK_MEMBERS</span>
              </div>
            </div>

            {/* Karta: Timeout & Mute / Unmute */}
            <div className="p-4 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <VolumeX className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">Timeout & Mute / Unmute</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16181b] text-zinc-400 border border-[#2b3038]">
                  /timeout, /mute
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Wyciszenie pisania na kanałach tekstowych i mówienia na głosowych na określony czas (60s, 5m, 10m, 1h, 1d, 1w) lub odciszenie (`/unmute`).
              </p>
              <div className="pt-2 border-t border-[#2a2f37] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Wymagane uprawnienie:</span>
                <span className="text-amber-400 font-semibold">MODERATE_MEMBERS</span>
              </div>
            </div>

            {/* Karta: Warn */}
            <div className="p-4 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">Warn & Warnlist</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16181b] text-zinc-400 border border-[#2b3038]">
                  /warn, /warns
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Ręczne nadanie ostrzeżenia członkowi serwera, wgląd w historię ostrzeżeń z datami i powodami oraz kasowanie warna (`/unwarn`).
              </p>
              <div className="pt-2 border-t border-[#2a2f37] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Taryfikator:</span>
                <span className="text-emerald-400 font-semibold">Automatyczna eskalacja</span>
              </div>
            </div>

            {/* Karta: Purge (Czyszczenie czatu) */}
            <div className="p-4 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">Purge (Czyszczenie wiadomości)</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16181b] text-zinc-400 border border-[#2b3038]">
                  /purge [1-100]
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Masowe usuwanie wiadomości z kanału z filtrami: Wszystkie, Tylko boty, Tylko załączniki, Tylko od danego użytkownika.
              </p>
              <div className="pt-2 border-t border-[#2a2f37] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Wymagane uprawnienie:</span>
                <span className="text-blue-400 font-semibold">MANAGE_MESSAGES</span>
              </div>
            </div>

            {/* Karta: Slowmode */}
            <div className="p-4 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">Slowmode (Tryb zwolniony)</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16181b] text-zinc-400 border border-[#2b3038]">
                  /slowmode [czas]
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Wymuszenie odstępu czasowego między kolejnymi wiadomościami wysyłanymi przez pojedynczego członka (od 5s do 6h).
              </p>
              <div className="pt-2 border-t border-[#2a2f37] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Wymagane uprawnienie:</span>
                <span className="text-purple-400 font-semibold">MANAGE_CHANNELS</span>
              </div>
            </div>

            {/* Karta: Lock Channel & Unlock Channel */}
            <div className="p-4 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-3 md:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">Lock Channel & Unlock Channel (Awaryjne zamknięcie)</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16181b] text-zinc-400 border border-[#2b3038]">
                  /lock, /unlock
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Natychmiastowe zablokowanie możliwości pisania dla roli @everyone na wskazanym kanale w trakcie rajdu, po czym przywrócenie dostępu komendą `/unlock`.
              </p>

              <div className="pt-2 border-t border-[#2a2f37] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-300">Szybkie działanie na kanale #ogólny:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setChannelLocked(!channelLocked);
                      showToast(channelLocked ? 'Kanał został ODBLOKOWANY (/unlock)' : 'Kanał został ZABLOKOWANY (/lock)');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      channelLocked
                        ? 'bg-rose-500 hover:bg-rose-600 text-white'
                        : 'bg-[#252a31] hover:bg-[#2d333c] text-emerald-400 border border-[#343a44]'
                    }`}
                  >
                    {channelLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{channelLocked ? 'Odblokuj kanał (/unlock)' : 'Zablokuj kanał (/lock)'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-300">Slowmode:</span>
                  <div className="w-36">
                    <CustomSelect
                      value={currentSlowmode}
                      onChange={(val) => {
                        setCurrentSlowmode(val);
                        showToast(`Ustawiono slowmode: ${val}s`);
                      }}
                      options={SLOWMODE_OPTIONS}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ZAKŁADKA 3: SYMULATOR AKCJI MODERACYJNYCH                                 */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formularz symulacji akcji */}
          <div className="p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#2c313a] pb-3">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-white">
                Symulator Akcji Moderacyjnej na Żywo
              </h2>
            </div>
            <p className="text-[11px] text-zinc-400">
              Przetestuj działanie taryfikatora, powiadomień oraz generowanych logów przed wdrożeniem na serwerze.
            </p>

            {/* Wybór użytkownika */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Użytkownik docelowy:
              </label>
              <input
                type="text"
                value={simTargetUser}
                onChange={(e) => setSimTargetUser(e.target.value)}
                className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Wybór akcji */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Typ akcji moderacyjnej:
              </label>
              <CustomSelect
                value={simAction}
                onChange={(val) => setSimAction(val)}
                options={[
                  { value: 'warn', label: 'Warn (Dodaj Ostrzeżenie do Taryfy)', prefix: '⚠️' },
                  { value: 'timeout', label: 'Timeout / Mute (Wyciszenie)', prefix: '🔇' },
                  { value: 'kick', label: 'Kick (Wyrzucenie)', prefix: '👢' },
                  { value: 'tempban', label: 'TempBan (Czasowy Ban)', prefix: '⏳' },
                  { value: 'ban', label: 'Permanentny Ban', prefix: '🔨' },
                  { value: 'purge', label: 'Purge (Wyczyść wiadomości)', prefix: '🧹' },
                  { value: 'lock', label: 'Lock Channel (Zablokuj pisanie)', prefix: '🔒' },
                ]}
                size="md"
              />
            </div>

            {/* Czas trwania (jeśli timeout/tempban) */}
            {(simAction === 'timeout' || simAction === 'tempban') && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Czas trwania kary:
                </label>
                <input
                  type="text"
                  value={simDuration}
                  onChange={(e) => setSimDuration(e.target.value)}
                  className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Powód kary */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Powód nałożenia kary:
              </label>
              <input
                type="text"
                value={simReason}
                onChange={(e) => setSimReason(e.target.value)}
                className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Przycisk wykonania */}
            <div className="pt-2">
              <button
                type="button"
                id="btn-run-simulation"
                onClick={handleRunSimAction}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
              >
                <Gavel className="w-4 h-4" />
                <span>Wykonaj akcję moderacyjną</span>
              </button>
            </div>
          </div>

          {/* Podgląd konsoli logów moderacyjnych */}
          <div className="p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#2c313a] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white">
                    Rejestr Zdarzeń Moderacyjnych (Live Audit Log)
                  </h3>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* Lista ostatnich zdarzeń */}
              <div className="space-y-2 font-mono text-xs">
                {simLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#16181b] border border-[#2a2f37] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>[{log.time}]</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#20252b] text-emerald-400 border border-[#2c323b]">
                        {log.badge}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      {log.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 italic text-center pt-2">
              Wszystkie akcje są automatycznie zapisywane w kanale logów oraz bazie danych bota.
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
