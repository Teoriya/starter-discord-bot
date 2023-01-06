const modmail = require('../models/modmail.model');

module.exports = {
    // Create a new modmail
createModmail: async ( {guildId, channelId, userId, threadId, typeOfTicket, status, handledBy, dmMessageId}) => {
        const newModmail = new modmail({
            guildId,
            channelId,
            userId,
            threadId,
            typeOfTicket,
            status,
            handledBy,
            dmMessageId
        });
        await newModmail.save();
    },
    // Get all modmails
    getAllModmails: async () => {
        return await modmail.find();
    },

    // Get modmail by user ID
    getModmailByUserId: async (userId) => {
        return await modmail.findOne({ userId: userId});
    },
    //get modmails by user ID
    getModmailsByUserId: async (userId) => {
        return await modmail.find({ userId: userId });
    },
    // Get modmail by channel ID
    getModmailByChannelId: async (channelId) => {
        return await modmail.findOne({ channelId: channelId });
    },
    // Get all modmails by guild ID
    getModmailsByGuildId: async (guildId) => {
        return await modmail.find({ guildId: guildId });
    },
    // Update or create modmail by user ID 
    updateModmailByUserId: async (userId, guildId, channelId, threadId, typeOfTicket, status, handledBy,dmMessageId) => {
        await modmail.findOneAndUpdate({ userId: userId }, {
            guildId,
            channelId,
            userId,
            threadId,
            typeOfTicket,
            status,
            handledBy,
            dmMessageId
        },{upsert:true});
    },
    //close modmail by channel ID
    closeModmail: async (channelId) => {
        await modmail.findOneAndUpdate({ channelId: channelId }, { status: "closed" });
    },

    //claim modmail by channel ID
    claimModmail: async (channelId, handledBy) => {
        await modmail.findOneAndUpdate({ channelId: channelId }, { $push:{handledBy} });
    },
    // Get OPEN modmails by user ID
    getOpenModmailByUserId: async (userId) => {
        return await modmail.findOne({ userId: userId, status: "open" });
    },
    getAllOpenModmails: async () => {
        return await modmail.find({status: "open" });
    },
}