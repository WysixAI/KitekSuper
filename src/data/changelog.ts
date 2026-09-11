export interface SimpleChangeItem {
  text: string;
}

export interface VersionLog {
  version: string;
  badge: string;
  date: string;
  title: string;
  added: string[];
}

export const CHANGELOG_DATA: VersionLog[] = [
  {
    version: '1.2',
    badge: 'NAJNOWSZA',
    date: 'Aktualne wydanie',
    title: 'Kitek 1.2 • Auto-Kontent & Addons',
    added: [
      'Nowy moduł: Auto-Kontent – 3 niezależne sloty cyklicznego publikowania plików, programów, grafik i linków',
      'Elastyczne interwały Auto-Kontentu: 1H / 6H / 24H / 48H z podglądem na żywo i formatami Tekst / Embed v2',
      'Wirtualny kompresor załączników i obsługa uploadu plików z limitem do 25 MB Discorda',
      'Nowa kategoria w menu nawigacji: ADDONS (Dodatki serwerowe)',
      'Addon: Finders – szukarka zasobów oraz Minecraft Map Finder z konfiguracją kanału i cooldownu per ranga',
      'Baza danych map Minecraft (wersje, kategorie, autorzy, kompresja i bezpośrednie załączniki)',
      'Ekonomia: uproszczenie wyboru ról do bonusów /daily (czysty wybór z listy ról serwera)',
      'Changelog: zintegrowane teczki/archiwum starszych wersji z szybkim przełączaniem podglądu',
    ],
  },
  {
    version: '1.1',
    badge: 'UPDATE',
    date: 'Poprzednia wersja',
    title: 'Kitek 1.1 • Bank & Moduły Zarobkowe',
    added: [
      'Nowy system bankowy z dziennym oprocentowaniem pasywnym (/dep, /with)',
      'Konfiguracja limitów portfela (Max na koncie) oraz skarbca bankowego',
      'Wybór formatowania liczb (spacja: 1 000, przecinek: 1,000, kropka: 1.000, bez separatora)',
      'Sumujące się bonusy do nagrody /daily z posiadanych rang Discord (@VIP, @Nitro Booster)',
      'Udoskonalone moduły zarobkowe /crime i /rob z własnymi cooldownami i przedziałami % kradzieży',
      'Sklep serwerowy /shop z czystym podziałem na Role oraz Przedmioty (tarcze, boosty zarobków)',
    ],
  },
  {
    version: '1.0',
    badge: 'BETA',
    date: 'Wydanie wstępne',
    title: 'Kitek 1.0 BETA',
    added: [
      'Główny panel zarządzania (Dashboard) bota Kitek',
      'System modułów konfiguracyjnych dla serwera Discord',
      'Panel logowania i autoryzacji kontem Discord',
      'Konfiguracja powitań (Welcome System) z kartami powitalnymi',
      'Zaawansowane logowanie zdarzeń (Logging System)',
      'Kreator Embed Creator Components v2 z podglądem na żywo',
      'Taryfikator kar, system warnów i ochrona Automod',
    ],
  },
];

