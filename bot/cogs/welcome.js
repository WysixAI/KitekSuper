/**
 * ==============================================================================
 * COG: WELCOME SYSTEM (Obsługa nowych członków i powitań)
 * ==============================================================================
 * 
 * Moduł powitań czyta ustawienia z pliku:
 *   -> servers/[guildId].json
 * 
 * Funkcje:
 *   - client.on('guildMemberAdd') -> Wysyła powitanie na kanale i/lub w wiadomości prywatnej
 *   - Automatyczne nadawanie roli (autoRole)
 *   - Komenda slash: /test-powitanie (do testowania wyglądu powitania)
 * ==============================================================================
 */

import { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export function getSlashCommands() {
  return [];
}

export default function setupWelcomeSystem(client, context) {
  const { getServerConfig } = context;

  // Funkcja pomocnicza budująca treść i Embed powitania
  function buildWelcomeMessage(member, cfg) {
    const ws = cfg?.welcomeSystem || {};
    const rawMsg = ws.message || 'Witaj {user} na serwerze {server}!';
    const content = rawMsg
      .replace(/\{user\}/g, `<@${member.id}>`)
      .replace(/\{server\}/g, member.guild.name)
      .replace(/\{memberCount\}/g, member.guild.memberCount.toString());

    let embed = null;
    if (ws.embed) {
      const hexColor = parseInt((ws.embed.color || '#10b981').replace('#', ''), 16) || 0x10b981;
      embed = new EmbedBuilder()
        .setColor(hexColor)
        .setTitle(ws.embed.title || '🎉 Witaj na serwerze!')
        .setDescription(
          (ws.embed.description || content)
            .replace(/\{user\}/g, `<@${member.id}>`)
            .replace(/\{server\}/g, member.guild.name)
            .replace(/\{memberCount\}/g, member.guild.memberCount.toString())
        );

      if (ws.embed.showAvatar) {
        embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }));
      }
      if (ws.embed.footer) {
        embed.setFooter({ text: ws.embed.footer });
      }
      embed.setTimestamp();
    }

    return { content, embed };
  }

  // 1. ZDARZENIE: NOWY CZŁONEK DOŁĄCZA DO SERWERA
  client.on('guildMemberAdd', async (member) => {
    const config = getServerConfig(member.guild.id);
    if (!config || !config.modules?.welcomeSystem || !config.welcomeSystem?.enabled) {
      return;
    }

    const ws = config.welcomeSystem;
    const { content, embed } = buildWelcomeMessage(member, config);

    // A. Wysłanie na kanał tekstowy
    try {
      let targetChannel = null;
      if (ws.channelId) {
        targetChannel = member.guild.channels.cache.get(ws.channelId);
      }
      if (!targetChannel) {
        targetChannel = member.guild.systemChannel;
      }

      if (targetChannel && 'send' in targetChannel) {
        await targetChannel.send({
          content: embed ? content : content,
          embeds: embed ? [embed] : [],
        });
        console.log(`👋 [WELCOME] Wysłano powitanie dla ${member.user.tag} na serwerze ${member.guild.name}`);
      }
    } catch (err) {
      console.warn(`⚠️ [WELCOME] Błąd wysyłania na kanał powitań:`, err.message);
    }

    // B. Wysłanie w wiadomości prywatnej (DM) jeśli włączone
    if (ws.sendDm) {
      try {
        await member.send({
          content: `Wiadomość z serwera **${member.guild.name}**:\n${content}`,
          embeds: embed ? [embed] : [],
        });
      } catch {
        // Użytkownik ma zablokowane DM od członków serwera
      }
    }

    // C. Nadanie automatycznej roli (jeśli skonfigurowano)
    if (ws.autoRole) {
      try {
        const role = member.guild.roles.cache.find(
          (r) => r.name.toLowerCase() === ws.autoRole.toLowerCase() || r.id === ws.autoRole
        );
        if (role) {
          await member.roles.add(role);
          console.log(`🏷️ [WELCOME] Nadano auto-rolę ${role.name} dla ${member.user.tag}`);
        }
      } catch (roleErr) {
        console.warn(`⚠️ [WELCOME] Nie udało się nadać auto-roli:`, roleErr.message);
      }
    }
  });

  // 2. OBSŁUGA KOMENDY /test-powitanie
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'test-powitanie') return;

    const guildId = interaction.guildId;
    if (!guildId) {
      return interaction.reply({ content: '❌ Ta komenda działa tylko na serwerze.', ephemeral: true });
    }

    const config = getServerConfig(guildId);
    if (!config) {
      return interaction.reply({
        content: `⚠️ Brak pliku konfiguracyjnego \`servers/${guildId}.json\`. Skonfiguruj serwer w Dashboardzie.`,
        ephemeral: true,
      });
    }

    const { content, embed } = buildWelcomeMessage(interaction.member, config);
    await interaction.reply({
      content: `🔔 **[PODGLĄD POWITANIA]** (Ustawienia z pliku \`servers/${guildId}.json\`):\n${content}`,
      embeds: embed ? [embed] : [],
      ephemeral: true,
    });
  });
}
