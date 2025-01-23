import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import config from '../config.js';
import * as database from '../database.js';

export async function handleAddCommand(interaction) {
  try {
    await interaction.deferReply();
    
    const { data: ticket } = await database.getTicket(interaction.channel.id);
    
    if (!ticket || ticket.user_id !== interaction.user.id) {
      return await interaction.editReply({ 
        content: 'This command can only be used in ticket channels by the ticket creator.',
        ephemeral: true 
      });
    }

    const user = interaction.options.getUser('user');
    if (!user) {
      return await interaction.editReply({ 
        content: 'Please specify a valid user to add.' 
      });
    }

    const member = await interaction.guild.members.fetch(user.id);
    if (member.roles.cache.has(config.roles.staff)) {
      return await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('You cannot add staff members to tickets.')
            .setColor('#ff0000')
        ]
      });
    }

    const hasAccess = interaction.channel.permissionsFor(user).has(PermissionFlagsBits.ViewChannel);
    if (hasAccess) {
      return await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('This user already has access to the ticket.')
            .setColor('#ff0000')
        ]
      });
    }

    await interaction.channel.permissionOverwrites.edit(user, {
      ViewChannel: true,
      SendMessages: true
    });

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('✅ User Added')
          .setDescription(`${user.toString()} has been added to the ticket.`)
          .setColor('#00ff00')
      ]
    });
  } catch (error) {
    console.error('Error in handleAddCommand:', error);
    await interaction.editReply({ content: 'An error occurred while adding the user.' });
  }
}

export async function handleRemoveCommand(interaction) {
  try {
    await interaction.deferReply();
    
    const { data: ticket } = await database.getTicket(interaction.channel.id);
    
    if (!ticket || ticket.user_id !== interaction.user.id) {
      return await interaction.editReply({ 
        content: 'This command can only be used in ticket channels by the ticket creator.',
        ephemeral: true 
      });
    }

    const user = interaction.options.getUser('user');
    if (user.id === ticket.user_id) {
      return await interaction.editReply({ 
        content: 'You cannot remove the ticket creator.',
        ephemeral: true 
      });
    }

    const member = await interaction.guild.members.fetch(user.id);
    if (member.roles.cache.has(config.roles.staff)) {
      return await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('You cannot remove staff members from tickets.')
            .setColor('#ff0000')
        ]
      });
    }

    await interaction.channel.permissionOverwrites.delete(user);
    
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🚫 User Removed')
          .setDescription(`${user.toString()} has been removed from the ticket.`)
          .setColor('#00ff00')
      ]
    });
  } catch (error) {
    console.error('Error in handleRemoveCommand:', error);
    await interaction.editReply({ content: 'An error occurred while removing the user.' });
  }
}

export async function handleBlacklistCommand(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    if (!interaction.member.roles.cache.has(config.roles.staff)) {
      return await interaction.editReply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }
    
    const user = interaction.options.getUser('user');
    const { error } = await database.blacklistUser(user.id, interaction.user.id);
    
    if (error?.code === 'PGRST116') {
      return await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription(`${user.toString()} is already blacklisted.`)
            .setColor('#ff0000')
        ],
        ephemeral: true
      });
    }
    
    if (error) {
      console.error('Error blacklisting user:', error);
      return await interaction.editReply({
        content: 'An error occurred while blacklisting the user.',
        ephemeral: true
      });
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🚫 User Blacklisted')
          .setDescription(`${user.toString()} has been blacklisted from creating tickets.`)
          .setColor('#00ff00')
      ],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in handleBlacklistCommand:', error);
    await interaction.editReply({
      content: 'An error occurred while blacklisting the user.',
      ephemeral: true
    });
  }
}

export async function handleUnblacklistCommand(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    if (!interaction.member.roles.cache.has(config.roles.staff)) {
      return await interaction.editReply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }
    
    const user = interaction.options.getUser('user');
    const { error } = await database.unblacklistUser(user.id);
    
    if (error) {
      console.error('Error unblacklisting user:', error);
      return await interaction.editReply({
        content: 'An error occurred while unblacklisting the user.',
        ephemeral: true
      });
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('✅ User Unblacklisted')
          .setDescription(`${user.toString()} has been removed from the blacklist.`)
          .setColor('#00ff00')
      ],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in handleUnblacklistCommand:', error);
    await interaction.editReply({
      content: 'An error occurred while unblacklisting the user.',
      ephemeral: true
    });
  }
}