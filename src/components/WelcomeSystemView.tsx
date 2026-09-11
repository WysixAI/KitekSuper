import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  MessageSquare,
  Shield,
  Send,
  Check,
  Sparkles,
  Hash,
  Eye,
  FileText,
  Boxes,
  Palette,
  Plus,
  Trash2,
  Ghost,
  Bell,
  Clock,
  X,
  Info,
} from 'lucide-react';
import { CustomSelect, SelectOption } from './CustomSelect';
import { CustomSwitch } from './CustomSwitch';
import { DiscordPreview } from './DiscordPreview';
import { MessageStyleEditor } from './MessageStyleEditor';
import { EmbedConfig, MessageFormatMode, DiscordField, MessageContainer } from '../types/embed';
import { DiscordServer } from '../types';

interface WelcomeSystemViewProps {
  onBackToDashboard: () => void;
  server?: DiscordServer;
}

const COLOR_PRESETS = [
  { label: 'Kitek Zielony', value: '#10b981' },
  { label: 'Discord Blurple', value: '#5865F2' },
  { label: 'Złoty', value: '#f59e0b' },
  { label: 'Błękitny', value: '#06b6d4' },
  { label: 'Czerwony', value: '#ef4444' },
  { label: 'Ciemny', value: '#2b2d31' },
];

