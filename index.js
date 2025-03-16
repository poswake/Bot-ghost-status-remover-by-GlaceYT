const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const express = require('express');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Express server setup (optional, for uptime monitoring)
const app = express();
const port = 3000;
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.listen(port, () => {
  console.log('\x1b[36m[ SERVER ]\x1b[0m', `\x1b[32mRunning at http://localhost:${port} ✅\x1b[0m`);
});

// Points storage (JSON-based)
const pointsFile = 'points.json';
let points = {};
if (fs.existsSync(pointsFile)) {
  points = JSON.parse(fs.readFileSync(pointsFile, 'utf8'));
}

// Bot status messages
const statusMessages = ["👀 Watching The Chaos Coalition", "🎊 GLORYY"];
const botStatus = 'dnd';
let currentStatusIndex = 0;

function updateStatus() {
  const currentStatus = statusMessages[currentStatusIndex];
  client.user.setPresence({
    activities: [{ name: currentStatus, type: 3 }], // ActivityType.Watching
    status: botStatus,
  });
  console.log('\x1b[33m[ STATUS ]\x1b[0m', `Updated status to: ${currentStatus} (${botStatus})`);
  currentStatusIndex = (currentStatusIndex + 1) % statusMessages.length;
}

// Command handler
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(' ');
  const command = args[0].toLowerCase();

  if (command === ':pointsmanage' && args.length === 3) {
    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('❌ Please mention a valid user.');
    }

    const operation = args[2][0]; // + or -
    const amount = parseInt(args[2].slice(1));

    if (!['+', '-'].includes(operation) || isNaN(amount)) {
      return message.reply('❌ Invalid format! Use `:pointsmanage @user +10` or `:pointsmanage @user -5`.');
    }

    const userId = user.id;
    if (!points[userId]) points[userId] = 0;

    points[userId] = operation === '+' ? points[userId] + amount : points[userId] - amount;

    fs.writeFileSync(pointsFile, JSON.stringify(points, null, 2));

    return message.reply(`✅ Updated points for **${user.username}**: **${points[userId]}** points.`);
  }

  if (command === ':pointsview' && args.length === 2) {
    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('❌ Please mention a valid user.');
    }

    const userPoints = points[user.id] || 0;
    return message.reply(`📊 **${user.username}** has **${userPoints}** points.`);
  }
});

// Bot ready event
client.once('ready', async () => {
  await new Promise(resolve => setTimeout(resolve, 2000)); // Small delay to ensure stability
  console.log('\x1b[36m[ INFO ]\x1b[0m', `\x1b[34mPing: ${client.ws.ping} ms \x1b[0m`);
  updateStatus();
  setInterval(updateStatus, 10000);
});

async function login() {
  try {
    await client.login(process.env.TOKEN);
    console.log('\x1b[36m[ LOGIN ]\x1b[0m', `\x1b[32mLogged in as: ${client.user.tag} ✅\x1b[0m`);
  } catch (error) {
    console.error('\x1b[31m[ ERROR ]\x1b[0m', 'Failed to log in:', error);
    process.exit(1);
  }
}

login();
