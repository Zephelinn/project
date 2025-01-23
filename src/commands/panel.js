import { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import config from '../config.js';

export async function handlePanelCommand(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.editReply({ content: 'You do not have permission to use this command.' });
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('ticket_category')
          .setPlaceholder('Select ticket category')
          .addOptions(Object.values(config.categories).map(cat => ({
            label: cat.label,
            description: cat.description,
            value: cat.id
          })))
      );

    const panelEmbed = new EmbedBuilder()
      .setTitle(config.embeds.panel.title)
      .setDescription(config.embeds.panel.description)
      .setColor(config.embeds.panel.color);

    if (config.embeds.panel.footer) {
      panelEmbed.setFooter(config.embeds.panel.footer);
    }

    if (config.embeds.panel.timestamp) {
      panelEmbed.setTimestamp();
    }

    await interaction.channel.send({ embeds: [panelEmbed], components: [row] });
    await interaction.editReply({ content: 'Ticket panel created!' });
  } catch (error) {
    console.error('Error in handlePanelCommand:', error);
    await interaction.editReply({ content: 'An error occurred while creating the ticket panel.' });
  }
}