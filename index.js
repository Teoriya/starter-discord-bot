const { Client } = require("discord.js");
require('dotenv').config();
const token = process.env.DISCORD_TOKEN;
const dbURL = process.env.DBURL;

const mongoose = require("mongoose");
mongoose.set('strictQuery', false);
mongoose.connect(dbURL, {}).then(console.log('Connected to mongodb!'))

const client = new Client({
  intents: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536],//console.log({GatewayIntentBits}) -- GatewayIntentBits
  partials: [0, 1, 2, 3, 4, 5, 6],//console.log({Partials});, -- Partials
});

client.once('ready', async() => {
  console.log('Ready!');
  require('./handlers');
});

client.login(token);

module.exports = client;