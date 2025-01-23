import { PermissionFlagsBits } from 'discord.js';
import twilio from 'twilio';
import config from '../config.js';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

export async function handleSmsCommand(interaction) {
  try {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ 
        content: 'You do not have permission to use this command.',
        ephemeral: true 
      });
    }

    const message = interaction.options.getString('message');
    await interaction.deferReply({ ephemeral: true });

    const twilioMessage = await client.messages.create({
      body: message,
      from: config.twilio.fromNumber,
      to: config.twilio.toNumber
    });

    await interaction.editReply({
      content: `Message sent successfully! SID: ${twilioMessage.sid}`,
      ephemeral: true
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    await interaction.editReply({
      content: 'Failed to send SMS message. Please try again later.',
      ephemeral: true
    });
  }
}