const client = require("..");

botOwner = process.env.BOT_OWNER;

client.on("messageCreate", async (message) => {
    // console.log(message.attachments.toJSON())
    if (message.author.id != botOwner || true) return;
    message.channel.send(
        {
            "content": null,
            "embeds": [
              {
                "title": "Support Ticket Created",
                "description": "What’s up!\n\nWe just wanted to confirm that we’ve received your message. Our support team will tackle your request as soon as they can get to it. We appreciate your patience.\n\nCheers!\nAmong Us India Staff Team",
                "color": 3092790,
                "footer": {
                  "text": "•  A ✔ corresponds to our Support Team receiving your message."
                }
              }
            ],
            "attachments": []
          }
    );
});