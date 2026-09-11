/**
 * ==============================================================================
 * COG: AUTO CONTENT (Automatyczne ciekawostki, memy i fakty o kotach)
 * ==============================================================================
 * 
 * Czyta z pliku servers/[guildId].json:
 *   - autoContent.enabled
 *   - autoContent.channelId
 *   - autoContent.postIntervalHours
 *   - autoContent.categories
 * ==============================================================================
 */

import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

const CAT_FACTS = [
  'Koty przesypiają około 70% swojego życia — to oznacza, że 9-letni kot spędził na jawie zaledwie 3 lata!',
  'Wibrysy (wąsy) kota są tak czułe, że potrafią wyczuć najmniejsze zmiany w przepływie powietrza.',
  'Kot wydaje z siebie ponad 100 różnych dźwięków, podczas gdy pies tylko około 10.',
  'Kocie serce bije dwa razy szybciej niż ludzkie — od 110 do 140 uderzeń na minutę.',
  'Odcisk kociego nosa jest unikalny dla każdego osobnika, dokładnie tak jak linie papilarne u ludzi!',
  'Koty potrafią skakać na wysokość równą 6-krotności długości własnego ciała.',
  'Mruczenie kota ma częstotliwość 25-150 Hz, która stymuluje regenerację kości i tkanek.',
];

const CAT_MEMES = [
  '„Nie potrzebuję budzika. Mam kota, który o 5:00 rano uważa, że miska jest w połowie pusta.” 🐱',
  '„Zasada fizyki kwantowej: Pudełko jest zawsze lepsze niż zabawka za 200 zł znajdująca się w środku.” 📦',
  '„Człowiek pracuje, żeby kot mógł spać w 15 różnych miejscach w ciągu dnia.” 🛋️',
  '„Kiedy wpatrujesz się w pustą ścianę o 3:00 w nocy, kot po prostu widzi równoległy wszechświat.” 🌌',
];

export function getSlashCommands() {
  return [
    new SlashCommandBuilder()
      .setName('kitek-fakt')
      .setDescription('Zwraca losową fascynującą ciekawostkę ze świata kotów'),
    new SlashCommandBuilder()
      .setName('kitek-mem')
      .setDescription('Wysyła zabawny koci cytat lub mem ze społeczności Kitek'),
  ];
}

export default function setupAutoContent(client, context) {
  const { getServerConfig, saveServerConfig } = context;

  // Cykliczne sprawdzanie publikacji co 15 minut
  setInterval(async () => {
    for (const [guildId, guild] of client.guilds.cache) {
      const config = getServerConfig(guildId);
      if (!config || !config.modules?.autoContent || !config.autoContent?.enabled) continue;

      const ac = config.autoContent;
      if (!ac.channelId) continue;

      const channel = guild.channels.cache.get(ac.channelId);
      if (!channel || !('send' in channel)) continue;

      const intervalMs = (ac.postIntervalHours || 12) * 3600 * 1000;
      const lastPost = ac.lastPostAt ? new Date(ac.lastPostAt).getTime() : 0;
      const now = Date.now();

      if (now - lastPost >= intervalMs) {
        const randomFact = CAT_FACTS[Math.floor(Math.random() * CAT_FACTS.length)];
        const embed = new EmbedBuilder()
          .setColor(0x10b981)
          .setTitle('🐱 Kocurek Dnia & Ciekawostka Kitek')
          .setDescription(randomFact)
          .setFooter({ text: `Automatyczny post Kitek • ${guild.name}` })
          .setTimestamp();

        try {
          await channel.send({ embeds: [embed] });
          config.autoContent.lastPostAt = new Date().toISOString();
          saveServerConfig(guildId, config);
          console.log(`📰 [AUTO CONTENT] Wysłano post na kanale #${channel.name} (${guild.name})`);
        } catch (e) {
          console.warn(`⚠️ [AUTO CONTENT] Błąd wysyłania:`, e.message);
        }
      }
    }
  }, 15 * 60 * 1000);

  // Komendy slash
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'kitek-fakt') {
      const fact = CAT_FACTS[Math.floor(Math.random() * CAT_FACTS.length)];
      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('💡 Ciekawostka o kotach')
        .setDescription(fact)
        .setFooter({ text: 'Kitek Bot System' });
      await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'kitek-mem') {
      const meme = CAT_MEMES[Math.floor(Math.random() * CAT_MEMES.length)];
      const embed = new EmbedBuilder()
        .setColor(0xf59e0b)
        .setTitle('😹 Kitek Mem / Humor')
        .setDescription(meme)
        .setFooter({ text: 'Kitek Bot System' });
      await interaction.reply({ embeds: [embed] });
    }
  });
}
