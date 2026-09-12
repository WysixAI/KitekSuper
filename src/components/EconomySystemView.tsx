import { useState, useEffect } from 'react';
import {
  Coins,
  ArrowLeft,
  DollarSign,
  ShoppingBag,
  ShieldCheck,
  Briefcase,
  Calendar,
  AlertOctagon,
  Users,
  Plus,
  Trash2,
  Check,
  Zap,
  Sparkles,
  Clock,
  Landmark,
  Wallet,
  Percent,
  Sliders,
  Shield,
  Award,
  Hash,
} from 'lucide-react';
import { CustomSwitch } from './CustomSwitch';
import { DiscordServer } from '../types';
import { CustomSelect } from './CustomSelect';

interface EconomySystemViewProps {
  server?: DiscordServer;
  onBackToDashboard: () => void;
}

export type NumberFormatType = 'space' | 'comma' | 'dot' | 'none';

export interface DailyBonusRole {
  id: string;
  roleName: string;
  bonusAmount: number;
}

export type ShopItemType = 'role' | 'item';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: ShopItemType;
  roleName?: string;
  itemAction?: string;
  itemActionLabel?: string;
}

const AVAILABLE_ITEM_ACTIONS = [
  { id: 'shield_24h', label: 'Tarcza ochronna przed kradzieżą (24h)', icon: '🛡️', hint: '100% ochrony przed komendą /rob przez 24h' },
  { id: 'shield_48h', label: 'Tarcza ochronna przed kradzieżą (48h)', icon: '🛡️', hint: '100% ochrony przed komendą /rob przez 48h' },
  { id: 'work_2x_24h', label: 'Mnożnik x2 zarobków z /work (24h)', icon: '⚡', hint: 'Podwaja wynagrodzenie z każdej pracy przez 24h' },
  { id: 'work_2x_48h', label: 'Mnożnik x2 zarobków z /work (48h)', icon: '⚡', hint: 'Podwaja wynagrodzenie z każdej pracy przez 48h' },
  { id: 'crime_boost', label: '+25% szansy powodzenia w /crime (24h)', icon: '🎯', hint: 'Zwiększa prawdopodobieństwo sukcesu przestępstw' },
  { id: 'bank_expand', label: 'Zwiększenie pojemności banku (+10 000)', icon: '🏦', hint: 'Zwiększa maksymalny dopuszczalny depozyt w banku' },
  { id: 'custom', label: 'Przedmiot kolekcjonerski / brak stałego efektu', icon: '✨', hint: 'Przedmiot do handlu między graczami lub trofeum' },
];

export const formatMoneyValue = (amount: number, format: NumberFormatType): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  const parts = Math.round(amount).toString();
  switch (format) {
    case 'space':
      return parts.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    case 'comma':
      return parts.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    case 'dot':
      return parts.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    case 'none':
    default:
      return parts;
  }
};

