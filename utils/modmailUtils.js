const modmailService = require("../services/modmailService");
const client = require("..");

const customEmbeds = require("../embeds.json"); //importinmg embeds from embeds.json

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const attachmentsAndStickersParser = (message) => {
  attachments = message.attachments.map((attachment) => attachment.url);
  stickers = message.stickers.map((sticker) => sticker.url);
  attachmentsString =
    attachments.length > 0 ? "\nAttachments:" + attachments.join("\t") : "";
  stickersString =
    stickers.length > 0 ? "\nStickers:" + stickers.join("\t") : "";
  content = message.cleanContent + attachmentsString + stickersString;
  return content;
};

const intializeListners = async (
  mainChannelMessage,
  message,
  channel,
  archiveChannel,
  thread,
  handledBy
) => {
  const modmailInteractionCollector =
    mainChannelMessage.createMessageComponentCollector({
      filter: (interaction) => interaction.customId.startsWith("modmail"),
    });
  const msgCollector = await message.channel.createMessageCollector({
    filter: (m) => m.author.id === message.author.id,
  });
  const channelMsgCollector = await channel.createMessageCollector();
  const webhookMain = await channel.createWebhook({
    avatar: message.author.displayAvatarURL(),
    name: message.author.username,
  });
  let webhookThread;
  try {
    const webhooks = await archiveChannel.fetchWebhooks();
    const webhook = webhooks.find((wh) => wh.token);

    if (!webhook) {
      webhookThread = await archiveChannel.createWebhook({
        avatar: message.author.displayAvatarURL(),
        name: message.author.username,
      });
    } else {
      webhookThread = webhook;
    }
  } catch (error) {
    console.error("webhook error", error);
  }

  msgCollector.on("collect", async (msg) => {
    if (msg.author.bot) return;
    try {
      const parsedContent = attachmentsAndStickersParser(msg);
      await webhookThread.send({
        threadId: thread.id,
        content: parsedContent,
        username: msg.author.username,
        avatarURL: msg.author.displayAvatarURL(),
        flags: 4,
      });
      await webhookMain.send({
        content: parsedContent,
      });
      msg.react("✅");
    } catch (error) {
      console.error(error);
    }
  });

  channelMsgCollector.on("collect", async (msg) => {
    if (msg.author.bot) return;
    const parsedContent = attachmentsAndStickersParser(msg);
    await webhookThread.send({
      threadId: thread.id,
      content: parsedContent,
      username:
        msg.author.username +
        `(${
          handledBy.includes(msg.member.id)
            ? msg.member.roles.highest.name
            : msg.member.roles.highest.name + " Unclaimed"
        })`,
      avatarURL: msg.author.displayAvatarURL(),
      flags: 4,
    });
    if (handledBy.includes(msg.author.id) && !msg.content.startsWith("!")) {
      try {
        message.channel.send({
          content: `Support : ` + parsedContent,
        });
        msg.react("✅");
      } catch (error) {
        console.error(error);
      }
    }
  });

  // response.edit({ content: 'Ty for opening a ticket', components: [], embeds: [] }); // isko main driver code me dalo
  //another collector for messages to user
  modmailInteractionCollector.on("collect", async (interaction) => {
    if (interaction.customId.endsWith("close")) {
      if (!handledBy.includes(interaction.user.id)) {
        await interaction.reply({
          content: "",
          embeds: [
            {
              fields: [],
              description:
                "You cannot close this Modmail ●  **First claim the ticket**",
              color: 15548997,
            },
          ],
          ephemeral: true,
        });
        return;
      }
      await modmailService.closeModmail(channel.id);
      interaction.deferUpdate();
      await channel.send({
        content: `` ,
        embeds: [{
          "fields": [],
          "description": `This Modmail has been closed by <@${interaction.user.id}>.`,
          "color": 15548997
      }],
      });
      await thread.send({
        content: `This modmail has been closed by ${interaction.user.username}.`,
      });
      await message.reply({ embeds: customEmbeds.modmailclosed });
      await channel.delete();
      msgCollector.stop();
      channelMsgCollector.stop();
    } else if (interaction.customId.endsWith("claim")) {
      if (handledBy.includes(interaction.user.id)) {
        interaction.reply({
          content: "",
          embeds: [
            {
              "fields": [],
              "description": "You have already claimed this Modmail ",
              "color": 5793266
          }
          ],
          ephemeral: true,
        });
        return;
      }
      await modmailService.claimModmail(channel.id, interaction.user.id);
      await channel.send({
        content: ``,
        embeds: [
          {
            fields: [],
            description: `This modmail has been claimed by <@${interaction.user.id}>`,
            color: 5763719,
          },
        ],
      });
      await thread.send({
        content: ``,
        embeds: [
          {
            fields: [],
            description: `This modmail has been claimed by <@${interaction.user.id}>`,
            color: 5763719,
          },
        ],
      });
      handledBy.push(interaction.user.id);
      interaction.deferUpdate();
    }
  });
};

