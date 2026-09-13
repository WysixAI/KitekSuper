import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Send,
  Hash,
  Layers,
  FileText,
  RotateCcw,
  CheckCircle2,
  Bookmark,
  Bell,
  Eye,
} from 'lucide-react';
import { CustomSelect, SelectOption } from './CustomSelect';
import { MessageStyleEditor } from './MessageStyleEditor';
import { DiscordPreview } from './DiscordPreview';
import { MessageContainer, EmbedConfig } from '../types/embed';
import { DiscordServer } from '../types';

interface EmbedCreatorViewProps {
  onBackToDashboard: () => void;
  server?: DiscordServer;
}

export const EmbedCreatorView: React.FC<EmbedCreatorViewProps> = ({ onBackToDashboard, server }) => {
  const serverChannels = server?.channels ?? [];
  const serverRoles = server?.roles ?? [];

  const sendChannels: SelectOption[] = serverChannels.map((ch) => ({
    value: ch.id || ch.name,
    label: ch.name,
    prefix: '#',
  }));

  const mentionOptions: SelectOption[] = [
    { value: 'none', label: 'Brak wzmianki' },
    { value: '@everyone', label: '@everyone (Wszyscy na serwerze)' },
    { value: '@here', label: '@here (Aktywni na serwerze)' },
    ...serverRoles.map((r) => ({
      value: r.id ? `<@&${r.id}>` : (r.name.startsWith('@') ? r.name : `@${r.name}`),
      label: `${r.name} (Rola)`,
      prefix: '@',
    })),
  ];

  const [selectedChannel, setSelectedChannel] = useState<string>(
    serverChannels[0]?.id || serverChannels[0]?.name || ''
  );
  const [selectedMention, setSelectedMention] = useState<string>('none');
  const [plainTextMessage, setPlainTextMessage] = useState<string>('📢 Witajcie kotki! Mamy dla Was ważne ogłoszenie.');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [formatMode, setFormatMode] = useState<'v2' | 'legacy'>('v2');

  useEffect(() => {
    if (serverChannels.length > 0) {
      if (!serverChannels.some((c) => c.id === selectedChannel || c.name === selectedChannel)) {
        setSelectedChannel(serverChannels[0].id || serverChannels[0].name);
      }
    } else {
      setSelectedChannel('');
    }
  }, [server?.id, serverChannels.length]);
  const [notification, setNotification] = useState<string | null>(null);

  // Kontenery Embed v2
  const [containers, setContainers] = useState<MessageContainer[]>([
    {
      id: 'creator_c1',
      color: '#10b981',
      spoiler: false,
      collapsed: false,
      components: [
        {
          id: 'c1_sec',
          type: 'section',
          accessory: {
            type: 'Thumbnail',
            fileUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=120&auto=format&fit=crop&q=80',
            description: 'Kitek Ogłoszenie',
            spoiler: false,
          },
          sectionContent: '# 🌟 Ważna aktualizacja serwera!\nPrzygotowaliśmy dla Was zupełnie nowe funkcje, w tym odświeżony system ról i powiadomień.\nKliknij przyciski poniżej, aby odebrać nagrody.',
        },
        {
          id: 'c1_sep',
          type: 'separator',
          spacing: 'Small',
          divider: true,
        },
        {
          id: 'c1_btns',
          type: 'button_row',
          buttons: [
            { id: 'b_claim', label: 'Odbierz Bonus', style: 'success', emoji: '🎁' },
            { id: 'b_rules', label: 'Zobacz Regulamin', style: 'secondary', emoji: '📜' },
            { id: 'b_link', label: 'Strona WWW', style: 'link', emoji: '🌐', url: 'https://kitek.pl' },
          ],
        },
      ],
    },
  ]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSendMessage = async () => {
    if (!containers || containers.length === 0) {
      showToast('Wiadomość musi zawierać przynajmniej jeden kontener!');
      return;
    }

    if (!selectedChannel) {
      showToast('Wybierz kanał docelowy do wysłania wiadomości!');
      return;
    }

    const targetChannelObj = serverChannels.find(
      (c) => c.id === selectedChannel || c.name === selectedChannel
    );
    const channelId = targetChannelObj?.id || selectedChannel;
    const channelName = targetChannelObj?.name || selectedChannel;

    setIsSending(true);
    try {
      const fullText = (selectedMention !== 'none' ? `${selectedMention} ` : '') + plainTextMessage;
      const res = await fetch('/api/bot/send-embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: server?.id,
          channelId,
          channelName,
          plainText: fullText.trim(),
          containers,
          formatMode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `✅ Pomyślnie wysłano embed na kanał #${channelName}!`);
      } else {
        showToast(data.error || 'Nie udało się wysłać wiadomości Embed.');
      }
    } catch (err: any) {
      showToast(`Błąd wysyłania: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Ładowanie gotowych szablonów
  const loadTemplate = (type: 'announcement' | 'rules' | 'roles' | 'clear') => {
    if (type === 'clear') {
      setContainers([]);
      setPlainTextMessage('');
      showToast('Wyczyszczono edytor!');
      return;
    }

    if (type === 'announcement') {
      setPlainTextMessage('📢 @everyone Nowe oficjalne ogłoszenie serwera!');
      setContainers([
        {
          id: 'tpl_c1',
          color: '#10b981',
          spoiler: false,
          collapsed: false,
          components: [
            {
              id: 'tpl_sec_1',
              type: 'section',
              accessory: {
                type: 'Thumbnail',
                fileUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=120&auto=format&fit=crop&q=80',
                description: 'Logo Kitek',
                spoiler: false,
              },
              sectionContent: '# 🎉 Wielki Konkurs Społeczności!\nZapraszamy wszystkich do wzięcia udziału w naszym cotygodniowym konkursie z nagrodami.\nDo wygrania role VIP oraz kody Nitro!',
            },
            {
              id: 'tpl_sep_1',
              type: 'separator',
              spacing: 'Small',
              divider: true,
            },
            {
              id: 'tpl_btn_1',
              type: 'button_row',
              buttons: [
                { id: 't_b1', label: 'Dołącz do konkursu', style: 'success', emoji: '🏆' },
                { id: 't_b2', label: 'Szczegóły', style: 'secondary', emoji: 'ℹ️' },
              ],
            },
          ],
        },
      ]);
      showToast('Załadowano szablon Ogłoszenia!');
    } else if (type === 'rules') {
      setPlainTextMessage('📜 Zapoznaj się z zasadami panującymi na naszym serwerze:');
      setContainers([
        {
          id: 'tpl_rules_c',
          color: '#3b82f6',
          spoiler: false,
          collapsed: false,
          components: [
            {
              id: 'tpl_r_sec',
              type: 'section',
              accessory: {
                type: 'Thumbnail',
                fileUrl: 'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=120&auto=format&fit=crop&q=80',
                description: 'Regulamin',
                spoiler: false,
              },
              sectionContent: '## 📜 Regulamin Serwera Kitek\n**1.** Szanuj innych użytkowników oraz administrację.\n**2.** Zakaz spamu, floodu i niechcianej reklamy.\n**3.** Treści NSFW są surowo zabronione.\n**4.** Stosuj się do poleceń moderatorów.',
            },
            {
              id: 'tpl_r_sep',
              type: 'separator',
              spacing: 'Small',
              divider: true,
            },
            {
              id: 'tpl_r_btn',
              type: 'button_row',
              buttons: [
                { id: 'r_btn1', label: 'Akceptuję Regulamin', style: 'success', emoji: '✅' },
                { id: 'r_btn2', label: 'Zgłoś problem', style: 'danger', emoji: '🚨' },
              ],
            },
          ],
        },
      ]);
      showToast('Załadowano szablon Regulaminu!');
    } else if (type === 'roles') {
      setPlainTextMessage('🎭 Wybierz swoje role i preferencje powiadomień:');
      setContainers([
        {
          id: 'tpl_roles_c',
          color: '#8b5cf6',
          spoiler: false,
          collapsed: false,
          components: [
            {
              id: 'tpl_role_sec',
              type: 'section',
              sectionContent: '### 🎭 Panel Samodzielnego Wyboru Ról\nWybierz z menu poniżej interesujące Cię strefy serwerowe, aby odblokować dedykowane kanały i powiadomienia.',
            },
            {
              id: 'tpl_role_sel',
              type: 'select_menu',
              placeholder: 'Kliknij, aby wybrać swoje role...',
              disabled: false,
              options: [
                { id: 'ro_1', label: 'Powiadomienia o Streamach', description: 'Gdy Kitek odpala live', emoji: '🔴', value: 'streams' },
                { id: 'ro_2', label: 'Strefa Gracza Minecraft', description: 'Dostęp do serwera MC', emoji: '⛏️', value: 'minecraft' },
                { id: 'ro_3', label: 'Turnieje & Eventy', description: 'Powiadomienia o nagrodach', emoji: '🏆', value: 'events' },
              ],
            },
          ],
        },
      ]);
      showToast('Załadowano szablon Wyboru Ról!');
    }
  };

  // Konfiguracja dla DiscordPreview na żywo
  const previewConfig: EmbedConfig = {
    mode: 'embed_v2',
    plainText: (selectedMention !== 'none' ? `${selectedMention} ` : '') + plainTextMessage,
    title: '',
    description: '',
    color: containers[0]?.color || '#10b981',
    authorName: '',
    authorIcon: '',
    thumbnailUrl: '',
    imageUrl: '',
    footerText: '',
    fields: [],
    containers: containers,
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
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Embed Creator
                </h1>
                <p className="text-xs text-zinc-400">
                  Wizualny kreator wiadomości Discord Components v2 (message.style) z podglądem na żywo
                </p>
              </div>
            </div>
          </div>

          {/* Szybkie szablony */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 font-mono mr-1">Szablony:</span>
            <button
              type="button"
              onClick={() => loadTemplate('announcement')}
              className="px-2.5 py-1 rounded bg-[#20242a] hover:bg-[#272c33] text-zinc-300 border border-[#2d323b] text-xs transition-colors"
            >
              Ogłoszenie
            </button>
            <button
              type="button"
              onClick={() => loadTemplate('rules')}
              className="px-2.5 py-1 rounded bg-[#20242a] hover:bg-[#272c33] text-zinc-300 border border-[#2d323b] text-xs transition-colors"
            >
              Regulamin
            </button>
            <button
              type="button"
              onClick={() => loadTemplate('roles')}
              className="px-2.5 py-1 rounded bg-[#20242a] hover:bg-[#272c33] text-zinc-300 border border-[#2d323b] text-xs transition-colors"
            >
              Wybór Ról
            </button>
            <button
              type="button"
              onClick={() => loadTemplate('clear')}
              className="px-2.5 py-1 rounded bg-[#20242a] hover:bg-rose-500/20 text-rose-300 border border-[#2d323b] text-xs transition-colors"
              title="Wyczyść całą zawartość"
            >
              Wyczyść
            </button>
          </div>
        </div>

        {/* ================= GÓRNY PASEK: WYBÓR KANAŁU + PRZYCISK SEND ================= */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#20242a] border border-[#2d323b] shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            {/* Wybór kanału docelowego */}
            <div className="sm:col-span-5 space-y-1.5">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-emerald-400" />
                <span>Wybierz kanał docelowy</span>
              </label>
              <CustomSelect
                value={selectedChannel}
                onChange={setSelectedChannel}
                options={sendChannels}
                placeholder={sendChannels.length === 0 ? "Brak kanałów na serwerze" : "Wybierz kanał docelowy"}
                disabled={sendChannels.length === 0}
                icon={Hash}
                ariaLabel="Wybierz kanał docelowy"
              />
            </div>

            {/* Opcjonalna wzmianka */}
            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-emerald-400" />
                <span>Wzmianka roli (Mention)</span>
              </label>
              <CustomSelect
                value={selectedMention}
                onChange={setSelectedMention}
                options={mentionOptions}
                icon={Bell}
                ariaLabel="Wybierz wzmiankę"
              />
            </div>

            {/* Przycisk SEND (Wyślij wiadomość) */}
            <div className="sm:col-span-3">
              <button
                type="button"
                id="send-embed-btn"
                disabled={isSending}
                onClick={handleSendMessage}
                className="w-full h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
              >
                <Send className={`w-4 h-4 ${isSending ? 'animate-spin' : ''}`} />
                <span>{isSending ? 'Wysyłanie...' : 'Wyślij na Discord (Send)'}</span>
              </button>
            </div>
          </div>

          {/* Opcjonalna wiadomość tekstowa nad embedem */}
          <div className="space-y-1.5 pt-2 border-t border-[#2b2f37]">
            <div className="flex items-center justify-between text-xs">
              <label className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span>Tekst wiadomości nad kontenerami (opcjonalny plain text):</span>
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                {plainTextMessage.length} / 2000 znaków
              </span>
            </div>
            <input
              type="text"
              value={plainTextMessage}
              onChange={(e) => setPlainTextMessage(e.target.value)}
              placeholder="Np. Hej @everyone! Zapoznajcie się z ogłoszeniem poniżej..."
              className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Wybór formatu: Discord Components v2 vs Klasyczny Embed */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#2b2f37]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Standard wysyłania:</span>
              <div className="inline-flex rounded-lg bg-[#15171a] p-1 border border-[#2e333b]">
                <button
                  type="button"
                  onClick={() => setFormatMode('v2')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    formatMode === 'v2'
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>🚀 Discord Components v2 (Kontenery type 17)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormatMode('legacy')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    formatMode === 'legacy'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>📜 Embed klasyczny</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {formatMode === 'v2'
                  ? 'Format: Components V2 (flags: 32768) + Akcje ról'
                  : 'Format: Discord Embeds (type 1 Rows)'}
              </span>
            </div>
          </div>
        </div>

        {/* ================= UKŁAD 2-KOLUMNOWY: PO LEWEJ BUILDER, PO PRAWEJ PODGLĄD NA ŻYWO ================= */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEWA STRONA: BUILDER (EMBED V2 COMPONENTS / MESSAGE.STYLE) */}
          <div className="xl:col-span-7 space-y-4">
            <div className="p-4 rounded-xl bg-[#20242a] border border-[#2d323b] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Discord Components v2 Builder
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                Kontenery: {containers.length}
              </span>
            </div>

            {/* Kreator Kontenerów message.style */}
            <MessageStyleEditor
              containers={containers}
              onChangeContainers={setContainers}
              serverRoles={server?.roles || []}
            />
          </div>

          {/* PRAWA STRONA: PODGLĄD NA ŻYWO (LIVE PREVIEW) */}
          <div className="xl:col-span-5 space-y-3 xl:sticky xl:top-6">
            <div className="p-4 rounded-xl bg-[#20242a] border border-[#2d323b] shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#2c313a] pb-2.5">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Podgląd na żywo na kanale</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181a1e] text-emerald-400 border border-emerald-500/30">
                  {selectedChannel}
                </span>
              </div>

              {/* DiscordPreview na żywo */}
              <div className="pt-1">
                <DiscordPreview config={previewConfig} />
              </div>

              <div className="p-2.5 rounded-lg bg-[#16181b] border border-[#272b33] text-[11px] text-zinc-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Wszystkie zmiany w formularzu po lewej stronie są natychmiast odzwierciedlane w tym oknie.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
