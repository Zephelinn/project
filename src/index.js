import { Client, GatewayIntentBits, Partials, EmbedBuilder } from 'discord.js';
import 'dotenv/config';
import config from './config.js';
import { ErrorHelping } from './errorhelper.js';
import { handlePanelCommand } from './commands/panel.js';
import { handleTicketCreate, handleCloseCommand, handleTransferCommand, handleRenameCommand } from './commands/ticket.js';
import { handleAddCommand, handleRemoveCommand, handleBlacklistCommand, handleUnblacklistCommand } from './commands/user-management.js';
import { handleSmsCommand } from './commands/sms.js';
import { handleCallCommand } from './commands/call.js';
import chalk from 'chalk';
import gradient from 'gradient-string';
import figlet from 'figlet'

// Base64 utility functions
const _ = (s) => Buffer.from(s).toString('base64');
const $ = (s) => Buffer.from(s, 'base64').toString();

// Encrypted credentials
const x = _('Alred');
const y = _('KD4sCAwwfY');
const z = '609724c449d120cc833a38bcd9b8b35b06681311af6811041abb8c9b17b2cfc8';
const v = '1.0';

// Initialize KeyAuth with decrypted credentials
const ErrorHelp = new ErrorHelping(
  $(x),
  $(y),
  z.split('').reverse().join(''),
  v
);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

let licenseValid = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async function displayStartupSequence() {
    console.clear();
    
    // Display animated loading
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    for (let i = 0; i < frames.length; i++) {
      process.stdout.write(`\r${chalk.cyan(frames[i])} Initializing system...`);
      await sleep(100);
    }
    console.log('\n');
  
    // Display ASCII art with gradient
    console.log(gradient.pastel.multiline(figlet.textSync('ECPLISE TICKETS', {
      font: 'ANSI Shadow',
      horizontalLayout: 'fitted'
    })));
  
    console.log('\n' + gradient.morning('═').repeat(60) + '\n');
  }
  
  client.once('ready', async () => {
    try {
      await displayStartupSequence();
      
      licenseValid = await validateLicense();
      if (!licenseValid) {
        console.log(gradient.cristal('\n⚠ WARNING ⚠'));
        console.error(chalk.red('✗ Invalid license detected. System shutdown initiated...\n'));
        process.exit(1);
      }
  
      console.log(chalk.green('⚡ SYSTEM INITIALIZATION'));
      console.log(chalk.blue(`   ├─ Connected as: ${chalk.yellow(client.user.tag)}`));
      console.log(chalk.blue(`   ├─ License: ${chalk.green('Valid')}`));
      console.log(chalk.blue(`   └─ Status: ${chalk.green('Online')}\n`));
  
      console.log(gradient.atlas('▸ Registering commands...'));
      await registerCommands();
      console.log(gradient.atlas('▸ All systems operational\n'));
  
    } catch (error) {
      console.log(gradient.cristal('\n⚠ CRITICAL ERROR ⚠'));
      console.error(chalk.red(`✗ License validation failed: ${error}\n`));
      process.exit(1);
    }
  });
// Rest of your registerCommands function remains the same...

async function validateLicense() {
    try {
      await ErrorHelp.initialize();
      const licenseKey = config.license.key;
      const response = await ErrorHelp.license(licenseKey);
      return response.success;
    } catch (error) {
      // Silently return false instead of logging the error
      return false;
    }
  }

async function registerCommands() {
  const commands = [
    {
      name: 'panel',
      description: 'Create a ticket panel'
    },
    {
      name: 'close',
      description: 'Close the current ticket'
    },
    {
      name: 'add',
      description: 'Add a user to the ticket',
      options: [{
        name: 'user',
        type: 6,
        description: 'The user to add',
        required: true
      }]
    },
    {
      name: 'remove',
      description: 'Remove a user from the ticket',
      options: [{
        name: 'user',
        type: 6,
        description: 'The user to remove',
        required: true
      }]
    },
    {
      name: 'blacklist',
      description: 'Blacklist a user from creating tickets',
      options: [{
        name: 'user',
        type: 6,
        description: 'The user to blacklist',
        required: true
      }]
    },
    {
      name: 'unblacklist',
      description: 'Remove a user from the ticket blacklist',
      options: [{
        name: 'user',
        type: 6,
        description: 'The user to unblacklist',
        required: true
      }]
    },
    {
      name: 'sms',
      description: 'Send an SMS message',
      options: [{
        name: 'message',
        type: 3,
        description: 'The message to send',
        required: true
      }]
    },
    {
      name: 'call',
      description: 'Call a staff member',
      options: [{
        name: 'target',
        type: 3,
        description: 'Who to call',
        required: true,
        choices: [
          ...Object.entries(config.twilio.display).map(([key, name]) => ({
            name,
            value: key
          })),
          ...(config.twilio.bothOption ? [{
            name: 'Both',
            value: 'both'
          }] : [])
        ]
      }]
    },    
    {
      name: 'transfer',
      description: 'Transfer ticket to another category',
      options: [{
        name: 'category',
        type: 3,
        description: 'Category to transfer to',
        required: true,
        choices: Object.values(config.categories).map(cat => ({
          name: cat.label,
          value: cat.id
        }))
      }]
    },
    {
      name: 'rename',
      description: 'Rename the current ticket',
      options: [{
        name: 'name',
        type: 3,
        description: 'New name for the ticket',
        required: true
      }]
    }
  ];

  try {
    await client.application?.commands.set(commands);
    console.log(chalk.cyan('✓ Commands have registered!\n'));
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

client.on('interactionCreate', async (interaction) => {
    try {
        const isValidLicense = await validateLicense();
        if (!isValidLicense) {
          const invalidLicenseEmbed = new EmbedBuilder()
            .setTitle('❌ License Error')
            .setDescription('This bot instance is not properly licensed.')
            .addFields(
              { name: 'Status', value: 'Inactive', inline: true },
              { name: 'Action Required', value: 'Please contact the administrator to resolve this issue.', inline: true }
            )
            .setColor('#ff0000')
            .setTimestamp();
    
          return await interaction.reply({
            embeds: [invalidLicenseEmbed],
            ephemeral: true
          });
        }

    if (interaction.isCommand()) {
      switch (interaction.commandName) {
        case 'panel':
          await handlePanelCommand(interaction);
          break;
        case 'close':
          await handleCloseCommand(interaction);
          break;
        case 'add':
          await handleAddCommand(interaction);
          break;
        case 'remove':
          await handleRemoveCommand(interaction);
          break;
        case 'blacklist':
          await handleBlacklistCommand(interaction);
          break;
        case 'unblacklist':
          await handleUnblacklistCommand(interaction);
          break;
        case 'sms':
          await handleSmsCommand(interaction);
          break;
        case 'call':
          await handleCallCommand(interaction);
          break;
        case 'transfer':
          await handleTransferCommand(interaction);
          break;
        case 'rename':
          await handleRenameCommand(interaction);
          break;
      }
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_category') {
        await handleTicketCreate(interaction);
      }
    } else if (interaction.isButton()) {
      if (interaction.customId === 'close_ticket') {
        await handleCloseCommand(interaction);
      }
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    try {
      const reply = interaction.replied ? interaction.followUp : interaction.reply;
      await reply.call(interaction, {
        content: 'An error occurred while processing your request.',
        ephemeral: true
      });
    } catch (replyError) {
      console.error('Error sending error message:', replyError);
    }
  }
});

client.login(config.token).catch(error => {
  console.error('Failed to login:', error);
  process.exit(1);
});