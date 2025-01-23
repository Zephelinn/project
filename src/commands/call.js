import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import twilio from 'twilio';
import config from '../config.js';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);
const cooldowns = new Map();

export async function handleCallCommand(interaction) {
  try {
    if (!config.twilio.enabled) {
      const disabledEmbed = new EmbedBuilder()
        .setTitle('❌ Call System Disabled')
        .setDescription('The call system is currently disabled.')
        .setColor('#ff0000')
        .setTimestamp();
      return await interaction.reply({ embeds: [disabledEmbed], ephemeral: true });
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({ content: 'You do not have permission to use this command.' });
    }

    const now = Date.now();
    const lastCallTime = cooldowns.get(interaction.user.id);
    if (lastCallTime && now - lastCallTime < config.twilio.cooldown) {
      const remainingTime = Math.ceil((config.twilio.cooldown - (now - lastCallTime)) / 1000);
      return await interaction.reply({ content: `Please wait ${remainingTime} seconds before making another call.` });
    }

    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getString('target');
    if (!target) {
      return await interaction.editReply({ content: 'Please specify who to call.' });
    }

    let selectedStaff = target;
    let phoneNumber;

    if (target === 'both') {
      const staff = ['anthony', 'jamie'];
      selectedStaff = staff[Math.floor(Math.random() * staff.length)];
    }

    phoneNumber = config.twilio.numbers[selectedStaff];
    if (!phoneNumber) {
      return await interaction.editReply({ content: 'Invalid staff member selected.' });
    }

    await client.calls.create({
      url: config.twilio.twimlBinUrl,
      to: phoneNumber,
      from: config.twilio.fromNumber
    });

    cooldowns.set(interaction.user.id, now);

    const initiateEmbed = new EmbedBuilder()
      .setTitle('📞 Call Initiated')
      .setDescription(`Calling ${selectedStaff.charAt(0).toUpperCase() + selectedStaff.slice(1)}...`)
      .setFooter({
        text: 'Please wait for a response',
        iconURL: interaction.user.displayAvatarURL()
      })
      .setColor('#00ff00')
      .setTimestamp();

    await interaction.editReply({ embeds: [initiateEmbed] });
  } catch (error) {
    console.error('Error in call command:', error);
    await interaction.editReply({ content: 'Failed to initiate call. Please try again later.' });
  }
}