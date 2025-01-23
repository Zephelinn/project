import { EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { createTranscript } from 'discord-html-transcripts';
import config from '../config.js';
import * as database from '../database.js';

export async function handleTicketCreate(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    if (await database.isBlacklisted(interaction.user.id)) {
      return await interaction.editReply({
        content: 'You are blacklisted from creating tickets.'
      });
    }

    const categoryId = interaction.values[0];
    const category = Object.values(config.categories).find(cat => cat.id === categoryId);

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      parent: categoryId,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
        },
        {
          id: config.roles.staff,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
        }
      ]
    });

    const { error: createError } = await database.createTicket(channel.id, interaction.user.id, category.label);
    if (createError) {
      console.error('Error creating ticket:', createError);
      return await interaction.editReply({ content: 'Failed to create ticket. Please try again later.' });
    }

    const closeButton = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(closeButton);

    const welcomeEmbed = new EmbedBuilder()
      .setTitle(config.embeds.ticket.welcome.title)
      .setDescription(config.embeds.ticket.welcome.description)
      .addFields(
        { name: 'Category', value: category.label, inline: true },
        { name: 'Created By', value: interaction.user.toString(), inline: true },
        ...config.embeds.ticket.welcome.fields
      )
      .setColor(config.embeds.ticket.welcome.color);

    if (config.embeds.ticket.welcome.footer) {
      welcomeEmbed.setFooter(config.embeds.ticket.welcome.footer);
    }

    if (config.embeds.ticket.welcome.timestamp) {
      welcomeEmbed.setTimestamp();
    }

    const welcomeMsg = await channel.send({
      content: `Welcome ${interaction.user.toString()}!`,
      embeds: [welcomeEmbed],
      components: [row]
    });
    
    await welcomeMsg.pin();
    
    const messages = await channel.messages.fetch({ limit: 1 });
    const systemPinMsg = messages.first();
    if (systemPinMsg?.system) {
      await systemPinMsg.delete();
    }

    await interaction.editReply({ content: `Ticket created! ${channel}` });
  } catch (error) {
    console.error('Error in handleTicketCreate:', error);
    await interaction.editReply({ content: 'An error occurred while creating the ticket. Please try again later.' });
  }
}

export async function handleCloseCommand(interaction) {
  try {
    await interaction.deferReply();
    
    const { data: ticket, error } = await database.getTicket(interaction.channel.id);

    if (error) {
      console.error('Error fetching ticket:', error);
      return await interaction.editReply({ content: 'Failed to fetch ticket information. Please try again later.' });
    }

    if (!ticket) {
      return await interaction.editReply({ content: 'This is not an open ticket!' });
    }

    try {
      const transcript = await createTranscript(interaction.channel, {
        limit: -1,
        fileName: `transcript-${interaction.channel.name}.html`,
        poweredBy: false,
        saveImages: true,
        footerText: `Transcript for ticket ${interaction.channel.name}`,
        returnBuffer: false,
        minify: true
      });

      const ticketCreator = await interaction.client.users.fetch(ticket.user_id);
      if (ticketCreator) {
        const transcriptEmbed = new EmbedBuilder()
          .setTitle('📜 Ticket Transcript')
          .setDescription(`Your ticket in ${interaction.channel.name} has been closed.`)
          .addFields(
            { name: 'Category', value: ticket.category, inline: true },
            { name: 'Closed By', value: interaction.user.toString(), inline: true },
            { name: 'Created At', value: `<t:${Math.floor(new Date(ticket.created_at).getTime() / 1000)}:R>`, inline: true }
          )
          .setColor('#ff0000')
          .setTimestamp();

        try {
          await ticketCreator.send({
            embeds: [transcriptEmbed],
            files: [transcript]
          });
        } catch (dmError) {
          console.error('Error sending transcript to user:', dmError);
          await interaction.channel.send('Could not send transcript to user - they may have DMs disabled.');
        }
      }

      const { error: closeError } = await database.closeTicket(interaction.channel.id);
      if (closeError) {
        console.error('Error closing ticket:', closeError);
        return await interaction.editReply({ content: 'Failed to close ticket. Please try again later.' });
      }

      const closingEmbed = new EmbedBuilder()
        .setTitle('🔒 Ticket Closing')
        .setDescription('This ticket will be closed in 5 seconds...')
        .setColor('#ff0000')
        .setTimestamp();

      await interaction.editReply({ embeds: [closingEmbed] });
      setTimeout(() => interaction.channel.delete(), 5000);
    } catch (transcriptError) {
      console.error('Error generating transcript:', transcriptError);
      await interaction.editReply({ content: 'Failed to generate transcript, but ticket will be closed.' });
      
      const { error: closeError } = await database.closeTicket(interaction.channel.id);
      if (closeError) {
        console.error('Error closing ticket:', closeError);
        return await interaction.editReply({ content: 'Failed to close ticket. Please try again later.' });
      }
      
      setTimeout(() => interaction.channel.delete(), 5000);
    }
  } catch (error) {
    console.error('Error in handleCloseCommand:', error);
    await interaction.editReply({ content: 'An error occurred while closing the ticket. Please try again later.' });
  }
}

