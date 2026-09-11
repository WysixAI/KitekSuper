# 🐱 Kitek Discord Bot (Node.js & Cogs + Servers JSON)

Gotowy, kompletny bot Discord w architekturze modułowej **Cogs**, posiadający folder `servers/` z plikami konfiguracyjnymi `servers/[guildId].json` dla każdego dołączonego serwera.

---

## 📂 Struktura Paczki Bota

```text
kitek-discord-bot/
├── index.js                  # Główny loader ładujący cogs oraz serwery
├── package.json              # Zależności: discord.js v14, dotenv
├── .env.example              # Wzór konfiguracji (token, clientId, dashboardUrl)
├── vercel.json               # Konfiguracja rewrites dla dashboardu WWW
├── README.md                 # Ta instrukcja
├── cogs/                     # Moduły funkcjonalne bota:
│   ├── guildTracker.js       # Wykrywanie dołączenia (guildCreate), auto-tworzenie servers/[id].json
│   ├── welcome.js            # System powitań, formatowanie embed, auto-rola
│   ├── autocontent.js        # Automatyczne ciekawostki o kotach, memy, cytaty
│   ├── moderation.js         # Automod (anty-linki, anty-spam) i komendy /wyczysc, /wycisz
│   ├── logging.js            # Audit logi (usunięte wiadomości, edycje, wyjścia)
│   └── economy.js            # Waluta serwera, nagroda /daily, /portfel, /przelej
└── servers/                  # Baza konfiguracji per serwer (nazwa pliku to ZAWSZE [id_serwera].json):
    ├── default.json          # Szablon domyślny dla każdego nowego serwera
    └── 1368350667634376785.json # Konfiguracja danego serwera (nazwa pliku = Snowflake ID serwera)
```

---

## ⚙️ Jak działa folder `servers/[guildId].json`?

1. Gdy bot zostaje zaproszony na jakikolwiek serwer (`guildCreate`), moduł `cogs/guildTracker.js` sprawdza, czy w folderze `servers/` istnieje plik o nazwie `[guildId].json` (np. `1368350667634376785.json`).
2. Jeśli plik nie istnieje, bot automatycznie kopiuje szablon z `servers/default.json`, uzupełnia ID i nazwę serwera, oraz zapisuje nowy plik `servers/[guildId].json`.
3. Każdy cog (`welcome.js`, `moderation.js`, `autocontent.js`, etc.) odczytuje indywidualne preferencje danego serwera bezpośrednio ze swojego pliku JSON!
4. Zmiany wprowadzone w Dashboardzie WWW lub bezpośrednio w pliku JSON działają natychmiastowo.

---

## 🚀 Jak uruchomić bota w 3 krokach

### 1. Rozpakuj paczkę i zainstaluj pakiety
```bash
npm install
```

### 2. Utwórz plik `.env`
Skopiuj `.env.example` do pliku `.env`:
```bash
cp .env.example .env
```
Wklej swój token bota z [Discord Developer Portal](https://discord.com/developers/applications):
```env
DISCORD_BOT_TOKEN=twoj_token_bota_tutaj
DISCORD_CLIENT_ID=1368350667634376785
DASHBOARD_URL=https://kitekbots.vercel.app
```

> **Ważne w Discord Developer Portal:**
> W zakładce **Bot** włącz **Privileged Gateway Intents**:
> - ✅ **Server Members Intent** (wymagane dla cogs/welcome.js)
> - ✅ **Message Content Intent** (wymagane dla cogs/moderation.js)

### 3. Uruchom bota
```bash
npm start
```

---

## 🌐 Gdzie wrzucić paczkę bota (Hosting 24/7)
- **Railway.app** / **Render.com**: Wystarczy wgrać całe repozytorium lub folder, dodać zmienne środowiskowe i uruchomić z `npm start`.
- **Własny VPS z PM2**:
  ```bash
  npm install -g pm2
  pm2 start index.js --name "kitek-bot"
  pm2 save
  ```
