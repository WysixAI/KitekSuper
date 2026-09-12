/**
 * ==============================================================================
 * COG: INTERACTIONS (Obsługa przycisków, menu wyboru i akcji ról)
 * ==============================================================================
 * 
 * Odpowiada za:
 *   - Obsługę interakcji przycisków (interaction.isButton())
 *   - Obsługę interakcji list rozwijanych (interaction.isStringSelectMenu())
 *   - Nadawanie, odbieranie i przełączanie ról użytkownikom serwera (Role Assignment/Removal/Toggle)
 *   - Odpowiedzi ephemeral (prywatne komunikaty widoczne tylko dla klikającego)
 *   - Bezpieczną walidację uprawnień bota (sprawdzanie hierarchii ról i uprawnienia ManageRoles)
 * ==============================================================================
 */

import { PermissionFlagsBits } from 'discord.js';

export function getSlashCommands() {
  return [];
}

export default function setupInteractions(client, context) {
  const { getServerConfig } = context;

  client.on('interactionCreate', async (interaction) => {
    // Interesują nas tylko komponenty: przyciski i string select menu
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    if (!interaction.inGuild() || !interaction.guild) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Te interakcje działają wyłącznie na serwerach Discord.',
          ephemeral: true,
        }).catch(() => {});
      }
      return;
    }

    try {
      const { guild, member } = interaction;
      const config = (getServerConfig && getServerConfig(guild.id)) || {};
      const customInteractions = config.customInteractions || {};

      let actionType = 'none';
      let targetRoleId = '';
      let targetRoleName = '';
      let customMessage = '';

      if (interaction.isButton()) {
        const customId = interaction.customId;

        // 1. Sprawdź najpierw w konfiguracji serwera
        if (customInteractions[customId]) {
          const cfg = customInteractions[customId];
          actionType = cfg.actionType || 'none';
          targetRoleId = cfg.targetRoleId || '';
          targetRoleName = cfg.targetRoleName || '';
          customMessage = cfg.customMessage || '';
        } else if (customId.startsWith('ktk:act:')) {
          // Format: ktk:act:${actionType}:${targetRoleId}:${btnId}
          const parts = customId.split(':');
          actionType = parts[2] || 'none';
          targetRoleId = parts[3] !== 'none' ? parts[3] : '';
        }
      } else if (interaction.isStringSelectMenu()) {
        const selectedValue = interaction.values?.[0];
        if (!selectedValue) return;

        // 1. Sprawdź w konfiguracji
        if (customInteractions[selectedValue]) {
          const cfg = customInteractions[selectedValue];
          actionType = cfg.actionType || 'none';
          targetRoleId = cfg.targetRoleId || '';
          targetRoleName = cfg.targetRoleName || '';
          customMessage = cfg.customMessage || '';
        } else if (selectedValue.startsWith('ktk:opt:')) {
          // Format: ktk:opt:${actionType}:${targetRoleId}:${optId}
          const parts = selectedValue.split(':');
          actionType = parts[2] || 'none';
          targetRoleId = parts[3] !== 'none' ? parts[3] : '';
        }
      }

      // Jeżeli nie ma żadnej zdefiniowanej akcji lub akcja to 'none'
      if (!actionType || actionType === 'none') {
        if (customMessage) {
          return await interaction.reply({ content: customMessage, ephemeral: true });
        }
        return await interaction.reply({
          content: '🐱 Kliknięto element bota Kitek (brak przypisanej akcji automatycznej).',
          ephemeral: true,
        });
      }

      // 2. Akcja: prywatna wiadomość ephemeral
      if (actionType === 'ephemeral_msg') {
        return await interaction.reply({
          content: customMessage || '🔔 Otrzymałeś powiadomienie od bota Kitek.',
          ephemeral: true,
        });
      }

      // 3. Akcje ról: 'add_role', 'remove_role', 'toggle_role'
      if (['add_role', 'remove_role', 'toggle_role'].includes(actionType)) {
        if (!targetRoleId && !targetRoleName) {
          return await interaction.reply({
            content: '❌ Błąd konfiguracji: Nie określono docelowej roli w tym przycisku.',
            ephemeral: true,
          });
        }

        // Pobierz rolę
        let role = null;
        if (targetRoleId && targetRoleId !== 'none') {
          role = guild.roles.cache.get(targetRoleId) || (await guild.roles.fetch(targetRoleId).catch(() => null));
        }
        if (!role && targetRoleName) {
          role = guild.roles.cache.find(
            (r) => r.name.toLowerCase() === targetRoleName.toLowerCase()
          );
        }

        if (!role) {
          return await interaction.reply({
            content: `❌ Nie znaleziono roli ${targetRoleName ? `**${targetRoleName}**` : `o ID \`${targetRoleId}\``} na serwerze. Upewnij się, że rola nie została usunięta.`,
            ephemeral: true,
          });
        }

        // Sprawdź uprawnienia bota
        const botMember = await guild.members.fetchMe().catch(() => null);
        if (!botMember || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
          return await interaction.reply({
            content: '❌ Bot Kitek nie posiada uprawnienia **Zarządzanie rolami** (Manage Roles) na tym serwerze!',
            ephemeral: true,
          });
        }

        // Sprawdź hierarchię ról
        if (role.comparePositionTo(botMember.roles.highest) >= 0) {
          return await interaction.reply({
            content: `❌ Rola **${role.name}** znajduje się wyżej lub na równi z najwyższą rolą bota Kitek w hierarchii serwera. Przesuń rolę bota wyżej w Ustawienia Serwera ➔ Role.`,
            ephemeral: true,
          });
        }

        const hasRole = member.roles.cache.has(role.id);

        // Nadanie roli
        if (actionType === 'add_role') {
          if (hasRole) {
            return await interaction.reply({
              content: `ℹ️ Posiadasz już rolę **${role.name}**!`,
              ephemeral: true,
            });
          }
          await member.roles.add(role);
          console.log(`[INTERACTIONS] Nadano rolę "${role.name}" użytkownikowi ${member.user.tag} (${member.id}) na serwerze ${guild.name}`);
          return await interaction.reply({
            content: customMessage || `✅ Pomyślnie nadano rolę **${role.name}**!`,
            ephemeral: true,
          });
        }

        // Odebranie roli
        if (actionType === 'remove_role') {
          if (!hasRole) {
            return await interaction.reply({
              content: `ℹ️ Nie posiadasz roli **${role.name}**.`,
              ephemeral: true,
            });
          }
          await member.roles.remove(role);
          console.log(`[INTERACTIONS] Odebrano rolę "${role.name}" użytkownikowi ${member.user.tag} (${member.id}) na serwerze ${guild.name}`);
          return await interaction.reply({
            content: customMessage || `🗑️ Pomyślnie odebrano rolę **${role.name}**!`,
            ephemeral: true,
          });
        }

        // Przełączenie roli (Toggle)
        if (actionType === 'toggle_role') {
          if (hasRole) {
            await member.roles.remove(role);
            console.log(`[INTERACTIONS] [TOGGLE] Odebrano rolę "${role.name}" użytkownikowi ${member.user.tag}`);
            return await interaction.reply({
              content: customMessage || `🗑️ Usunięto rolę **${role.name}**.`,
              ephemeral: true,
            });
          } else {
            await member.roles.add(role);
            console.log(`[INTERACTIONS] [TOGGLE] Nadano rolę "${role.name}" użytkownikowi ${member.user.tag}`);
            return await interaction.reply({
              content: customMessage || `✅ Otrzymałeś rolę **${role.name}**!`,
              ephemeral: true,
            });
          }
        }
      }
    } catch (err) {
      console.error('[INTERACTIONS] Błąd obsługi interakcji:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `❌ Wystąpił błąd podczas wykonywania akcji: ${err.message}`,
          ephemeral: true,
        }).catch(() => {});
      }
    }
  });
}