export async function handleTransferCommand(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return await interaction.editReply({
        content: 'You do not have permission to transfer tickets.',
        ephemeral: true
      });
    }
    
    const categoryId = interaction.options.getString('category');
    const currentCategory = interaction.channel.parentId;

    if (categoryId === currentCategory) {
      return await interaction.editReply({
        content: 'This ticket is already in that category!',
        ephemeral: true
      });
    }
    
    const newCategory = await interaction.guild.channels.fetch(categoryId);
    
    if (!newCategory) {
      return await interaction.editReply({
        content: 'Invalid category selected.',
        ephemeral: true
      });
    }
    
    const { data: ticket } = await database.getTicket(interaction.channel.id);
    if (!ticket) {
      return await interaction.editReply({
        content: 'This command can only be used in ticket channels.',
        ephemeral: true
      });
    }
    
    await interaction.channel.setParent(categoryId, {
      lockPermissions: false
    });
    
    const transferEmbed = new EmbedBuilder()
      .setTitle('🔄 Ticket Transferred')
      .setDescription(`This ticket has been transferred to ${newCategory.name}`)
      .addFields(
        { name: 'Transferred By', value: interaction.user.toString(), inline: true },
        { name: 'New Category', value: newCategory.name, inline: true }
      )
      .setColor('#0099ff')
      .setTimestamp();
    
    await interaction.editReply({
      embeds: [transferEmbed],
      ephemeral: false
    });
  } catch (error) {
    console.error('Error in handleTransferCommand:', error);
    await interaction.editReply({
      content: 'An error occurred while transferring the ticket.',
      ephemeral: true
    });
  }
}

export async function handleRenameCommand(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const newName = interaction.options.getString('name');
    
    if (newName.length > 90) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('The ticket name must be less than 90 characters.')
        .setColor('#ff0000')
        .setTimestamp();

      return await interaction.editReply({
        embeds: [errorEmbed]
      });
    }
    
    const formattedName = `ticket-${newName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
    
    try {
      await interaction.channel.setName(formattedName);
      
      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Ticket Renamed')
        .setDescription(`This ticket has been renamed to \`${formattedName}\``)
        .setColor('#00ff00')
        .setTimestamp();

      await interaction.editReply({
        embeds: [successEmbed]
      });
    } catch (error) {
      console.error('Error renaming channel:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('Failed to rename the ticket. Please try again later.')
        .setColor('#ff0000')
        .setTimestamp();

      await interaction.editReply({
        embeds: [errorEmbed]
      });
    }
  } catch (error) {
    console.error('Error in handleRenameCommand:', error);
    
    const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('An error occurred while renaming the ticket.')
        .setColor('#ff0000')
        .setTimestamp();

    await interaction.editReply({
      embeds: [errorEmbed]
    });
  }
}