export const WelcomeSystemView = ({ onBackToDashboard, server }: WelcomeSystemViewProps) => {
  const [activeTab, setActiveTab] = useState<'welcome' | 'goodbye' | 'autoping'>('welcome');
  const [notification, setNotification] = useState<string | null>(null);

  // Kanały i role serwera: jeśli brak kanałów/ról na serwerze, lista jest pusta i nic nie jest wyświetlane
  const serverChannels = server?.channels ?? [];
  const serverRoles = server?.roles ?? [];

  const channelOptions: SelectOption[] = serverChannels.map((ch) => ({
    value: ch.name,
    label: ch.name,
    prefix: '#',
  }));

  const roleOptions: SelectOption[] = serverRoles.length > 0
    ? [
        { value: 'Brak', label: 'Brak (Wyłączone)' },
        ...serverRoles.map((r) => ({
          value: r.name,
          label: r.name,
          prefix: '@',
        })),
      ]
    : [];

  // Stan Powitań
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [welcomeChannel, setWelcomeChannel] = useState<string>(
    serverChannels[0]?.name || ''
  );
  const [autoRole, setAutoRole] = useState<string>(
    serverRoles[0]?.name || 'Brak'
  );
  const [sendWelcomeDM, setSendWelcomeDM] = useState(false);

  // Stan Auto Ping (Ghost Ping na wybranych kanałach serwera)
  const [autoPingEnabled, setAutoPingEnabled] = useState<boolean>(true);
  const [autoPingChannels, setAutoPingChannels] = useState<string[]>(() => {
    return serverChannels.slice(0, 3).map((ch) => ch.name);
  });
  const [autoPingDeleteDelay, setAutoPingDeleteDelay] = useState<number>(0); // 0 = natychmiast
  const [autoPingMessage, setAutoPingMessage] = useState<string>(
    '{user} 👋 Witaj na serwerze! Zapoznaj się z tym kanałem.'
  );

  // Aktualizacja domyślnych wartości przy zmianie serwera
  useEffect(() => {
    if (serverChannels.length > 0) {
      if (!serverChannels.some((c) => c.name === welcomeChannel)) {
        setWelcomeChannel(serverChannels[0].name);
      }
      setAutoPingChannels((prev) => {
        const filtered = prev.filter((p) => serverChannels.some((c) => c.name === p));
        return filtered.length > 0 ? filtered : serverChannels.slice(0, 3).map((c) => c.name);
      });
    } else {
      setWelcomeChannel('');
      setAutoPingChannels([]);
    }

    if (serverRoles.length > 0) {
      if (!serverRoles.some((r) => r.name === autoRole) && autoRole !== 'Brak') {
        setAutoRole(serverRoles[0].name);
      }
    } else {
      setAutoRole('');
    }
  }, [server?.id, serverChannels.length, serverRoles.length]);

  // Konfiguracja wiadomości powitalnej (Embed Config)
  const [welcomeConfig, setWelcomeConfig] = useState<EmbedConfig>({
    mode: 'embed_v2',
    plainText: 'Hej {user}, witaj na serwerze! 👋',
    title: '🐱 Nowy członek na serwerze {server}!',
    description: 'Cieszymy się, że do nas dołączasz! Jesteś naszym **{memberCount}**. członkiem społeczności.\nRozgość się, odbierz role i przywitaj się na czacie ogólnym.',
    color: '#10b981',
    authorName: 'Kitek BOT • Witamy!',
    authorIcon: '',
    thumbnailUrl: '',
    imageUrl: '',
    footerText: 'Kitek BOT • Udanej zabawy!',
    fields: [
      { name: '📜 Regulamin', value: 'Zapoznaj się z zasadami na kanale #regulamin', inline: true },
      { name: '💬 Czat', value: 'Wpadaj na #chat-ogólny porozmawiać!', inline: true },
    ],
    containers: [
      {
        id: 'container_1',
        color: '#10b981',
        spoiler: false,
        collapsed: false,
        components: [
          {
            id: 'c_sec_1',
            type: 'section',
            accessory: {
              type: 'Thumbnail',
              fileUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=120&auto=format&fit=crop&q=80',
              description: 'Logo Kitek',
              spoiler: false,
            },
            sectionContent: '# Witaj na serwerze {server}!\nCieszymy się, że jesteś z nami! Jesteś **{memberCount}** kotkiem w naszej społeczności.\nOdbierz role poniżej i baw się dobrze!',
          },
          {
            id: 'c_sep_1',
            type: 'separator',
            spacing: 'Small',
            divider: true,
          },
          {
            id: 'c_btn_row_1',
            type: 'button_row',
            buttons: [
              { id: 'b1', label: 'Odbierz Rangę', style: 'success', emoji: '✨' },
              { id: 'b2', label: 'Regulamin', style: 'secondary', emoji: '📜' },
              { id: 'b3', label: 'Strona WWW', style: 'link', emoji: '🌐', url: 'https://kitek.pl' },
            ],
          },
          {
            id: 'c_select_1',
            type: 'select_menu',
            placeholder: 'Wybierz swoje zainteresowania i powiadomienia...',
            options: [
              { id: 'o1', label: 'Powiadomienia o Aktualizacjach', description: 'Bądź na bieżąco z botem', emoji: '🔔', value: 'updates' },
              { id: 'o2', label: 'Eventy i Konkursy', description: 'Turnieje, nagrody i quizy', emoji: '🏆', value: 'events' },
              { id: 'o3', label: 'Strefa Gracza', description: 'Dostęp do kanałów gamingowych', emoji: '🎮', value: 'gaming' },
            ],
          },
        ],
      },
    ],
  });

  // Stan Pożegnań
  const [goodbyeEnabled, setGoodbyeEnabled] = useState(true);
  const [goodbyeChannel, setGoodbyeChannel] = useState<string>(
    serverChannels[1]?.name || serverChannels[0]?.name || ''
  );
  const [sendGoodbyeDM, setSendGoodbyeDM] = useState(false);

  // Konfiguracja wiadomości pożegnalnej
  const [goodbyeConfig, setGoodbyeConfig] = useState<EmbedConfig>({
    mode: 'text',
    plainText: '{user} opuścił nasz serwer {server}. Będziemy tęsknić! Zostało nas {memberCount}. 😿',
    title: '😿 Ktoś nas opuścił...',
    description: '{user} wyszedł z serwera {server}. Mamy nadzieję, że jeszcze do nas wrócisz! Zostało nas {memberCount}.',
    color: '#10b981',
    authorName: 'Kitek BOT',
    authorIcon: '',
    thumbnailUrl: '',
    imageUrl: '',
    footerText: 'Do zobaczenia!',
    fields: [],
    containers: [
      {
        id: 'container_g_1',
        color: '#ef4444',
        spoiler: false,
        collapsed: false,
        components: [
          {
            id: 'c_g_sec_1',
            type: 'section',
            sectionContent: '### {user} opuścił nasz serwer {server} 😿\nBędziemy tęsknić! Zostało nas **{memberCount}** kotków.',
          },
        ],
      },
    ],
  });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSave = () => {
    showToast('Pomyślnie zapisano ustawienia powitań i pożegnań!');
  };

  const handleSendTestWelcome = () => {
    showToast(`Wysłano testowe powitanie na kanał ${welcomeChannel}!`);
  };

  const handleSendTestGoodbye = () => {
    showToast(`Wysłano testowe pożegnanie na kanał ${goodbyeChannel}!`);
  };

  const insertVariable = (varName: string, isWelcome: boolean) => {
    if (isWelcome) {
      if (welcomeConfig.mode === 'text') {
        setWelcomeConfig({ ...welcomeConfig, plainText: welcomeConfig.plainText + ' ' + varName });
      } else {
        setWelcomeConfig({ ...welcomeConfig, description: welcomeConfig.description + ' ' + varName });
      }
    } else {
      if (goodbyeConfig.mode === 'text') {
        setGoodbyeConfig({ ...goodbyeConfig, plainText: goodbyeConfig.plainText + ' ' + varName });
      } else {
        setGoodbyeConfig({ ...goodbyeConfig, description: goodbyeConfig.description + ' ' + varName });
      }
    }
    showToast(`Wstawiono zmienną ${varName}!`);
  };

  // Dodawanie pola w Embed v1
  const handleAddV1Field = () => {
    const newField: DiscordField = {
      name: 'Nowe pole',
      value: 'Wpisz treść pola tutaj...',
      inline: true,
    };
    setWelcomeConfig({
      ...welcomeConfig,
      fields: [...welcomeConfig.fields, newField],
    });
  };

  const handleUpdateV1Field = (idx: number, key: keyof DiscordField, val: any) => {
    const updated = [...welcomeConfig.fields];
    updated[idx] = { ...updated[idx], [key]: val };
    setWelcomeConfig({ ...welcomeConfig, fields: updated });
  };

  const handleDeleteV1Field = (idx: number) => {
    const updated = [...welcomeConfig.fields];
    updated.splice(idx, 1);
    setWelcomeConfig({ ...welcomeConfig, fields: updated });
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

      {/* Główny kontener - rozciągnięty od boku do boku z lekką przerwą */}
      <div className="w-full space-y-6 pb-12">
        {/* Top Header z powrotem i przyciskiem zapisu */}
        <div className="border-b border-[#2b2f35] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              id="back-to-dashboard-btn"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors mb-2 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Wróć do Dashboardu</span>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <UserPlus className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Welcome System
                </h1>
                <p className="text-xs text-zinc-400">
                  Zarządzanie powitaniami oraz pożegnaniami użytkowników
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="save-welcome-system-top-btn"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Zapisz zmiany</span>
            </button>
          </div>
        </div>

        {/* Zakładki: Powitania i Pożegnania (zawsze zielone akcenty) */}
        <div className="flex items-center gap-2 border-b border-[#2b2f35] pb-1">
          <button
            id="tab-welcome-btn"
            onClick={() => setActiveTab('welcome')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'welcome'
                ? 'bg-[#252a30] text-emerald-400 border border-[#363c46]'
                : 'text-zinc-400 hover:text-white hover:bg-[#1d2024]'
            }`}
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Powitania (Welcome)</span>
            <span className={`w-2 h-2 rounded-full ${welcomeEnabled ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          </button>

          <button
            id="tab-goodbye-btn"
            onClick={() => setActiveTab('goodbye')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'goodbye'
                ? 'bg-[#252a30] text-emerald-400 border border-[#363c46]'
                : 'text-zinc-400 hover:text-white hover:bg-[#1d2024]'
            }`}
          >
            <UserMinus className="w-4 h-4 text-emerald-400" />
            <span>Pożegnania (Goodbye)</span>
            <span className={`w-2 h-2 rounded-full ${goodbyeEnabled ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          </button>

          <button
            id="tab-autoping-btn"
            onClick={() => setActiveTab('autoping')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'autoping'
                ? 'bg-[#252a30] text-emerald-400 border border-[#363c46]'
                : 'text-zinc-400 hover:text-white hover:bg-[#1d2024]'
            }`}
          >
            <Ghost className="w-4 h-4 text-emerald-400" />
            <span>Auto Ping (Ghost Ping)</span>
            <span className={`w-2 h-2 rounded-full ${autoPingEnabled ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          </button>
        </div>

        {/* ======================= ZAKŁADKA 1: POWITANIA ======================= */}
        {activeTab === 'welcome' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Custom Switch: Status modułu powitań */}
            <CustomSwitch
              id="switch-welcome-status"
              checked={welcomeEnabled}
              onChange={setWelcomeEnabled}
              label="Status systemu powitań"
              description="Wysyłaj automatyczną wiadomość, gdy nowy użytkownik dołączy do serwera."
            />

            {/* Custom Selecty: Kanał powitań oraz Automatyczna Rola */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-2">
                <label className="text-zinc-200 font-bold text-xs flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Kanał powitań</span>
                </label>
                <p className="text-zinc-400 text-[11px]">Gdzie bot ma publikować wiadomość powitalną?</p>
                <CustomSelect
                  value={welcomeChannel}
                  onChange={setWelcomeChannel}
                  options={channelOptions}
                  icon={Hash}
                  placeholder={channelOptions.length === 0 ? "Brak kanałów na serwerze" : "Wybierz kanał powitań"}
                  disabled={channelOptions.length === 0}
                  ariaLabel="Wybierz kanał powitań"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-2">
                <label className="text-zinc-200 font-bold text-xs flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Automatyczna rola (Auto-Role)</span>
                </label>
                <p className="text-zinc-400 text-[11px]">Rola nadawana automatycznie po dołączeniu</p>
                <CustomSelect
                  value={autoRole}
                  onChange={setAutoRole}
                  options={roleOptions}
                  icon={Shield}
                  placeholder={roleOptions.length === 0 ? "Brak ról na serwerze" : "Wybierz automatyczną rolę"}
                  disabled={roleOptions.length === 0}
                  ariaLabel="Wybierz automatyczną rolę"
                />
              </div>
            </div>

            {/* ================= SEKCJA FORMATU WIADOMOŚCI POWITALNEJ ================= */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4">
              {/* Belka nagłówka: Po lewej wybór formatu (Text / Embed v1 / Embed v2), po prawej Dostępne zmienne */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#2d323b] pb-4">
                {/* Po lewej stronie: Wybór formatu wiadomości */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Format wiadomości powitalnej</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 bg-[#16181b] p-1 rounded-lg border border-[#2e333b]">
                    <button
                      type="button"
                      onClick={() => setWelcomeConfig({ ...welcomeConfig, mode: 'text' })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                        welcomeConfig.mode === 'text'
                          ? 'bg-[#252a32] text-emerald-400 font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Zwykła wiadomość</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWelcomeConfig({ ...welcomeConfig, mode: 'embed_v1' })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                        welcomeConfig.mode === 'embed_v1'
                          ? 'bg-[#252a32] text-emerald-400 font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Embed v1</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWelcomeConfig({ ...welcomeConfig, mode: 'embed_v2' })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                        welcomeConfig.mode === 'embed_v2'
                          ? 'bg-[#252a32] text-emerald-400 font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Embed z komponentami v2</span>
                    </button>
                  </div>
                </div>

                {/* Po prawej stronie: Dostępne zmienne */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-zinc-400 font-mono">Dostępne zmienne:</span>
                  {(['{user}', '{server}', '{memberCount}'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      title="Kliknij, aby wstawić"
                      onClick={() => insertVariable(v, true)}
                      className="px-2 py-0.5 rounded bg-[#16181b] hover:bg-[#252a32] border border-[#2e333b] hover:border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* EDYTOR: W ZALEŻNOŚCI OD FORMATU */}
              <div className="space-y-4 pt-1">
                {/* 1. TRYB: ZWYKŁA WIADOMOŚĆ */}
                {welcomeConfig.mode === 'text' && (
                  <div className="space-y-2">
                    <label className="text-zinc-200 font-bold text-xs flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Treść wiadomości tekstowej</span>
                    </label>
                    <textarea
                      rows={4}
                      value={welcomeConfig.plainText}
                      onChange={(e) =>
                        setWelcomeConfig({ ...welcomeConfig, plainText: e.target.value })
                      }
                      placeholder="Wpisz treść wiadomości powitalnej..."
                      className="w-full bg-[#16181b] border border-[#2e333b] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-lg p-3 text-white outline-none text-xs leading-relaxed transition-all"
                    />
                  </div>
                )}

                {/* 2. TRYB: EMBED V1 (KLASYCZNY DISCORD EMBED) */}
                {welcomeConfig.mode === 'embed_v1' && (
                  <div className="space-y-4">
                    {/* Tytuł & Kolor */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-8 space-y-1">
                        <label className="text-xs font-semibold text-zinc-300">Tytuł Embedu</label>
                        <input
                          type="text"
                          value={welcomeConfig.title}
                          onChange={(e) =>
                            setWelcomeConfig({ ...welcomeConfig, title: e.target.value })
                          }
                          className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Kolor paska bocznego</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={welcomeConfig.color}
                            onChange={(e) =>
                              setWelcomeConfig({ ...welcomeConfig, color: e.target.value })
                            }
                            className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <div className="flex items-center gap-1 flex-1">
                            {COLOR_PRESETS.map((col) => (
                              <button
                                key={col.value}
                                type="button"
                                onClick={() =>
                                  setWelcomeConfig({ ...welcomeConfig, color: col.value })
                                }
                                style={{ backgroundColor: col.value }}
                                className={`w-5 h-5 rounded-full border transition-transform ${
                                  welcomeConfig.color === col.value
                                    ? 'scale-110 border-white ring-2 ring-emerald-500/40'
                                    : 'border-transparent opacity-80 hover:opacity-100'
                                }`}
                                title={col.label}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Treść / Opis */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-300">Opis (Description)</label>
                      <textarea
                        rows={3}
                        value={welcomeConfig.description}
                        onChange={(e) =>
                          setWelcomeConfig({ ...welcomeConfig, description: e.target.value })
                        }
                        className="w-full bg-[#16181b] border border-[#2e333b] focus:border-emerald-500 rounded-lg p-3 text-white outline-none text-xs leading-relaxed"
                      />
                    </div>

                    {/* Pola (Fields) w Embed v1 */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                          Pola Embedu (Fields)
                        </span>
                        <button
                          type="button"
                          onClick={handleAddV1Field}
                          className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Dodaj pole</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {welcomeConfig.fields.map((f, fIdx) => (
                          <div
                            key={fIdx}
                            className="p-3 rounded-lg bg-[#16181b] border border-[#2b3038] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                          >
                            <div className="sm:col-span-4">
                              <input
                                type="text"
                                value={f.name}
                                onChange={(e) =>
                                  handleUpdateV1Field(fIdx, 'name', e.target.value)
                                }
                                placeholder="Tytuł pola"
                                className="w-full bg-[#1e2227] border border-[#2e333b] rounded px-2.5 py-1 text-xs text-white focus:border-emerald-500 outline-none"
                              />
                            </div>
                            <div className="sm:col-span-5">
                              <input
                                type="text"
                                value={f.value}
                                onChange={(e) =>
                                  handleUpdateV1Field(fIdx, 'value', e.target.value)
                                }
                                placeholder="Wartość pola"
                                className="w-full bg-[#1e2227] border border-[#2e333b] rounded px-2.5 py-1 text-xs text-white focus:border-emerald-500 outline-none"
                              />
                            </div>
                            <div className="sm:col-span-2 flex items-center">
                              <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={f.inline}
                                  onChange={(e) =>
                                    handleUpdateV1Field(fIdx, 'inline', e.target.checked)
                                  }
                                  className="accent-emerald-500 w-3.5 h-3.5 rounded"
                                />
                                <span>Inline</span>
                              </label>
                            </div>
                            <div className="sm:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleDeleteV1Field(fIdx)}
                                className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-[#252a32] rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stopka */}
                    <div className="space-y-1 pt-1">
                      <label className="text-xs font-semibold text-zinc-300">Tekst w stopce (Footer)</label>
                      <input
                        type="text"
                        value={welcomeConfig.footerText}
                        onChange={(e) =>
                          setWelcomeConfig({ ...welcomeConfig, footerText: e.target.value })
                        }
                        className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 3. TRYB: EMBED Z NOWYMI KOMPONENTAMI V2 (EMBED MAKER) */}
                {welcomeConfig.mode === 'embed_v2' && (
                  <div className="space-y-4">
                    {/* Główny nagłówek embedu */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-8 space-y-1">
                        <label className="text-xs font-semibold text-zinc-300">Tytuł Embedu</label>
                        <input
                          type="text"
                          value={welcomeConfig.title}
                          onChange={(e) =>
                            setWelcomeConfig({ ...welcomeConfig, title: e.target.value })
                          }
                          className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Kolor paska bocznego</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={welcomeConfig.color}
                            onChange={(e) =>
                              setWelcomeConfig({ ...welcomeConfig, color: e.target.value })
                            }
                            className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <div className="flex items-center gap-1 flex-1">
                            {COLOR_PRESETS.map((col) => (
                              <button
                                key={col.value}
                                type="button"
                                onClick={() =>
                                  setWelcomeConfig({ ...welcomeConfig, color: col.value })
                                }
                                style={{ backgroundColor: col.value }}
                                className={`w-5 h-5 rounded-full border transition-transform ${
                                  welcomeConfig.color === col.value
                                    ? 'scale-110 border-white ring-2 ring-emerald-500/40'
                                    : 'border-transparent opacity-80 hover:opacity-100'
                                }`}
                                title={col.label}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Opis embedu */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-300">Główna treść embedu (Opis)</label>
                      <textarea
                        rows={3}
                        value={welcomeConfig.description}
                        onChange={(e) =>
                          setWelcomeConfig({ ...welcomeConfig, description: e.target.value })
                        }
                        className="w-full bg-[#16181b] border border-[#2e333b] focus:border-emerald-500 rounded-lg p-3 text-white outline-none text-xs leading-relaxed"
                      />
                    </div>

                    {/* EDYTOR KONTENERÓW MESSAGE.STYLE (DISCORD COMPONENTS V2) */}
                    <div className="pt-1">
                      <div className="mb-3 p-3 rounded-lg bg-[#14161a] border border-[#2e333b] flex items-center justify-between text-xs text-zinc-300">
                        <div>
                          <span className="font-bold text-emerald-400">message.style Containers</span>
                          <p className="text-[11px] text-zinc-400">
                            Dodawaj kontenery, a do każdego z nich przypisuj przyciski (Action Row), menu wyboru (Select Menu), sekcje z miniaturami oraz separatory.
                          </p>
                        </div>
                      </div>
                      <MessageStyleEditor
                        containers={welcomeConfig.containers}
                        onChangeContainers={(containers: MessageContainer[]) =>
                          setWelcomeConfig({ ...welcomeConfig, containers })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ================= PODGLĄD DISCORDA NA ŻYWO ================= */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Podgląd na żywo na Discordzie</span>
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  Aktualizuje się w czasie rzeczywistym
                </span>
              </div>

              <DiscordPreview config={welcomeConfig} />
            </div>

            {/* Custom Switch dla opcji DM */}
            <CustomSwitch
              id="switch-welcome-dm"
              checked={sendWelcomeDM}
              onChange={setSendWelcomeDM}
              label="Wyślij też powitanie w wiadomości prywatnej (DM)"
              description="Wiadomość trafi bezpośrednio do skrzynki użytkownika na Discordzie."
            />

            {/* Przycisk wysłania testu */}
            <div className="pt-2 flex justify-start">
              <button
                type="button"
                id="btn-test-welcome"
                onClick={handleSendTestWelcome}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25292e] hover:bg-[#2e333a] text-zinc-200 hover:text-white text-xs font-semibold border border-[#353b44] hover:border-emerald-500/50 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Wyślij testowe powitanie</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================= ZAKŁADKA 2: POŻEGNANIA ======================= */}
        {activeTab === 'goodbye' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Custom Switch: Status modułu pożegnań (zawsze zielony) */}
            <CustomSwitch
              id="switch-goodbye-status"
              checked={goodbyeEnabled}
              onChange={setGoodbyeEnabled}
              label="Status systemu pożegnań"
              description="Informuj społeczność, gdy użytkownik opuści serwer."
            />

            {/* Custom Select: Kanał pożegnań */}
            <div className="p-4 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-2">
              <label className="text-zinc-200 font-bold text-xs flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Kanał pożegnań</span>
              </label>
              <p className="text-zinc-400 text-[11px]">Gdzie bot ma wysyłać informację o opuszczeniu serwera?</p>
              <CustomSelect
                value={goodbyeChannel}
                onChange={setGoodbyeChannel}
                options={channelOptions}
                icon={Hash}
                placeholder={channelOptions.length === 0 ? "Brak kanałów na serwerze" : "Wybierz kanał pożegnań"}
                disabled={channelOptions.length === 0}
                ariaLabel="Wybierz kanał pożegnań"
              />
            </div>

            {/* Wybór formatu pożegnania */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#2d323b] pb-4">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Format wiadomości pożegnalnej</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 bg-[#16181b] p-1 rounded-lg border border-[#2e333b]">
                    <button
                      type="button"
                      onClick={() => setGoodbyeConfig({ ...goodbyeConfig, mode: 'text' })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                        goodbyeConfig.mode === 'text'
                          ? 'bg-[#252a32] text-emerald-400 font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Zwykła wiadomość</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGoodbyeConfig({ ...goodbyeConfig, mode: 'embed_v1' })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                        goodbyeConfig.mode === 'embed_v1'
                          ? 'bg-[#252a32] text-emerald-400 font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Embed v1</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGoodbyeConfig({ ...goodbyeConfig, mode: 'embed_v2' })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                        goodbyeConfig.mode === 'embed_v2'
                          ? 'bg-[#252a32] text-emerald-400 font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Embed z komponentami v2</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-zinc-400 font-mono">Dostępne zmienne:</span>
                  {(['{user}', '{server}', '{memberCount}'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      title="Kliknij, aby wstawić"
                      onClick={() => insertVariable(v, false)}
                      className="px-2 py-0.5 rounded bg-[#16181b] hover:bg-[#252a32] border border-[#2e333b] hover:border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edycja pożegnania */}
              {goodbyeConfig.mode === 'text' && (
                <div className="space-y-2">
                  <label className="text-zinc-200 font-bold text-xs flex items-center gap-1.5">
                    <UserMinus className="w-4 h-4 text-emerald-400" />
                    <span>Treść wiadomości pożegnalnej</span>
                  </label>
                  <textarea
                    rows={3}
                    value={goodbyeConfig.plainText}
                    onChange={(e) =>
                      setGoodbyeConfig({ ...goodbyeConfig, plainText: e.target.value })
                    }
                    placeholder="Wpisz treść wiadomości pożegnalnej..."
                    className="w-full bg-[#16181b] border border-[#2e333b] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-lg p-3 text-white outline-none text-xs leading-relaxed transition-all"
                  />
                </div>
              )}

              {goodbyeConfig.mode === 'embed_v1' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Tytuł</label>
                    <input
                      type="text"
                      value={goodbyeConfig.title}
                      onChange={(e) =>
                        setGoodbyeConfig({ ...goodbyeConfig, title: e.target.value })
                      }
                      className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Treść pożegnania</label>
                    <textarea
                      rows={3}
                      value={goodbyeConfig.description}
                      onChange={(e) =>
                        setGoodbyeConfig({ ...goodbyeConfig, description: e.target.value })
                      }
                      className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg p-3 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {goodbyeConfig.mode === 'embed_v2' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Tytuł</label>
                    <input
                      type="text"
                      value={goodbyeConfig.title}
                      onChange={(e) =>
                        setGoodbyeConfig({ ...goodbyeConfig, title: e.target.value })
                      }
                      className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Treść pożegnania</label>
                    <textarea
                      rows={3}
                      value={goodbyeConfig.description}
                      onChange={(e) =>
                        setGoodbyeConfig({ ...goodbyeConfig, description: e.target.value })
                      }
                      className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg p-3 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <MessageStyleEditor
                    containers={goodbyeConfig.containers}
                    onChangeContainers={(containers) =>
                      setGoodbyeConfig({ ...goodbyeConfig, containers })
                    }
                  />
                </div>
              )}
            </div>

            {/* Podgląd pożegnania na Discordzie */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Podgląd pożegnania na żywo</span>
                </span>
              </div>
              <DiscordPreview config={goodbyeConfig} />
            </div>

            {/* Custom Switch dla opcji DM w pożegnaniach */}
            <CustomSwitch
              id="switch-goodbye-dm"
              checked={sendGoodbyeDM}
              onChange={setSendGoodbyeDM}
              label="Wyślij też pożegnanie w wiadomości prywatnej (DM)"
              description="Podziękowanie za wspólnie spędzony czas przesłane bezpośrednio użytkownikowi."
            />

            {/* Przycisk wysłania testu (zawsze zielony akcent) */}
            <div className="pt-2 flex justify-start">
              <button
                type="button"
                id="btn-test-goodbye"
                onClick={handleSendTestGoodbye}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25292e] hover:bg-[#2e333a] text-zinc-200 hover:text-white text-xs font-semibold border border-[#353b44] hover:border-emerald-500/50 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Wyślij testowe pożegnanie</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================= ZAKŁADKA 3: AUTO PING (GHOST PING) ======================= */}
        {activeTab === 'autoping' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Przełącznik główny Auto Ping */}
            <CustomSwitch
              id="switch-autoping-status"
              checked={autoPingEnabled}
              onChange={setAutoPingEnabled}
              label="Status funkcji Auto Ping (Ghost Ping)"
              description="Automatycznie oznacz nowego członka na wybranych kanałach zaraz po wejściu na serwer, po czym usuń wzmiankę."
            />

            {/* Karta wyjaśnienia działania Ghost Pinga */}
            <div className="p-4 sm:p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Ghost className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>Jak działa funkcja Auto Ping?</span>
                </div>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  Gdy nowy użytkownik dołącza do serwera, bot wysyła cichą wzmiankę <code className="text-emerald-300 font-mono">@użytkownik</code> na wybranych ważnych kanałach (np. regulamin, wybór ról, ogłoszenia), a następnie natychmiast ją kasuje (Ghost Ping).
                  Dzięki temu użytkownik otrzymuje czerwone powiadomienie o nieprzeczytanym kanale, co skutecznie kieruje jego uwagę na kluczowe miejsca na serwerze, nie zostawiając żadnych śmieci w historii czatu!
                </p>
              </div>
            </div>

            {/* Wybór ważnych kanałów do Auto Pingowania (do 5 kanałów) */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2c313a] pb-3">
                <div>
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-emerald-400" />
                    <span>Wybierz ważne kanały do Auto Pingowania</span>
                  </label>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Bot oznaczy nowego użytkownika na poniższych kanałach (zalecane do 4–5 kluczowych kanałów)
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#16181b] text-emerald-400 border border-[#2d323b]">
                  Wybrano: {autoPingChannels.length} / 5
                </span>
              </div>

              {/* Lista wybranych kanałów */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Aktywne kanały docelowe:
                </div>
                <div className="flex flex-wrap gap-2">
                  {autoPingChannels.map((channel, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#16181b] border border-[#2f353e] text-xs text-white"
                    >
                      <Hash className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold">{channel}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAutoPingChannels(autoPingChannels.filter((_, i) => i !== idx));
                          showToast(`Usunięto kanał ${channel}`);
                        }}
                        className="text-zinc-500 hover:text-rose-400 transition-colors ml-1"
                        title="Usuń ten kanał"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {autoPingChannels.length === 0 && (
                    <p className="text-xs text-amber-400 italic">
                      Nie wybrano żadnych kanałów. Dodaj przynajmniej jeden poniżej.
                    </p>
                  )}
                </div>
              </div>

              {/* Szybkie dodawanie kanałów z serwera */}
              {autoPingChannels.length < 5 && (
                <div className="pt-2 border-t border-[#2b2f37] space-y-2">
                  <span className="text-[11px] text-zinc-400 font-semibold">
                    Kliknij, aby dodać kanał z serwera:
                  </span>
                  {serverChannels.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">
                      Brak kanałów na tym serwerze. Dodaj kanały w Discordzie, aby móc je tutaj wybrać.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {serverChannels
                        .map((ch) => ch.name)
                        .filter((ch) => !autoPingChannels.includes(ch))
                        .map((ch) => (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => {
                              if (autoPingChannels.length < 5) {
                                setAutoPingChannels([...autoPingChannels, ch]);
                                showToast(`Dodano kanał ${ch}!`);
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-[#16181b] hover:bg-[#252930] text-zinc-300 hover:text-emerald-400 border border-[#2f353e] text-xs flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3 text-emerald-400" />
                            <span>{ch}</span>
                          </button>
                        ))}
                      {serverChannels.filter((c) => !autoPingChannels.includes(c.name)).length === 0 && (
                        <p className="text-xs text-zinc-500 italic">
                          Wszystkie kanały serwera zostały już dodane do listy.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Czas usunięcia wiadomości z pingiem (Ghost delay) */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-200">
                  Czas automatycznego usunięcia pingu
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Po jakim czasie od wysłania wzmianki bot ma bezpowrotnie usunąć wiadomość?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
                {[
                  { delay: 0, label: 'Natychmiast', desc: 'Ghost Ping (<1s)' },
                  { delay: 1, label: '1 sekunda', desc: 'Bardzo szybko' },
                  { delay: 3, label: '3 sekundy', desc: 'Chwilowa widoczność' },
                  { delay: 5, label: '5 sekund', desc: 'Standardowy czas' },
                ].map((item) => (
                  <button
                    key={item.delay}
                    type="button"
                    onClick={() => setAutoPingDeleteDelay(item.delay)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      autoPingDeleteDelay === item.delay
                        ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-md'
                        : 'bg-[#16181b] border-[#2b2f37] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{item.label}</span>
                      {autoPingDeleteDelay === item.delay && (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Własna treść wiadomości pingu */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span>Treść wysyłanego pingu (zmienna: &#123;user&#125;)</span>
                </label>
              </div>
              <p className="text-[11px] text-zinc-400">
                Wiadomość wysyłana na każdym z wybranych kanałów przed jej usunięciem:
              </p>
              <input
                type="text"
                value={autoPingMessage}
                onChange={(e) => setAutoPingMessage(e.target.value)}
                placeholder="{user} 👋 Zapoznaj się z tym kanałem!"
                className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Przycisk testowania Auto Ping */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                id="btn-test-autoping"
                onClick={() => {
                  showToast(
                    `Symulacja Auto Ping: Oznaczono użytkownika na ${autoPingChannels.length} kanałach i usunięto wzmianki!`
                  );
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Ghost className="w-3.5 h-3.5" />
                <span>Przetestuj Auto Ping na żywo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
