export interface BotUpdateLogItem {
  id: string;
  version: string;
  badge: 'NAJNOWSZY' | 'HOTFIX' | 'CORE ENGINE' | 'FEATURE' | 'UPDATE' | 'BETA';
  badgeColor?: 'emerald' | 'amber' | 'blue' | 'purple' | 'red';
  date: string;
  timestamp: number;
  title: string;
  summary: string;
  affectedFiles: string[];
  changes: Array<{
    type: 'fix' | 'feature' | 'improvement' | 'security';
    text: string;
    details?: string;
  }>;
}

export const BOT_CHANGELOG_DATA: BotUpdateLogItem[] = [
  {
    id: 'bot-v1-2-5',
    version: '1.2.5',
    badge: 'NAJNOWSZY',
    badgeColor: 'emerald',
    date: '12.09.2026 (Wydanie bieżące)',
    timestamp: Date.now(),
    title: 'Kitek Bot Engine v1.2.5 • Komponenty v2, Przyciski, Menu & Akcje Ról (Role Actions)',
    summary:
      'Wprowadzono pełną obsługę wysyłania komponentów Discord v2 (Button Row, Select Menu, Separator) z kreatora embedów oraz wdrożono automatyczne akcje bota: nadawanie, zabieranie i przełączanie ról serwera oraz prywatne wiadomości ephemeral.',
    affectedFiles: [
      'bot/cogs/interactions.js',
      'bot/index.js',
      'api/index.ts',
      'src/components/MessageStyleEditor.tsx',
      'src/components/DiscordPreview.tsx',
      'src/types/embed.ts',
    ],
    changes: [
      {
        type: 'feature',
        text: 'Wysyłka komponentów Discord v2 (Action Rows, Buttons, Select Menus)',
        details:
          'Komponenty tworzone w kreatorze MessageStyleEditor (przyciski, listy rozwijane, separatory) są teraz w 100% konwertowane do struktur Discord ActionRow (type 1), Button (type 2) oraz StringSelect (type 3) i wysyłane bezpośrednio przez REST API i bota.',
      },
      {
        type: 'feature',
        text: 'Akcje ról dla przycisków i menu: Nadawanie, Zabieranie i Przełączanie ról (Role Assignment)',
        details:
          'Dodano wsparcie dla akcji: add_role (nadanie rangi), remove_role (odebranie rangi), toggle_role (przełącznik: nadanie lub odebranie jeśli posiada) oraz ephemeral_msg (prywatny komunikat dla klikającego). W edytorze można wybrać rolę z serwera lub podać własne ID roli.',
      },
      {
        type: 'feature',
        text: 'Nowy moduł bota: bot/cogs/interactions.js',
        details:
          'Dedykowany cog do obsługi zdarzeń interactionCreate (zarówno ButtonInteraction, jak i StringSelectMenuInteraction) z bezpieczną walidacją uprawnień bota (ManageRoles) oraz sprawdzaniem hierarchii ról Discorda.',
      },
      {
        type: 'improvement',
        text: 'Interaktywny podgląd na żywo z symulacją odpowiedzi Ephemeral',
        details:
          'W oknie DiscordPreview kliknięcie skonfigurowanego przycisku lub wybór z menu wyświetla wierną symulację odpowiedzi prywatnej Discorda (ephemeral message) wraz z etykietami docelowych ról.',
      },
      {
        type: 'fix',
        text: 'Poprawna obsługa separatorów i wyświetlacza tekstu (Text Display & Separator)',
        details:
          'Separatory oraz bloki Text Display są teraz estetycznie formatowane i dołączane do opisów wysyłanych embedów bez utraty formatowania Markdown.',
      },
    ],
  },
  {
    id: 'bot-v1-2-4',
    version: '1.2.4',
    badge: 'UPDATE',
    badgeColor: 'blue',
    date: '12.09.2026',
    timestamp: 1789257600000,
    title: 'Kitek Bot Engine v1.2.4 • Dynamiczne Role Serwerowe & Kolejka Embedów',
    summary:
      'Kompletne usunięcie fikcyjnych rang z ekonomii, dynamiczne pobieranie prawdziwych ról z serwera Discord, start nowych serwerów z wyłączonymi modułami oraz bezpośrednia wysyłka embedów.',
    affectedFiles: [
      'bot/servers/default.json',
      'bot/cogs/guildTracker.js',
      'bot/index.js',
      'api/index.ts',
      'src/components/EconomySystemView.tsx',
      'src/components/EmbedCreatorView.tsx',
    ],
    changes: [
      {
        type: 'fix',
        text: 'Dynamiczne role serwera w Ekonomii zamiast fikcyjnych rang',
        details:
          'Usunięto statycznie wpisane nazwy @VIP, @Nitro Booster czy @Sponsor. System pobiera i waliduje listę prawdziwych ról zarejestrowanych na podłączonym serwerze Discord (zarówno dla bonusu /daily, jak i sklepu /shop).',
      },
      {
        type: 'improvement',
        text: 'Czysty start – wszystkie moduły domyślnie wyłączone dla nowych serwerów',
        details:
          'Zarówno w servers/default.json, jak i w zdarzeniu guildCreate w cogs/guildTracker.js moduły economy, welcome, logging, moderation oraz autoContent są domyślnie ustawione na false. Właściciel serwera sam decyduje, co chce włączyć.',
      },
      {
        type: 'feature',
        text: 'Bezpośrednia wysyłka wiadomości Embed przez Discord REST API i kolejkę synchronizacji',
        details:
          'Wprowadzono endpoint /api/bot/send-embed. Jeśli podano botToken i ID kanału, wiadomość jest wysyłana bezzwłocznie; w innym przypadku trafia do kolejki pendingBotActions i jest wysyłana w najbliższym cyklu synchronizacji bota.',
      },
      {
        type: 'fix',
        text: 'Inteligentne wyszukiwanie kanałów po ID lub nazwie (case-insensitive)',
        details:
          'Bot w bot/index.js odnajduje kanał docelowy po ID lub uniezależnionej od wielkości liter nazwie kanału (#ogłoszenia, ogloszenia).',
      },
      {
        type: 'improvement',
        text: 'Zapisywanie i scalanie konfiguracji serwera (POST /api/bot/servers/:id/config)',
        details:
          'Ustawienia zapisywane z poziomu panelu są głęboko scalane (deep merge) z istniejącymi danymi serwera bez ryzyka nadpisania niezmienionych pól.',
      },
    ],
  },
  {
    id: 'bot-v1-2-3',
    version: '1.2.3',
    badge: 'CORE ENGINE',
    badgeColor: 'blue',
    date: '11.09.2026',
    timestamp: 1789171200000,
    title: 'Kitek Bot Engine v1.2.3 • guildTracker, Auto-Config & Heartbeat',
    summary:
      'Wdrożenie automatycznego wykrywania dodania bota na serwer (guildCreate), tworzenia pliku servers/[guildId].json oraz dwukierunkowej telemetrii Gateway Heartbeat.',
    affectedFiles: [
      'bot/cogs/guildTracker.js',
      'bot/index.js',
      'api/index.ts',
      'bot/servers/default.json',
    ],
    changes: [
      {
        type: 'feature',
        text: 'Automatyczne wykrywanie guildCreate i auto-tworzenie servers/[id].json',
        details:
          'Cog cogs/guildTracker.js nasłuchuje zdarzenia dołączenia do nowego serwera i natychmiast generuje dedykowaną konfigurację bazując na servers/default.json.',
      },
      {
        type: 'feature',
        text: 'Powiadamianie panelu WWW o dołączeniu i opuszczeniu serwera (guildJoined / guildLeft)',
        details:
          'Bot wysyła zapytanie POST na /api/bot/guild-joined oraz /api/bot/guild-left, dzięki czemu lista serwerów w panelu jest zawsze aktualna.',
      },
      {
        type: 'improvement',
        text: 'Dwukierunkowy Heartbeat i synchronizacja listy serwerów',
        details:
          'Bot co 30 sekund przekazuje do /api/bot/sync liczbę obsługiwanych serwerów, swój tag i ping, odbierając najnowsze zmiany konfiguracji z panelu WWW.',
      },
    ],
  },
  {
    id: 'bot-v1-2-2',
    version: '1.2.2',
    badge: 'HOTFIX',
    badgeColor: 'amber',
    date: '10.09.2026',
    timestamp: 1789084800000,
    title: 'Kitek Bot Engine v1.2.2 • Czyszczenie Slash Commands & Auto-Kontent',
    summary:
      'Naprawa dublujących się komend ukośnika w Discord API, rejestracja komend z cogsów oraz obsługa modułu cyklicznych publikacji.',
    affectedFiles: [
      'bot/index.js',
      'bot/cogs/autocontent.js',
      'bot/cogs/welcome.js',
      'bot/cogs/moderation.js',
    ],
    changes: [
      {
        type: 'fix',
        text: 'Usunięcie starych i zduplikowanych komend ukośnika Slash Commands',
        details:
          'Skrypt startowy bota wykonuje czyszczenie globalnych komend przed rejestracją najnowszego zestawu komend wyciągniętych z cogsów.',
      },
      {
        type: 'feature',
        text: 'Moduł cogs/autocontent.js z obsługą 3 slotów czasowych',
        details:
          'Cykliczne wysyłanie memów, ciekawostek i plików o interwałach 1H / 6H / 24H / 48H według harmonogramu w servers/[id].json.',
      },
    ],
  },
  {
    id: 'bot-v1-2-0',
    version: '1.2.0',
    badge: 'FEATURE',
    badgeColor: 'purple',
    date: '08.09.2026',
    timestamp: 1788912000000,
    title: 'Kitek Bot Engine v1.2.0 • Modułowa Architektura Cogs & Baza JSON',
    summary:
      'Przebudowa architektury bota na modularny system Cogs (wzorowany na pythonowych cogach, zaimplementowany w nowoczesnym ES Modules Node.js).',
    affectedFiles: [
      'bot/index.js',
      'bot/cogs/welcome.js',
      'bot/cogs/logging.js',
      'bot/cogs/moderation.js',
      'bot/cogs/economy.js',
      'bot/servers/default.json',
      'bot/package.json',
    ],
    changes: [
      {
        type: 'feature',
        text: 'Wprowadzenie struktury folderu cogs/ z automatycznym ładowaniem',
        details:
          'Główny plik bot/index.js dynamicznie skanuje katalog cogs/ i ładuje każdy moduł przekazując kontekst z metodami zapisu i odczytu konfiguracji.',
      },
      {
        type: 'feature',
        text: 'Wieloserwerowa separacja plików konfiguracyjnych w bot/servers/*.json',
        details:
          'Każdy serwer Discord posiada w 100% odizolowany plik JSON, co zapobiega wyciekom danych między serwerami i ułatwia edycję w edytorze kodu.',
      },
      {
        type: 'security',
        text: 'Izolacja uprawnień i obsługa błędów per-cog',
        details:
          'Awaria jednego coga (np. błąd formatowania w powitaniu) nie powoduje wyłączenia całego procesu bota ani innych modułów.',
      },
    ],
  },
  {
    id: 'bot-v1-0-0',
    version: '1.0.0',
    badge: 'BETA',
    badgeColor: 'blue',
    date: '01.09.2026',
    timestamp: 1788307200000,
    title: 'Kitek Bot Engine v1.0.0 • Oficjalny start bota Kitek',
    summary:
      'Pierwsza publiczna wersja bota discord.js v14 zintegrowana z webowym panelem administracyjnym.',
    affectedFiles: [
      'bot/index.js',
      'bot/package.json',
      'bot/.env.example',
    ],
    changes: [
      {
        type: 'feature',
        text: 'Inicjalizacja klienta Discord.js v14 z wymaganymi Intents',
        details:
          'Guilds, GuildMembers, GuildMessages, MessageContent, GuildModeration i DirectMessages.',
      },
      {
        type: 'feature',
        text: 'Podstawowy system powitań, logowania i moderacji',
        details: 'Pierwsza implementacja kart powitalnych oraz komend moderacyjnych.',
      },
    ],
  },
];
