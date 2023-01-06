const client = require("..");
const modmailFirstResponseTime = 1000 * 60 * 60 ; 


const customEmbeds = require('../embeds.json');//importinmg embeds from embeds.json


const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const modmailService = require("../services/modmailService");
const modmailUtils = require("../utils/modmailUtils");

modmailService.getAllOpenModmails().then(async (modmails) => {
  const archiveChannel = await client.channels.fetch(
    process.env.ARCHIVE_CHANNEL
  );
  for (const modmail of modmails) {
    const guild = await client.guilds.fetch(modmail.guildId);
    const member = await guild.members.fetch(modmail.userId);
    if (!member) continue;
    const channel = await client.channels.fetch(modmail.channelId);
    if (!channel) continue;
    const thread = await client.channels.fetch(modmail.threadId);
    if (!thread) continue;
    const dmChannel = await member.createDM();
    const message = await dmChannel.messages.fetch(modmail.dmMessageId);
    if (!message) continue;
    let mainChannelMessage = await channel.messages.fetchPinned()
    mainChannelMessage = mainChannelMessage.first()
    modmailUtils.modmailListner(
      mainChannelMessage,
      message,
      channel,
      archiveChannel,
      thread,
      handledBy=modmail.handledBy
    );
  }
});

// const allowed = ["797720627049660437","318465045422145536"]
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  // if (!allowed.includes(message.author.id)) return;
  if (message.channel.type==1) {
    //DM
    const existing = await modmailService.getOpenModmailByUserId(
      message.author.id
    );
    if (existing) return;
    


    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`modmail-${message.author.id}-general`)
        .setLabel("General Query")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("❔"),
      new ButtonBuilder()
        .setCustomId(`modmail-${message.author.id}-vccomplaint`)
        .setLabel("VC Issue")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:voice:1060695572715147325>"),
        new ButtonBuilder()
        .setCustomId(`modmail-${message.author.id}-textcomplaint`)
        .setLabel("Text Channel Issue")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("<:ChannelText:1060695673818845285>"),
      
    );

    const response = await message.channel.send({
      embeds: customEmbeds.modmailembedsmain,
      components: [row],
    });

    const filter = (interaction) =>
      interaction.customId.startsWith("modmail") &&
      interaction.user.id === message.author.id;
    const collector = response.createMessageComponentCollector({
      filter,
      time: modmailFirstResponseTime,
      max: 1,
    });
    collector.on("end", async (collected, reason) => {
      if (reason === "time")
        response.edit({
          content: "You did not select any option in time.",
          components: [],
          embeds: [],
        });
      else if (reason === "limit") {
        collected.first().deferUpdate();
        response.edit({
          content: "",
          components: [],
          embeds: customEmbeds.modmailreplyedit,
        });
        const modmailReason = collected.first().customId.split("-")[2];
        //mesage and client
        // console.log(modmailUtils)
        modmailUtils.startModmail(message, modmailReason);
      }
    });
  }
});

module.exports = { name: "messageCreate" };
