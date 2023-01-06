const { model, Schema } = require('mongoose');

const modmailModel = Schema({
    guildId:{type:String, required:true},
    channelId:{type:String},
    userId:{type:String, required:true},
    threadId:{type:String, required:true},
    typeOfTicket:{type:String, enum:["bug", "suggestion", "vccomplaint","textcomplaint","other","general"], required:true},
    status:{type:String, enum:["open", "closed"], default:"open"},
    handledBy:[String],
    dmMessageId:{type:String,required:true}
},{
    timestamps:true
});

module.exports = model('modmails', modmailModel);