export const EconomySystemView = ({ onBackToDashboard, server }: EconomySystemViewProps) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'modules' | 'shop'>('settings');
  const [notification, setNotification] = useState<string | null>(null);

  // Dynamiczne role pobierane z podłączonego serwera Discord (bez @everyone)
  const availableRoles: string[] = (server?.roles && server.roles.length > 0)
    ? server.roles
        .filter((r) => r.name !== '@everyone')
        .map((r) => (r.name.startsWith('@') ? r.name : `@${r.name}`))
    : [];

  const roleSelectOptions = availableRoles.length > 0
    ? availableRoles.map((r) => ({ value: r, label: r, prefix: '@' }))
    : [{ value: '', label: 'Brak ról na serwerze (dodaj role na Discordzie)' }];

  // =========================================================================
  // 1. GŁÓWNA KONFIGURACJA WALUTY & BANKU
  // =========================================================================
  const [currencyName, setCurrencyName] = useState('KitekCoiny');
  const [currencySymbol, setCurrencySymbol] = useState('🪙');
  const [startingBalance, setStartingBalance] = useState(500);

  // Formatowanie kwot: 1000 / 1,000 / 1 000 / 1.000
  const [numberFormat, setNumberFormat] = useState<NumberFormatType>('space');

  // Limity konta i banku - DOMYŚLNIE WYŁĄCZONE NA START
  const [walletLimitEnabled, setWalletLimitEnabled] = useState(false);
  const [maxWalletAmount, setMaxWalletAmount] = useState(50000);

  const [bankLimitEnabled, setBankLimitEnabled] = useState(false);
  const [maxBankAmount, setMaxBankAmount] = useState(100000);

  // Oprocentowanie kasy w banku
  const [bankInterestRate, setBankInterestRate] = useState(2.5); // % dziennie

  // =========================================================================
  // 2. MODUŁY ZAROBKOWE - DOMYŚLNIE WYŁĄCZONE NA START
  // =========================================================================
  // /daily
  const [dailyEnabled, setDailyEnabled] = useState(false);
  const [dailyAmount, setDailyAmount] = useState(250);
  const [dailyStreakBonus, setDailyStreakBonus] = useState(30);

  // Rangi z bonusem do /daily - Czysty start, role dodaje użytkownik z serwera
  const [dailyBonusRoles, setDailyBonusRoles] = useState<DailyBonusRole[]>([]);
  const [newBonusRoleName, setNewBonusRoleName] = useState<string>(availableRoles[0] || '');
  const [newBonusAmount, setNewBonusAmount] = useState(150);

  // /work
  const [workEnabled, setWorkEnabled] = useState(false);
  const [workMin, setWorkMin] = useState(80);
  const [workMax, setWorkMax] = useState(250);
  const [workCooldown, setWorkCooldown] = useState(30); // minuty

  // /crime
  const [crimeEnabled, setCrimeEnabled] = useState(false);
  const [crimeSuccessRate, setCrimeSuccessRate] = useState(45); // %
  const [crimeCooldown, setCrimeCooldown] = useState(45); // minuty
  const [crimeMinReward, setCrimeMinReward] = useState(300);
  const [crimeMaxReward, setCrimeMaxReward] = useState(900);
  const [crimeFailFine, setCrimeFailFine] = useState(250);

  // /rob
  const [robEnabled, setRobEnabled] = useState(false);
  const [robSuccessRate, setRobSuccessRate] = useState(35); // %
  const [robCooldown, setRobCooldown] = useState(60); // minuty
  const [robMinPercent, setRobMinPercent] = useState(5); // %
  const [robMaxPercent, setRobMaxPercent] = useState(35); // %
  const [robProtectionHours, setRobProtectionHours] = useState(48); // ochrona nowych kont

  // =========================================================================
  // 3. SKLEP SERWEROWY (/shop)
  // =========================================================================
  const [shopItems, setShopItems] = useState<ShopItem[]>([
    {
      id: '1',
      name: 'Tarcza Ochronna (24h)',
      description: 'Chroni Twój portfel przed kradzieżami (/rob) przez pełne 24 godziny.',
      price: 1200,
      type: 'item',
      itemAction: 'shield_24h',
      itemActionLabel: 'Tarcza ochronna przed kradzieżą (24h)',
    },
  ]);

  // Formularz dodawania do sklepu
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(1000);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemType, setNewItemType] = useState<ShopItemType>('role');

  // Pola dla typu: 'role'
  const [selectedRoleForShop, setSelectedRoleForShop] = useState<string>(availableRoles[0] || '');
  const [customRoleInput, setCustomRoleInput] = useState('');

  // Pola dla typu: 'item'
  const [selectedItemAction, setSelectedItemAction] = useState('shield_24h');

  // Aktualizuj domyślnie wybrane role gdy lista ról serwera się załaduje
  useEffect(() => {
    if (availableRoles.length > 0) {
      if (!newBonusRoleName || !availableRoles.includes(newBonusRoleName)) {
        setNewBonusRoleName(availableRoles[0]);
      }
      if (!selectedRoleForShop || !availableRoles.includes(selectedRoleForShop)) {
        setSelectedRoleForShop(availableRoles[0]);
      }
    }
  }, [server?.id, availableRoles.join(',')]);

  // Wczytaj zapisaną konfigurację ekonomii serwera
  useEffect(() => {
    if (!server?.id) return;
    fetch(`/api/bot/servers/${server.id}/config`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.config) {
          const ec = data.config.economy;
          if (ec) {
            if (ec.currencyName) setCurrencyName(ec.currencyName);
            if (ec.currencySymbol) setCurrencySymbol(ec.currencySymbol);
            if (ec.startingBalance !== undefined) setStartingBalance(ec.startingBalance);
            if (ec.numberFormat) setNumberFormat(ec.numberFormat);
            if (ec.walletLimitEnabled !== undefined) setWalletLimitEnabled(ec.walletLimitEnabled);
            if (ec.maxWalletAmount !== undefined) setMaxWalletAmount(ec.maxWalletAmount);
            if (ec.bankLimitEnabled !== undefined) setBankLimitEnabled(ec.bankLimitEnabled);
            if (ec.maxBankAmount !== undefined) setMaxBankAmount(ec.maxBankAmount);
            if (ec.bankInterestRate !== undefined) setBankInterestRate(ec.bankInterestRate);
            if (ec.daily) {
              if (ec.daily.enabled !== undefined) setDailyEnabled(ec.daily.enabled);
              if (ec.daily.amount !== undefined) setDailyAmount(ec.daily.amount);
              if (ec.daily.streakBonus !== undefined) setDailyStreakBonus(ec.daily.streakBonus);
              if (Array.isArray(ec.daily.bonusRoles)) setDailyBonusRoles(ec.daily.bonusRoles);
            }
            if (ec.work) {
              if (ec.work.enabled !== undefined) setWorkEnabled(ec.work.enabled);
              if (ec.work.min !== undefined) setWorkMin(ec.work.min);
              if (ec.work.max !== undefined) setWorkMax(ec.work.max);
              if (ec.work.cooldown !== undefined) setWorkCooldown(ec.work.cooldown);
            }
            if (ec.crime) {
              if (ec.crime.enabled !== undefined) setCrimeEnabled(ec.crime.enabled);
              if (ec.crime.successRate !== undefined) setCrimeSuccessRate(ec.crime.successRate);
              if (ec.crime.cooldown !== undefined) setCrimeCooldown(ec.crime.cooldown);
              if (ec.crime.minReward !== undefined) setCrimeMinReward(ec.crime.minReward);
              if (ec.crime.maxReward !== undefined) setCrimeMaxReward(ec.crime.maxReward);
              if (ec.crime.failFine !== undefined) setCrimeFailFine(ec.crime.failFine);
            }
            if (ec.rob) {
              if (ec.rob.enabled !== undefined) setRobEnabled(ec.rob.enabled);
              if (ec.rob.successRate !== undefined) setRobSuccessRate(ec.rob.successRate);
              if (ec.rob.cooldown !== undefined) setRobCooldown(ec.rob.cooldown);
            }
            if (Array.isArray(ec.shopItems)) {
              setShopItems(ec.shopItems);
            }
          }
        }
      })
      .catch(() => {});
  }, [server?.id]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveEconomy = async () => {
    if (!server?.id) {
      showToast('Wybierz serwer Discord, aby zapisać ustawienia.');
      return;
    }

    try {
      const isAnyActive = dailyEnabled || workEnabled || crimeEnabled || robEnabled;
      const payload = {
        modules: {
          economy: isAnyActive,
        },
        economy: {
          enabled: isAnyActive,
          currencyName,
          currencySymbol,
          startingBalance,
          numberFormat,
          walletLimitEnabled,
          maxWalletAmount,
          bankLimitEnabled,
          maxBankAmount,
          bankInterestRate,
          daily: {
            enabled: dailyEnabled,
            amount: dailyAmount,
            streakBonus: dailyStreakBonus,
            bonusRoles: dailyBonusRoles,
          },
          work: {
            enabled: workEnabled,
            min: workMin,
            max: workMax,
            cooldown: workCooldown,
          },
          crime: {
            enabled: crimeEnabled,
            successRate: crimeSuccessRate,
            cooldown: crimeCooldown,
            minReward: crimeMinReward,
            maxReward: crimeMaxReward,
            failFine: crimeFailFine,
          },
          rob: {
            enabled: robEnabled,
            successRate: robSuccessRate,
            cooldown: robCooldown,
            minPercent: robMinPercent,
            maxPercent: robMaxPercent,
            protectionHours: robProtectionHours,
          },
          shopItems,
        },
      };

      const res = await fetch(`/api/bot/servers/${server.id}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('✅ Pomyślnie zapisano konfigurację ekonomii!');
      } else {
        showToast('Błąd podczas zapisywania konfiguracji.');
      }
    } catch (e: any) {
      showToast(`Błąd zapisu: ${e.message}`);
    }
  };

  const formatAmount = (val: number) => formatMoneyValue(val, numberFormat);

  // Dodawanie bonusowej roli do /daily
  const handleAddDailyBonusRole = () => {
    const roleToAdd = newBonusRoleName;
    if (!roleToAdd) {
      showToast('Wybierz nazwę roli z listy!');
      return;
    }
    // Sprawdź czy rola już nie jest dodana
    if (dailyBonusRoles.some((r) => r.roleName === roleToAdd)) {
      showToast(`Rola ${roleToAdd} ma już skonfigurowany bonus!`);
      return;
    }
    if (newBonusAmount <= 0) {
      showToast('Wpisz dodatnią kwotę bonusu!');
      return;
    }

    const newRole: DailyBonusRole = {
      id: Date.now().toString(),
      roleName: roleToAdd,
      bonusAmount: newBonusAmount,
    };

    setDailyBonusRoles([...dailyBonusRoles, newRole]);
    showToast(`Dodano bonus ${formatAmount(newBonusAmount)} ${currencySymbol} dla rangi ${newRole.roleName}!`);
  };

  const handleRemoveDailyBonusRole = (id: string) => {
    setDailyBonusRoles(dailyBonusRoles.filter((r) => r.id !== id));
    showToast('Usunięto rolę z bonusu daily');
  };

  // Dodawanie przedmiotu do sklepu
  const handleAddItemToShop = () => {
    if (!newItemName.trim()) {
      showToast('Wpisz nazwę pozycji w sklepie!');
      return;
    }

    if (newItemType === 'role') {
      const assignedRole = customRoleInput.trim() || selectedRoleForShop;
      const finalRole = assignedRole.startsWith('@') ? assignedRole : `@${assignedRole}`;
      const item: ShopItem = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        description: newItemDesc.trim() || `Automatyczne nadanie rangi ${finalRole} po zakupie.`,
        price: newItemPrice,
        type: 'role',
        roleName: finalRole,
      };
      setShopItems([...shopItems, item]);
      showToast(`Dodano rolę "${item.name}" do sklepu!`);
    } else {
      const actionObj = AVAILABLE_ITEM_ACTIONS.find((a) => a.id === selectedItemAction);
      const item: ShopItem = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        description: newItemDesc.trim() || (actionObj ? actionObj.hint : 'Przedmiot o natychmiastowym działaniu.'),
        price: newItemPrice,
        type: 'item',
        itemAction: selectedItemAction,
        itemActionLabel: actionObj?.label || 'Przedmiot',
      };
      setShopItems([...shopItems, item]);
      showToast(`Dodano przedmiot "${item.name}" do sklepu!`);
    }

    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice(1000);
    setCustomRoleInput('');
  };

  const handleRemoveShopItem = (id: string) => {
    setShopItems(shopItems.filter((i) => i.id !== id));
    showToast('Usunięto pozycję ze sklepu');
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
                  <Coins className="w-4 h-4" />
                </div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  System Ekonomii Serwerowej
                </h1>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Konfiguracja waluty, limity portfela i banku, moduły zarobkowe z bonusami rang oraz sklep serwerowy.
              </p>
            </div>
          </div>

          {/* 3 Zakładki */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#16181b] border border-[#272b32]">
            <button
              id="tab-econ-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'settings'
                  ? 'bg-[#252a30] text-emerald-400 border border-[#363c46]'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1d2024]'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Waluta & Bank</span>
            </button>

            <button
              id="tab-econ-modules"
              onClick={() => setActiveTab('modules')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'modules'
                  ? 'bg-[#252a30] text-emerald-400 border border-[#363c46]'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1d2024]'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              <span>Moduły Zarobkowe</span>
            </button>

            <button
              id="tab-econ-shop"
              onClick={() => setActiveTab('shop')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'shop'
                  ? 'bg-[#252a30] text-emerald-400 border border-[#363c46]'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1d2024]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sklep Serwerowy</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ZAKŁADKA 1: WALUTA & BANK                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Karta: Konfiguracja Waluty & Formatowanie */}
            <div className="p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4">
              <div className="flex items-center gap-2 border-b border-[#2c313a] pb-3">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold text-white">
                  Parametry Waluty & Formatowanie
                </h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Nazwa waluty serwerowej:
                  </label>
                  <input
                    type="text"
                    value={currencyName}
                    onChange={(e) => setCurrencyName(e.target.value)}
                    className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Symbol / Emotka waluty:
                    </label>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono text-center text-base"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Saldo startowe gracza:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={startingBalance}
                      onChange={(e) => setStartingBalance(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Limit gotówki w portfelu (Max na koncie) */}
                <div className="p-3.5 rounded-xl bg-[#16181b] border border-[#2e333b] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        Maksymalny stan portfela (limit na koncie):
                      </span>
                    </div>
                    <CustomSwitch
                      checked={walletLimitEnabled}
                      onChange={setWalletLimitEnabled}
                      id="switch-wallet-limit"
                    />
                  </div>

                  {walletLimitEnabled ? (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="100"
                          step="1000"
                          value={maxWalletAmount}
                          onChange={(e) => setMaxWalletAmount(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#1c1f24] border border-[#323842] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                        />
                        <span className="absolute right-3 top-2 text-xs font-mono text-zinc-400">
                          {currencySymbol}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        Nadmiar gotówki nie mieści się w portfelu.
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic">
                      Brak limitu — gracze mogą trzymać nieograniczoną ilość gotówki w podręcznym portfelu.
                    </p>
                  )}
                </div>

                {/* Wybór formatowania liczb */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Formatowanie zapisu kwot:</span>
                    </label>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                      Separatory tysięcy
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setNumberFormat('space')}
                      className={`p-2.5 rounded-lg border text-center text-xs font-mono font-semibold transition-all ${
                        numberFormat === 'space'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-[#16181b] border-[#2e333b] text-zinc-400 hover:text-white hover:border-[#3d4450]'
                      }`}
                    >
                      <div className="text-white font-bold">1 000</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Spacja</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNumberFormat('comma')}
                      className={`p-2.5 rounded-lg border text-center text-xs font-mono font-semibold transition-all ${
                        numberFormat === 'comma'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-[#16181b] border-[#2e333b] text-zinc-400 hover:text-white hover:border-[#3d4450]'
                      }`}
                    >
                      <div className="text-white font-bold">1,000</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Przecinek</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNumberFormat('dot')}
                      className={`p-2.5 rounded-lg border text-center text-xs font-mono font-semibold transition-all ${
                        numberFormat === 'dot'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-[#16181b] border-[#2e333b] text-zinc-400 hover:text-white hover:border-[#3d4450]'
                      }`}
                    >
                      <div className="text-white font-bold">1.000</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Kropka</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNumberFormat('none')}
                      className={`p-2.5 rounded-lg border text-center text-xs font-mono font-semibold transition-all ${
                        numberFormat === 'none'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-[#16181b] border-[#2e333b] text-zinc-400 hover:text-white hover:border-[#3d4450]'
                      }`}
                    >
                      <div className="text-white font-bold">1000</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Bez spacji</div>
                    </button>
                  </div>

                  {/* Podgląd formatowania w czasie rzeczywistym */}
                  <div className="p-3 rounded-lg bg-[#16181b] border border-[#282d35] flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">Podgląd formatu kwoty:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {formatAmount(1250000)} {currencySymbol}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Karta: System Bankowy & Oprocentowanie */}
            <div className="p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4">
              <div className="flex items-center gap-2 border-b border-[#2c313a] pb-3">
                <Landmark className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold text-white">
                  Bank & Oprocentowanie Pasywne (/dep, /with)
                </h2>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  Środki na koncie bankowym są całkowicie zabezpieczone przed kradzieżą komendą <code className="font-mono bg-black/30 px-1 rounded">/rob</code> oraz generują automatyczny, pasywny dochód z oprocentowania!
                </p>
              </div>

              <div className="space-y-4">
                {/* Max na banku */}
                <div className="p-3.5 rounded-xl bg-[#16181b] border border-[#2e333b] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        Maksymalna pojemność depozytu w banku:
                      </span>
                    </div>
                    <CustomSwitch
                      checked={bankLimitEnabled}
                      onChange={setBankLimitEnabled}
                      id="switch-bank-limit"
                    />
                  </div>

                  {bankLimitEnabled ? (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="1000"
                          step="5000"
                          value={maxBankAmount}
                          onChange={(e) => setMaxBankAmount(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#1c1f24] border border-[#323842] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                        />
                        <span className="absolute right-3 top-2 text-xs font-mono text-zinc-400">
                          {currencySymbol}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        Pojemność bazowa banku gracza.
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic">
                      Brak limitu — gracze mogą wpłacić dowolną kwotę do banku.
                    </p>
                  )}
                </div>

                {/* Ile dostajesz oprocentowania z kasy z banku */}
                <div className="p-3.5 rounded-xl bg-[#16181b] border border-[#2e333b] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Dzienne oprocentowanie z kasy w banku:</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {bankInterestRate}% / 24h
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.1"
                      value={bankInterestRate}
                      onChange={(e) => setBankInterestRate(parseFloat(e.target.value) || 0)}
                      className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-[#252a31] rounded-lg"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.1"
                        value={bankInterestRate}
                        onChange={(e) => setBankInterestRate(parseFloat(e.target.value) || 0)}
                        className="w-20 bg-[#1c1f24] border border-[#323842] rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono outline-none focus:border-emerald-500"
                      />
                      <span className="text-xs text-zinc-400 font-mono">%</span>
                    </div>
                  </div>

                  {/* Symulacja zysku z oprocentowania */}
                  <div className="p-3 rounded-lg bg-[#141619] border border-[#272c33] text-xs font-mono space-y-1">
                    <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                      <span>Kalkulacja zysku dla {formatAmount(10000)} {currencySymbol} w banku:</span>
                      <span className="text-emerald-400 font-bold">
                        +{formatAmount(Math.round(10000 * (bankInterestRate / 100)))} {currencySymbol} / dzień
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Odsetki są dopisywane do salda bankowego automatycznie o północy.
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveEconomy}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Zapisz konfigurację waluty & banku</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ZAKŁADKA 2: MODUŁY ZAROBKOWE                                              */}
        {/* ========================================================================= */}
        {activeTab === 'modules' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Moduł: /daily z rangami bonusowymi */}
              <div className="p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between border-b border-[#2c313a] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">/daily (Nagroda Dzienna & Bonusy Rang)</h3>
                      <p className="text-[11px] text-zinc-400">
                        Odbiór monet raz na 24h z bonusem za passę dni oraz kumulującymi się bonusami z posiadanych ról
                      </p>
                    </div>
                  </div>
                  <CustomSwitch
                    checked={dailyEnabled}
                    onChange={setDailyEnabled}
                    id="switch-daily-enabled"
                  />
                </div>

                {/* Parametry bazowe /daily */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-semibold">Podstawowa kwota bazowa:</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={dailyAmount}
                        onChange={(e) => setDailyAmount(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#16181b] border border-[#2f353e] rounded-lg px-3 py-2 text-white font-mono text-xs outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-2 text-xs font-mono text-zinc-400">
                        {currencySymbol}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-semibold">Bonus za każdy kolejny dzień passy (Streak):</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={dailyStreakBonus}
                        onChange={(e) => setDailyStreakBonus(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#16181b] border border-[#2f353e] rounded-lg px-3 py-2 text-white font-mono text-xs outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-2 text-xs font-mono text-zinc-400">
                        +{currencySymbol}/dzień
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rangi z bonusem do /daily */}
                <div className="p-4 rounded-xl bg-[#16181b] border border-[#2a2f37] space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262a32] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">
                        Dodatkowe bonusy do /daily dla wybranych rang (Sumują się!)
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Jeśli gracz ma kilka rang, wszystkie ich bonusy dodają się do wypłaty
                    </span>
                  </div>

                  {/* Formularz dodawania rangi do daily */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                    <div className="sm:col-span-5 space-y-1">
                      <label className="text-[11px] text-zinc-400">Wybierz rangę z Twojego serwera:</label>
                      <CustomSelect
                        value={newBonusRoleName}
                        onChange={(val) => setNewBonusRoleName(val)}
                        options={roleSelectOptions}
                        size="sm"
                        triggerClassName="bg-[#20242a] border-[#303640]"
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[11px] text-zinc-400">Dodatkowy bonus kwotowy:</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={newBonusAmount}
                          onChange={(e) => setNewBonusAmount(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#20242a] border border-[#303640] rounded-lg px-2.5 py-1.5 text-white font-mono outline-none focus:border-emerald-500 text-xs"
                        />
                        <span className="absolute right-2.5 top-1.5 text-xs font-mono text-emerald-400">
                          +{currencySymbol}
                        </span>
                      </div>
                    </div>

                    <div className="sm:col-span-3 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddDailyBonusRole}
                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Dodaj rangę</span>
                      </button>
                    </div>
                  </div>

                  {/* Lista aktywnych ról z bonusem */}
                  <div className="space-y-2 pt-1">
                    {dailyBonusRoles.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic text-center py-2">
                        Brak skonfigurowanych ról z bonusem do daily.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {dailyBonusRoles.map((role) => (
                          <div
                            key={role.id}
                            className="p-2.5 rounded-lg bg-[#20242a] border border-[#2c323b] flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 truncate">
                                {role.roleName}
                              </span>
                              <span className="text-xs font-mono font-bold text-emerald-400 whitespace-nowrap">
                                +{formatAmount(role.bonusAmount)} {currencySymbol}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDailyBonusRole(role.id)}
                              className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Usuń bonus rangi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Przykład sumowania nagrody */}
                  <div className="p-3 rounded-lg bg-[#111316] border border-[#23272e] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-zinc-400">
                      Podgląd sumowania: Baza ({formatAmount(dailyAmount)}) + Bonusy ról (
                      {dailyBonusRoles.map((r) => `${r.roleName}: +${formatAmount(r.bonusAmount)}`).join(' + ') || 'brak'}
                      )
                    </span>
                    <span className="font-bold text-emerald-400 text-sm whitespace-nowrap">
                      = {formatAmount(dailyAmount + dailyBonusRoles.reduce((acc, curr) => acc + curr.bonusAmount, 0))} {currencySymbol}
                    </span>
                  </div>
                </div>
              </div>

              {/* Moduł: /work */}
              <div className="p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4">
                <div className="flex items-center justify-between border-b border-[#2c313a] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">/work (Praca Serwerowa)</h3>
                      <p className="text-[11px] text-zinc-400">Wykonywanie zadań za losowe wynagrodzenie</p>
                    </div>
                  </div>
                  <CustomSwitch
                    checked={workEnabled}
                    onChange={setWorkEnabled}
                    id="switch-work-enabled"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 text-[11px]">Min. zarobek:</label>
                    <input
                      type="number"
                      value={workMin}
                      onChange={(e) => setWorkMin(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#16181b] border border-[#2f353e] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 text-[11px]">Maks. zarobek:</label>
                    <input
                      type="number"
                      value={workMax}
                      onChange={(e) => setWorkMax(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#16181b] border border-[#2f353e] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span>Cooldown (min):</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={workCooldown}
                      onChange={(e) => setWorkCooldown(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#16181b] border border-[#2f353e] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#16181b] border border-[#282d36] text-[11px] text-zinc-400">
                  Przykładowe profesje w bocie: Programista, Grafik, Moderator, Szef kuchni, Kurier.
                </div>
              </div>

              {/* Moduł: /crime z Cooldownem */}
              <div className="p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4">
                <div className="flex items-center justify-between border-b border-[#2c313a] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">/crime (Przestępstwo & Ryzyko)</h3>
                      <p className="text-[11px] text-zinc-400">Wysokie ryzyko: spory zysk lub kara finansowa</p>
                    </div>
                  </div>
                  <CustomSwitch
                    checked={crimeEnabled}
                    onChange={setCrimeEnabled}
                    id="switch-crime-enabled"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 text-[11px]">Szansa sukcesu (%):</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={crimeSuccessRate}
                      onChange={(e) => setCrimeSuccessRate(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#16181b] border border-[#2f353e] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-400" />
                      <span>Cooldown (min):</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={crimeCooldown}
                      onChange={(e) => setCrimeCooldown(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#16181b] border border-[#2f353e] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 text-[11px]">Maks. nagroda:</label>
                    <input
                      type="number"
                      value={crimeMaxReward}
                      onChange={(e) => setCrimeMaxReward(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#16181b] border border-[#2f353e] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 text-[11px]">Grzywna za wpadkę:</label>
                    <input
                      type="number"
                      value={crimeFailFine}
                      onChange={(e) => setCrimeFailFine(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#16181b] border border-[#2f353e] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#16181b] border border-[#282d36] text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>W przypadku braku środków na grzywnę konto gracza może wejść na ujemny stan.</span>
                  <span className="font-mono text-rose-400 font-semibold">{crimeCooldown} min odnowienia</span>
                </div>
              </div>

              {/* Moduł: /rob z Cooldownem oraz Min/Max % Kradzieży */}
              <div className="p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between border-b border-[#2c313a] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white">/rob (Kradzież od innego gracza)</h3>
                      <p className="text-[11px] text-zinc-400">
                        Kradzież gotówki bezpośrednio z portfela ofiary (środki w banku oraz tarcze są w 100% nietykalne)
                      </p>
                    </div>
                  </div>
                  <CustomSwitch
                    checked={robEnabled}
                    onChange={setRobEnabled}
                    id="switch-rob-enabled"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-semibold">Szansa powodzenia (%):</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={robSuccessRate}
                      onChange={(e) => setRobSuccessRate(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#16181b] border border-[#2f353e] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Cooldown (min):</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={robCooldown}
                      onChange={(e) => setRobCooldown(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#16181b] border border-[#2f353e] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-semibold">Minimalny % kradzieży:</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={robMinPercent}
                        onChange={(e) => setRobMinPercent(parseInt(e.target.value) || 1)}
                        className="w-full bg-[#16181b] border border-[#2f353e] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-zinc-400 font-mono">%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-semibold">Maksymalny % kradzieży:</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={robMaxPercent}
                        onChange={(e) => setRobMaxPercent(parseInt(e.target.value) || 1)}
                        className="w-full bg-[#16181b] border border-[#2f353e] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-zinc-400 font-mono">%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-semibold">Ochrona kont (godz.):</label>
                    <input
                      type="number"
                      min="0"
                      value={robProtectionHours}
                      onChange={(e) => setRobProtectionHours(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#16181b] border border-[#2f353e] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#16181b] border border-[#2a2f37] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-zinc-300">
                      Kradzież dotyczy od {robMinPercent}% do {robMaxPercent}% salda portfela ofiary.
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Ochrona nowych kont: {robProtectionHours}h od dołączenia na serwer
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveEconomy}
                className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Zapisz moduły zarobkowe</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ZAKŁADKA 3: SKLEP SERWEROWY                                               */}
        {/* ========================================================================= */}
        {activeTab === 'shop' && (
          <div className="space-y-6">
            {/* Formularz dodawania przedmiotu / roli */}
            <div className="p-5 rounded-xl bg-[#20242a] border border-[#2d323b] space-y-4">
              <div className="flex items-center justify-between border-b border-[#2c313a] pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-bold text-white">
                    Dodaj Pozycję do Sklepu (/shop)
                  </h2>
                </div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">
                  Role Discord & Przedmioty
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Górny wiersz: Nazwa, Cena, Typ */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5 space-y-1">
                    <label className="text-zinc-300 font-semibold">Nazwa pozycji w sklepie:</label>
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="np. Rola @SuperVIP lub Tarcza Ochronna"
                      className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-zinc-300 font-semibold">Cena ({currencySymbol}):</label>
                    <input
                      type="number"
                      min="1"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(parseInt(e.target.value) || 100)}
                      className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-zinc-300 font-semibold">Kategoria (Typ):</label>
                    <div className="grid grid-cols-2 gap-1.5 p-0.5 rounded-lg bg-[#16181b] border border-[#2e333b]">
                      <button
                        type="button"
                        onClick={() => setNewItemType('role')}
                        className={`py-1.5 text-center text-xs font-semibold rounded-md transition-all ${
                          newItemType === 'role'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Rola na Discordzie
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewItemType('item')}
                        className={`py-1.5 text-center text-xs font-semibold rounded-md transition-all ${
                          newItemType === 'item'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Przedmiot
                      </button>
                    </div>
                  </div>
                </div>

                {/* Warunkowe pole: Dla Roli */}
                {newItemType === 'role' && (
                  <div className="p-3.5 rounded-xl bg-[#16181b] border border-purple-500/30 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <label className="text-xs font-bold text-purple-300">
                        Wybierz rolę do automatycznego nadania po zakupie:
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Wybór z ról Twojego serwera:</label>
                        <CustomSelect
                          value={selectedRoleForShop}
                          onChange={(val) => {
                            setSelectedRoleForShop(val);
                            if (!newItemName) {
                              setNewItemName(`Rola ${val}`);
                            }
                          }}
                          options={roleSelectOptions}
                          size="md"
                          triggerClassName="bg-[#20242a] border-[#303640] focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-1">Lub wpisz inną własną rolę:</label>
                        <input
                          type="text"
                          placeholder="np. @Donator+"
                          value={customRoleInput}
                          onChange={(e) => setCustomRoleInput(e.target.value)}
                          className="w-full bg-[#20242a] border border-[#303640] rounded-lg px-3 py-2 text-white placeholder-zinc-500 outline-none focus:border-purple-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Warunkowe pole: Dla Przedmiotu (Wybór Akcji / Efektu) */}
                {newItemType === 'item' && (
                  <div className="p-3.5 rounded-xl bg-[#16181b] border border-emerald-500/30 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <label className="text-xs font-bold text-emerald-300">
                        Wybierz akcję / efekt działania przedmiotu:
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AVAILABLE_ITEM_ACTIONS.map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => {
                            setSelectedItemAction(action.id);
                            if (!newItemName) {
                              setNewItemName(action.label);
                            }
                          }}
                          className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
                            selectedItemAction === action.id
                              ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                              : 'bg-[#20242a] border-[#2e333b] text-zinc-400 hover:text-white hover:border-[#3d4450]'
                          }`}
                        >
                          <span className="text-base">{action.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white truncate">{action.label}</div>
                            <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">{action.hint}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Opis przedmiotu */}
                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Opis wyświetlany w menu zakupu:</label>
                  <input
                    type="text"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="Opis korzyści, uprawnień lub działania przedmiotu..."
                    className="w-full bg-[#16181b] border border-[#2e333b] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddItemToShop}
                    className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Dodaj do sklepu</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Lista aktualnych przedmiotów */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Aktualne Pozycje w Serwerowym Sklepie ({shopItems.length}):
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Komenda graczy: /shop
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {shopItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#20242a] border border-[#2d323b] flex items-start justify-between gap-3 group hover:border-emerald-500/40 transition-all"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{item.name}</span>
                        {item.type === 'role' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            Rola: {item.roleName || item.name}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Przedmiot
                          </span>
                        )}

                        {item.itemActionLabel && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#16181b] text-cyan-300 border border-[#2b3038] truncate max-w-[200px]">
                            ⚡ {item.itemActionLabel}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="text-xs font-mono font-bold text-emerald-400 pt-1">
                        Cena: {formatAmount(item.price)} {currencySymbol}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveShopItem(item.id)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                      title="Usuń ze sklepu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveEconomy}
                  className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Zapisz konfigurację sklepu</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
