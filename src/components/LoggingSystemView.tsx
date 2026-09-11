import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Layers,
  Hash,
  CheckCircle2,
  Trash2,
  Edit3,
  UserPlus,
  UserMinus,
  Ban,
  Shield,
  Volume2,
  Send,
  Save,
  MessageSquare,
  Eye,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { CustomSwitch } from './CustomSwitch';
import { CustomSelect, SelectOption } from './CustomSelect';
import { DiscordPreview } from './DiscordPreview';
import { EmbedConfig } from '../types/embed';

interface LoggingSystemViewProps {
  onBackToDashboard: () => void;
}

export type LogFormatType = 'text' | 'embed_v2';

interface LogEventItem {
  id: string;
  name: string;
  description: string;
  category: 'messages' | 'members' | 'moderation' | 'server' | 'voice';
  enabled: boolean;
  channel?: string;
}

const LOG_CHANNELS: SelectOption[] = [
  { value: '#logi-serwera', label: '#logi-serwera (Główny)' },
  { value: '#mod-log', label: '#mod-log (Moderacja)' },
  { value: '#logi-wiadomości', label: '#logi-wiadomości' },
  { value: '#logi-użytkowników', label: '#logi-użytkowników' },
  { value: '#logi-głosowe', label: '#logi-głosowe' },
];

