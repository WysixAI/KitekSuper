import { useState } from 'react';
import {
  Lightbulb,
  ArrowLeft,
  ThumbsUp,
  Search,
  CheckCircle2,
  Sparkles,
  Plus,
  Compass,
  Terminal,
  Filter,
  BadgeAlert,
  Flame,
} from 'lucide-react';
import { BotIdea } from '../types';
import { BOT_IDEAS_LIST } from '../data/botData';
import { CustomSelect } from './CustomSelect';

interface IdeasViewProps {
  onBackToDashboard: () => void;
  onNavigateToServers?: () => void;
}

export const IdeasView = ({ onBackToDashboard }: IdeasViewProps) => {
  const [ideas, setIdeas] = useState<BotIdea[]>(BOT_IDEAS_LIST);
  const [selectedCategory, setSelectedCategory] = useState<string>('Wszystkie');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<string | null>(null);

  // Modal na własny pomysł
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<BotIdea['category']>('Społeczność');
  const [newDescription, setNewDescription] = useState('');
  const [newCommands, setNewCommands] = useState('');

  const categories = [
    'Wszystkie',
    'Społeczność',
    'Gry & Eventy',
    'Narzędzia',
    'Bezpieczeństwo',
    'AI & Integracje',
  ];

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleVote = (id: string) => {
    if (votedIds[id]) {
      // Usunięcie głosu
      setIdeas(
        ideas.map((item) => (item.id === id ? { ...item, votes: item.votes - 1 } : item))
      );
      setVotedIds({ ...votedIds, [id]: false });
      showToast('Cofnięto głos na pomysł.');
    } else {
      // Dodanie głosu
      setIdeas(
        ideas.map((item) => (item.id === id ? { ...item, votes: item.votes + 1 } : item))
      );
      setVotedIds({ ...votedIds, [id]: true });
      showToast('Oddano głos na pomysł! Dziękujemy za feedback.');
    }
  };

  const handleAddCustomIdea = () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      showToast('Wpisz tytuł i opis proponowanego pomysłu!');
      return;
    }

    const created: BotIdea = {
      id: `custom-idea-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim(),
      impact: 'Wysoki',
      difficulty: 'Średni',
      suggestedCommands: newCommands
        ? newCommands.split(',').map((c) => c.trim())
        : ['/pomysl info'],
      votes: 1,
      tags: ['Społeczność', 'Propozycja'],
      status: 'Propozycja',
    };

    setIdeas([created, ...ideas]);
    setVotedIds({ ...votedIds, [created.id]: true });
    setShowAddModal(false);
    setNewTitle('');
    setNewDescription('');
    setNewCommands('');
    showToast(`Dodano Twój pomysł: "${created.title}"!`);
  };

  const filteredIdeas = ideas.filter((idea) => {
    const matchesCategory =
      selectedCategory === 'Wszystkie' || idea.category === selectedCategory;
    const matchesSearch =
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 bg-[#1a1d21] text-white px-5 sm:px-7 py-6 h-full overflow-y-auto min-h-0 w-full">
      {/* Toast Notyfikacja */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs shadow-2xl animate-in slide-in-from-top-3 duration-150">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto space-y-6 pb-16">
        {/* Górny Pasek Tytułowy */}
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
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Pomysły & Roadmap Bota (Ideas)
                </h1>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-mono font-semibold">
                  {ideas.length} Propozycji
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Obszerna baza pomysłów na nowe moduły i funkcje serwerowe. Głosuj lub zgłoś własną propozycję!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Zaproponuj pomysł</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* FILTRY KATEGORII & WYSZUKIWARKA                                           */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#20242a] p-3.5 rounded-2xl border border-[#2d323b]">
          {/* Zakładki kategorii */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-[#181a1e]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Wyszukiwarka */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj pomysłu lub tagu..."
              className="w-full bg-[#16181b] border border-[#2d323b] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SIATKA KART Z POMYSŁAMI                                                   */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea) => {
            const hasVoted = votedIds[idea.id];
            return (
              <div
                key={idea.id}
                className="rounded-2xl bg-[#20242a] border border-[#2b3038] hover:border-amber-500/40 p-5 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3">
                  {/* Nagłówek karty z kategorią i statusem */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#16181b] border border-[#2b313a] text-zinc-300 text-[10px] font-mono font-semibold">
                      {idea.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        idea.status === 'Gotowy do wdrożenia'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : idea.status === 'Dostępny wkrótce'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {idea.status}
                    </span>
                  </div>

                  {/* Tytuł i opis */}
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      {idea.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      {idea.description}
                    </p>
                  </div>

                  {/* Tagi */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {idea.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#16181b] text-zinc-400 border border-[#262a32] font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Proponowane komendy */}
                  <div className="p-2.5 rounded-xl bg-[#16181b] border border-[#242830] space-y-1">
                    <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-emerald-400" />
                      <span>Proponowane komendy:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {idea.suggestedCommands.map((cmd) => (
                        <code
                          key={cmd}
                          className="px-1.5 py-0.5 rounded bg-[#20242a] text-emerald-400 text-[11px] font-mono"
                        >
                          {cmd}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stopka: Wpływ, Trudność oraz Przycisk Głosowania */}
                <div className="pt-3 border-t border-[#2a2f38] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                    <span>Wpływ:</span>
                    <span
                      className={`font-bold ${
                        idea.impact === 'Bardzo wysoki'
                          ? 'text-rose-400'
                          : idea.impact === 'Wysoki'
                          ? 'text-amber-400'
                          : 'text-zinc-300'
                      }`}
                    >
                      {idea.impact}
                    </span>
                  </div>

                  {/* Przycisk Głosuj */}
                  <button
                    type="button"
                    onClick={() => handleVote(idea.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      hasVoted
                        ? 'bg-amber-400 text-black shadow-md'
                        : 'bg-[#16181b] hover:bg-[#252a32] text-zinc-300 border border-[#2d333f]'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-black' : ''}`} />
                    <span>{idea.votes}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: ZAPROPONUJ NOWY POMYSŁ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#20242a] border border-[#2f3540] w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#2d323b] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Zaproponuj Nowy Pomysł</h3>
                  <p className="text-[11px] text-zinc-400">Dodaj propozycję funkcji dla bota Kitek</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white p-1 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Tytuł pomysłu / modułu:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="np. Sklep serwerowy za punkty XP"
                  className="w-full bg-[#16181b] border border-[#2d323b] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Kategoria:
                </label>
                <CustomSelect
                  value={newCategory}
                  onChange={(val) => setNewCategory(val as BotIdea['category'])}
                  options={[
                    { value: 'Społeczność', label: 'Społeczność', prefix: '👥' },
                    { value: 'Gry & Eventy', label: 'Gry & Eventy', prefix: '🎮' },
                    { value: 'Narzędzia', label: 'Narzędzia', prefix: '⚙️' },
                    { value: 'Bezpieczeństwo', label: 'Bezpieczeństwo', prefix: '🛡️' },
                    { value: 'AI & Integracje', label: 'AI & Integracje', prefix: '🤖' },
                  ]}
                  size="md"
                  triggerClassName="border-[#2d323b] focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Opis działania pomysłu:
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="Opisz jak funkcja powinna działać dla użytkowników serwera..."
                  className="w-full bg-[#16181b] border border-[#2d323b] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Przykładowe komendy (rozdzielone przecinkami):
                </label>
                <input
                  type="text"
                  value={newCommands}
                  onChange={(e) => setNewCommands(e.target.value)}
                  placeholder="/sklep, /kup rola, /monety"
                  className="w-full bg-[#16181b] border border-[#2d323b] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2d323b]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-[#16181b] hover:bg-[#252a32] text-zinc-300 text-xs font-semibold"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleAddCustomIdea}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Dodaj do Pomysłów</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