module.exports = {
  startModmail: async (message, modmailReason) => {
    const archiveChannel = await client.channels.fetch(
      process.env.ARCHIVE_CHANNEL
    ); // STATIC CHANNEL ID
    let existing = await modmailService.getModmailByUserId(message.author.id);
    let thread;
    if (!existing) {
      newArchive = await archiveChannel.send(
        message.author.id + " - " + message.author.tag
      );
      thread = await newArchive.startThread({
        name: message.author.id,
        autoArchiveDuration: 60,
        reason: `modmail of new user ${message.author.tag}`,
      });
    } else {
      thread = await archiveChannel.threads.fetch(existing.threadId);
    }
    let channel = await archiveChannel.guild.channels.create({
      name: `${message.author.username}-${message.author.id}`,
      type: 0,
      parent: archiveChannel.parent.id,
      topic: `Modmail of ${message.author.tag}`,
      reason: `Modmail of ${message.author.tag}`,
    });
    await modmailService.createModmail({
      guildId: archiveChannel.guild.id,
      dmMessageId: message.id,
      channelId: channel.id,
      userId: message.author.id,
      threadId: thread.id,
      typeOfTicket: modmailReason,
      status: "open",
      handledBy: [],
    });
    //send a message in channel + bhasudi
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`modmail-${channel.id}-close`)
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`modmail-${channel.id}-claim`)
        .setLabel("Claim")
        .setStyle(ButtonStyle.Success)
    ); //to be improved

    let pinn;

    if (modmailReason === "vccomplaint") {
      let vcMembers = "";
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`modmail-${channel.id}-close`)
          .setLabel("Close")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`modmail-${channel.id}-claim`)
          .setLabel("Claim")
          .setStyle(ButtonStyle.Success)
      ); //to be improved

      const member = await archiveChannel.guild.members.fetch(
        message.author.id
      );
      const userVc = member.voice.channel;
      if (!userVc) {
        vcMembers = "User is not in a VC";
      } else {
        vcMembers = "Members in VC: \n";
        member.voice.channel.members.forEach(async (member) => {
          vcMembers += `${member.user.username}#${member.user.discriminator} - <@${member.id}> -${member.id}\n`;
        });
      }

      const mainChannelEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`${message.author.username} has a VC Issue`)
        .setDescription(vcMembers)
        .setTimestamp()
        .addFields({ name: "VC", value: `<#${userVc ? userVc.id : 123}>` });

      pinn = await channel.send({
        content: `${message.author.username} created a new modmail.`,
        components: [row],
        embeds: [mainChannelEmbed],
      });
    } else {
      pinn = await channel.send({
        embeds: [
          {
            fields: [],
            title: `${message.author.username} created a new Support Ticket`,
            description: "**Type **: " + modmailReason,
            color: 3092790,
          },
        ],
        components: [row],
      });
    }
    pinn.pin();
    pinn.reply({
      content: message.content,
      attachments: message.attachments,
      embeds: message.embeds,
      stickers: message.stickers,
    });

    thread
      .send({
        content: `${message.author.username} created as new modmail.`,
      })
      .then((msg) => {
        msg.reply({
          content: message.content,
          attachments: message.attachments,
          embeds: message.embeds,
          stickers: message.stickers,
        });
      });

    thread.send({
      content: message.content,
      attachments: message.attachments,
      embeds: message.embeds,
      stickers: message.stickers,
    });
    await intializeListners(
      (mainChannelMessage = pinn),
      (message = message),
      (channel = channel),
      archiveChannel,
      thread,
      (handledBy = [])
    );
    // message.reply({ embeds: customEmbeds.modmailfirstreply });
  },

  modmailListner: async (
    mainChannelMessage,
    message,
    channel,
    archiveChannel,
    thread,
    handledBy
  ) => {
    intializeListners(
      mainChannelMessage,
      message,
      channel,
      archiveChannel,
      thread,
      handledBy
    );
  },
};