export const LoggingSystemView: React.FC<LoggingSystemViewProps> = ({ onBackToDashboard }) => {
  const [loggingEnabled, setLoggingEnabled] = useState<boolean>(true);
  const [logFormat, setLogFormat] = useState<LogFormatType>('embed_v2');
  const [globalChannel, setGlobalChannel] = useState<string>('#logi-serwera');
  const [useSeparateChannels, setUseSeparateChannels] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Kategoria dedykowanych kanałów
  const [categoryChannels, setCategoryChannels] = useState<Record<string, string>>({
    messages: '#logi-wiadomości',
    members: '#logi-użytkowników',
    moderation: '#mod-log',
    server: '#logi-serwera',
    voice: '#logi-głosowe',
  });

  // Lista zdarzeń logowania (bogaty wybór!)
  const [events, setEvents] = useState<LogEventItem[]>([
    // Wiadomości
    {
      id: 'msg_delete',
      name: 'Usunięcie wiadomości',
      description: 'Zapisuje treść usuniętej wiadomości, autora oraz kanał tekstowy.',
      category: 'messages',
      enabled: true,
    },
    {
      id: 'msg_edit',
      name: 'Edycja wiadomości',
      description: 'Pokazuje starą i nową wersję edytowanej wiadomości wraz z linkiem.',
      category: 'messages',
      enabled: true,
    },
    {
      id: 'msg_bulk_delete',
      name: 'Masowe usuwanie wiadomości',
      description: 'Rejestruje użycie komend czyszczenia czatu (purge/clear) i liczbę wiadomości.',
      category: 'messages',
      enabled: true,
    },
    {
      id: 'msg_pin',
      name: 'Przypięcie / Odpięcie wiadomości',
      description: 'Informuje o przypięciu lub odpięciu wiadomości na dowolnym kanale.',
      category: 'messages',
      enabled: false,
    },

    // Użytkownicy
    {
      id: 'member_join',
      name: 'Dołączenie użytkownika',
      description: 'Data utworzenia konta, zaproszenie, z którego skorzystał użytkownik.',
      category: 'members',
      enabled: true,
    },
    {
      id: 'member_leave',
      name: 'Opuszczenie serwera',
      description: 'Informacja o odejściu użytkownika i jego dotychczasowych rolach.',
      category: 'members',
      enabled: true,
    },
    {
      id: 'member_nick_change',
      name: 'Zmiana pseudonimu',
      description: 'Rejestruje zmianę nicku serwerowego (stary nick -> nowy nick).',
      category: 'members',
      enabled: true,
    },
    {
      id: 'member_role_update',
      name: 'Nadanie lub odebranie roli',
      description: 'Loguje przypisanie nowej roli lub odebranie uprawnień przez moderatora.',
      category: 'members',
      enabled: true,
    },
    {
      id: 'member_avatar_change',
      name: 'Aktualizacja awatara',
      description: 'Powiadamia o zmianie zdjęcia profilowego użytkownika.',
      category: 'members',
      enabled: false,
    },

    // Moderacja
    {
      id: 'mod_ban',
      name: 'Zbanowanie użytkownika',
      description: 'Rejestruje banicję, moderatora wydającego karę oraz podany powód.',
      category: 'moderation',
      enabled: true,
    },
    {
      id: 'mod_unban',
      name: 'Odbanowanie użytkownika',
      description: 'Informuje o cofnięciu blokady z danego konta.',
      category: 'moderation',
      enabled: true,
    },
    {
      id: 'mod_timeout',
      name: 'Wyciszenie (Timeout)',
      description: 'Zapisuje nałożenie lub przedwczesne zdjęcie timeoutu na użytkownika.',
      category: 'moderation',
      enabled: true,
    },
    {
      id: 'mod_kick',
      name: 'Wyrzucenie (Kick)',
      description: 'Loguje wyrzucenie użytkownika z serwera wraz z powodem.',
      category: 'moderation',
      enabled: true,
    },

    // Serwer & Kanały
    {
      id: 'channel_create_delete',
      name: 'Tworzenie / Usuwanie kanałów',
      description: 'Powiadamia o dodaniu nowego kanału lub skasowaniu istniejącego.',
      category: 'server',
      enabled: true,
    },
    {
      id: 'channel_update',
      name: 'Zmiana uprawnień kanału',
      description: 'Zapisuje modyfikacje permisji, nazwy lub opisu kanału.',
      category: 'server',
      enabled: false,
    },
    {
      id: 'role_create_delete',
      name: 'Tworzenie / Usuwanie ról',
      description: 'Rejestruje utworzenie roli, jej uprawnienia i kolor.',
      category: 'server',
      enabled: true,
    },

    // Głosowe
    {
      id: 'voice_join_leave',
      name: 'Dołączenie / Wyjście z kanału głosowego',
      description: 'Loguje wejście na kanał głosowy lub rozłączenie się.',
      category: 'voice',
      enabled: true,
    },
    {
      id: 'voice_move',
      name: 'Przeniesienie na inny kanał głosowy',
      description: 'Rejestruje przenosiny użytkownika między pokojami głosowymi.',
      category: 'voice',
      enabled: true,
    },
    {
      id: 'voice_server_mute',
      name: 'Wyciszenie / Ogłuszenie przez moderatora',
      description: 'Zapisuje nałożenie Server Mute lub Server Deafen na kanale głosowym.',
      category: 'voice',
      enabled: true,
    },
  ]);

  // Aktywne zdarzenie demonstracyjne w podglądzie
  const [previewEventId, setPreviewEventId] = useState<string>('msg_delete');

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleEvent = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))
    );
  };

  const handleToggleAllCategory = (cat: string, status: boolean) => {
    setEvents((prev) =>
      prev.map((e) => (cat === 'all' || e.category === cat ? { ...e, enabled: status } : e))
    );
    showToast(status ? 'Włączono wszystkie zdarzenia!' : 'Wyłączono zdarzenia!');
  };

  const handleSave = () => {
    showToast('Pomyślnie zapisano konfigurację systemu logów!');
  };

  const handleSendTestLog = () => {
    const target = useSeparateChannels
      ? categoryChannels[events.find((e) => e.id === previewEventId)?.category || 'messages']
      : globalChannel;
    showToast(`Wysłano przykładowy log (${previewEventId}) na kanał ${target}!`);
  };

  // Generowanie konfiguracji podglądu na żywo w zależności od wybranego formatu
  const getPreviewConfig = (): EmbedConfig => {
    const currentEv = events.find((e) => e.id === previewEventId) || events[0];

    // Format 1: Zwykły tekst
    if (logFormat === 'text') {
      let text = '';
      if (currentEv.id === 'msg_delete') {
        text = `[2026-09-07 12:45:10] 🗑️ [WIADOMOŚĆ USUNIĘTA]\nAutor: @Janek (ID: 4120938471)\nKanał: #czat-ogólny\nTreść: "Hej, czy ktoś wie jak zdobyć rolę na serwerze?"`;
      } else if (currentEv.id === 'mod_ban') {
        text = `[2026-09-07 12:48:33] 🔨 [UŻYTKOWNIK ZBANOWANY]\nUżytkownik: @SpamBot (ID: 991823712)\nModerator: @AdminKotek\nPowód: Reklama innych serwerów Discord`;
      } else if (currentEv.id === 'member_role_update') {
        text = `[2026-09-07 12:51:04] 🎭 [AKTUALIZACJA RÓL]\nUżytkownik: @Marta (ID: 334918274)\nModerator: @KotekBot\nDodano rolę: @VIP`;
      } else {
        text = `[2026-09-07 12:55:00] ℹ️ [ZDARZENIE: ${currentEv.name.toUpperCase()}]\nUżytkownik: @NowyKotek na serwerze {server}`;
      }

      return {
        mode: 'text',
        plainText: text,
        title: '',
        description: '',
        color: '#10b981',
        authorName: '',
        authorIcon: '',
        thumbnailUrl: '',
        imageUrl: '',
        footerText: '',
        fields: [],
        containers: [],
      };
    }

    // Format 2: Embed v2 (message.style)
    let containerColor = '#ef4444'; // Czerwony dla usunięcia/bana
    let sectionContent = '';
    let accessoryUrl = 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=100&auto=format&fit=crop&q=80';

    if (currentEv.id === 'msg_delete') {
      containerColor = '#ef4444';
      sectionContent = `### 🗑️ Usunięto wiadomość\n**Autor:** @Janek \`[4120938471]\`\n**Kanał:** #czat-ogólny\n**Czas:** Dzisiaj o 12:45:10\n\n> *„Hej, czy ktoś wie jak zdobyć rolę na serwerze?”*`;
    } else if (currentEv.id === 'mod_ban') {
      containerColor = '#dc2626';
      sectionContent = `### 🔨 Zbanowano użytkownika\n**Ukarany:** @SpamBot \`[991823712]\`\n**Moderator:** @AdminKotek\n**Powód:** *Rozsyłanie linków phishingowych i reklama*\n**ID kary:** \`#BAN-9402\``;
    } else if (currentEv.id === 'member_role_update') {
      containerColor = '#3b82f6';
      sectionContent = `### 🎭 Nadano rolę użytkownikowi\n**Użytkownik:** @Marta \`[334918274]\`\n**Nadana rola:** \`@VIP\`\n**Odpowiedzialny:** @KotekBot (Automatyczny system powitań)`;
    } else {
      containerColor = '#10b981';
      sectionContent = `### 📥 ${currentEv.name}\n**Użytkownik:** @NowyKotek na kanale {server}\n**Szczegóły:** Zdarzenie zarejestrowane przez audyt bota.`;
    }

    return {
      mode: 'embed_v2',
      plainText: '',
      title: '',
      description: '',
      color: containerColor,
      authorName: 'Kitek Audit Log',
      authorIcon: accessoryUrl,
      thumbnailUrl: '',
      imageUrl: '',
      footerText: 'Log wygenerowany automatycznie',
      fields: [],
      containers: [
        {
          id: 'log_container_1',
          color: containerColor,
          spoiler: false,
          collapsed: false,
          components: [
            {
              id: 'log_c_sec_1',
              type: 'section',
              accessory: {
                type: 'Thumbnail',
                fileUrl: accessoryUrl,
                description: 'Avatar',
                spoiler: false,
              },
              sectionContent: sectionContent,
            },
            {
              id: 'log_c_sep_1',
              type: 'separator',
              spacing: 'Small',
              divider: true,
            },
            {
              id: 'log_c_btn_1',
              type: 'button_row',
              buttons: [
                { id: 'b_prof', label: 'Profil Użytkownika', style: 'secondary', emoji: '👤' },
                { id: 'b_mod', label: 'Dziennik Kar', style: 'primary', emoji: '🛡️' },
              ],
            },
          ],
        },
      ],
    };
  };

  const filteredEvents =
    activeCategory === 'all'
      ? events
      : events.filter((e) => e.category === activeCategory);

  return (
    <div className="flex-1 bg-[#1a1d21] text-white px-5 sm:px-7 py-6 h-full overflow-y-auto min-h-0 w-full">
      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#15181a] border border-emerald-500/80 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-mono font-bold animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      <div className="w-full space-y-6 pb-12">
        {/* Header */}
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
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Logging System
                </h1>
                <p className="text-xs text-zinc-400">
                  Dziennik zdarzeń serwera, audyt moderacji oraz rejestracja aktywności
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSendTestLog}
              className="px-3.5 py-2 rounded-lg bg-[#252a30] hover:bg-[#2e343d] text-zinc-200 border border-[#373d47] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Wyślij testowy log</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Zapisz ustawienia</span>
            </button>
          </div>
        </div>

        {/* Główny przełącznik modułu logów */}
        <CustomSwitch
          id="switch-logging-status"
          checked={loggingEnabled}
          onChange={setLoggingEnabled}
          label="Status systemu logów serwera"
          description="Zapisuj wszystkie istotne zdarzenia (wiadomości, bany, role, dołączenia) na wskazanych kanałach."
        />

        {/* ================= WYBÓR FORMATU LOGÓW (WYMAGANE PRZEZ UŻYTKOWNIKA 2 FORMATY) ================= */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2c313a] pb-3">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Format wysyłanych logów</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Wybierz jak bot ma formatować logi publikowane na kanałach audytu
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 self-start sm:self-center">
              Wybrano: {logFormat === 'text' ? 'Zwykły tekst' : 'Embed v2'}
            </span>
          </div>

          {/* 2 Duże Przyciski wyboru formatu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Opcja 1: Zwykły tekst */}
            <div
              onClick={() => setLogFormat('text')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                logFormat === 'text'
                  ? 'bg-emerald-500/10 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-[#181a1e] border-[#2b2f37] hover:border-zinc-500 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    logFormat === 'text'
                      ? 'bg-emerald-500 text-black'
                      : 'bg-[#23272e] text-zinc-400'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>1. Zwykły tekst (Plain Text)</span>
                    {logFormat === 'text' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Pisze po prostu czysty tekst z informacjami i timestampem. Minimalistyczny, nie zaśmieca ekranu.
                  </p>
                </div>
              </div>
            </div>

            {/* Opcja 2: Embed v2 */}
            <div
              onClick={() => setLogFormat('embed_v2')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                logFormat === 'embed_v2'
                  ? 'bg-emerald-500/10 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-[#181a1e] border-[#2b2f37] hover:border-zinc-500 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    logFormat === 'embed_v2'
                      ? 'bg-emerald-500 text-black'
                      : 'bg-[#23272e] text-zinc-400'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>2. Embed v2 (message.style)</span>
                    {logFormat === 'embed_v2' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Nowoczesny kontener Discord v2 z kolorowym paskiem akcji, miniaturami, polami i przyciskami.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= KONFIGURACJA KANAŁÓW LOGOWANIA ================= */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4">
          <div className="flex items-center justify-between border-b border-[#2c313a] pb-3">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Hash className="w-4 h-4 text-emerald-400" />
                <span>Kanały docelowe logów</span>
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Określ, gdzie bot ma wysyłać wygenerowane wpisy dziennika zdarzeń
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="separate-channels-check"
                checked={useSeparateChannels}
                onChange={(e) => setUseSeparateChannels(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
              <label
                htmlFor="separate-channels-check"
                className="text-xs font-semibold text-zinc-200 cursor-pointer"
              >
                Rozdzielaj logi na oddzielne kanały tematyczne (Wiadomości, Moderacja, Użytkownicy itp.)
              </label>
            </div>

            {!useSeparateChannels ? (
              <div className="p-4 rounded-lg bg-[#181a1e] border border-[#2c313a] space-y-2">
                <label className="text-xs font-bold text-zinc-300">
                  Wspólny kanał dla wszystkich logów
                </label>
                <p className="text-[11px] text-zinc-400">
                  Wszystkie aktywne wpisy zdarzeń trafią na ten jeden kanał.
                </p>
                <CustomSelect
                  value={globalChannel}
                  onChange={setGlobalChannel}
                  options={LOG_CHANNELS}
                  icon={Hash}
                  ariaLabel="Wybierz główny kanał logów"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-[#181a1e] border border-[#2c313a] space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>Kanał logów wiadomości:</span>
                  </span>
                  <CustomSelect
                    value={categoryChannels.messages}
                    onChange={(val) =>
                      setCategoryChannels({ ...categoryChannels, messages: val })
                    }
                    options={LOG_CHANNELS}
                    icon={Hash}
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#181a1e] border border-[#2c313a] space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kanał logów użytkowników:</span>
                  </span>
                  <CustomSelect
                    value={categoryChannels.members}
                    onChange={(val) =>
                      setCategoryChannels({ ...categoryChannels, members: val })
                    }
                    options={LOG_CHANNELS}
                    icon={Hash}
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#181a1e] border border-[#2c313a] space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    <span>Kanał logów moderacji (bany, kary):</span>
                  </span>
                  <CustomSelect
                    value={categoryChannels.moderation}
                    onChange={(val) =>
                      setCategoryChannels({ ...categoryChannels, moderation: val })
                    }
                    options={LOG_CHANNELS}
                    icon={Hash}
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#181a1e] border border-[#2c313a] space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Kanał logów głosowych (VC):</span>
                  </span>
                  <CustomSelect
                    value={categoryChannels.voice}
                    onChange={(val) =>
                      setCategoryChannels({ ...categoryChannels, voice: val })
                    }
                    options={LOG_CHANNELS}
                    icon={Hash}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= BOGATA LISTA ZDARZEŃ I PODGLĄD NA ŻYWO (SPLIT VIEW) ================= */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Lewa strona: Filtry i lista zdarzeń */}
          <div className="xl:col-span-7 space-y-4">
            <div className="p-4 sm:p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2c313a] pb-3">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Wybierz zdarzenia do rejestrowania</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Zaznacz, jakie akcje na serwerze mają generować wpis w dzienniku
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAllCategory(activeCategory, true)}
                    className="text-[11px] text-emerald-400 hover:underline font-semibold"
                  >
                    Włącz wszystkie
                  </button>
                  <span className="text-zinc-600">|</span>
                  <button
                    type="button"
                    onClick={() => handleToggleAllCategory(activeCategory, false)}
                    className="text-[11px] text-rose-400 hover:underline font-semibold"
                  >
                    Wyłącz wszystkie
                  </button>
                </div>
              </div>

              {/* Zakładki kategorii zdarzeń */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { id: 'all', label: 'Wszystkie' },
                  { id: 'messages', label: '💬 Wiadomości' },
                  { id: 'members', label: '👥 Użytkownicy' },
                  { id: 'moderation', label: '🛡️ Moderacja' },
                  { id: 'server', label: '📁 Serwer & Role' },
                  { id: 'voice', label: '🎙️ Głosowe' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeCategory === tab.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                        : 'bg-[#181a1e] text-zinc-400 hover:text-white border border-[#2b2f37]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Lista przełączników zdarzeń */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                      ev.enabled
                        ? 'bg-[#1a1d23] border-[#343b46]'
                        : 'bg-[#16181b]/60 border-[#26292f] opacity-75'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{ev.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#23272e] text-zinc-400">
                          {ev.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        {ev.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewEventId(ev.id)}
                        title="Zobacz w podglądzie"
                        className={`p-1.5 rounded text-xs transition-colors ${
                          previewEventId === ev.id
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'text-zinc-400 hover:text-white bg-[#22262d]'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="checkbox"
                        checked={ev.enabled}
                        onChange={() => handleToggleEvent(ev.id)}
                        className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Prawa strona: Podgląd na żywo wybranego zdarzenia */}
          <div className="xl:col-span-5 space-y-3 xl:sticky xl:top-6">
            <div className="p-4 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#2c313a] pb-2.5">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Podgląd na żywo na Discordzie</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase bg-[#181a1e] px-2 py-0.5 rounded border border-[#2c313a]">
                  Format: {logFormat === 'text' ? 'Zwykły tekst' : 'Embed v2'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-zinc-400 shrink-0">Podglądane zdarzenie:</span>
                <div className="w-56">
                  <CustomSelect
                    value={previewEventId}
                    onChange={(val) => setPreviewEventId(val)}
                    options={[
                      { value: 'msg_delete', label: 'Usunięcie wiadomości', prefix: '🗑️' },
                      { value: 'mod_ban', label: 'Zbanowanie użytkownika', prefix: '🔨' },
                      { value: 'member_role_update', label: 'Aktualizacja ról', prefix: '👑' },
                      { value: 'member_join', label: 'Dołączenie do serwera', prefix: '👋' },
                    ]}
                    size="sm"
                    triggerClassName="bg-[#16181b] border-[#2b2f37]"
                  />
                </div>
              </div>

              {/* Komponent DiscordPreview */}
              <div className="pt-1">
                <DiscordPreview config={getPreviewConfig()} />
              </div>

              <p className="text-[10px] text-zinc-500 italic text-center pt-1">
                Podgląd symuluje dokładny wygląd wiadomości w aplikacji Discord w formacie wybranym powyżej.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
