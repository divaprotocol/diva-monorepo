const Discord = require('discord.js')

module.exports = {
    name: 'claim-test-assets',
    async execute(interaction, dbRegisteredUsers, byMessage) {
        try{
            let userId =""
            let userName = ""
            let replyText = ""
            let addToSendQueue = false

            //users can register by / command or via message. Depending on the way the parameters have to be read 
            // and the reply needs to be send different.
            if (interaction instanceof Discord.Message)  { 
                userId = interaction.author.id
                userName = interaction.author.tag
            } else {
                userId = interaction.user?.id
                userName = interaction.user?.tag
            }

            console.log(`Function claimtokens called by ${userName}`)

            //check is user is already registered
            // if (dbRegisteredUsers.get(userId) == null) {
            //     replyText = `Your discord account is not yet registered.\n `
            //     +`Register with **/register ADDRESS**`
            // } else {
            //     //next possible claim is 24h after last claim
            //     const timeUntilNewClaim = new Date(dbRegisteredUsers.get(userId, "timestampLastClaim")).getTime() + 24 * 60 * 60 * 1000 - new Date()    
            //     if ( timeUntilNewClaim > 0 ){
            //         replyText = `You can only claim tokens once per 24h.\n `
            //         +`You need to wait ${new Date(timeUntilNewClaim).toISOString().slice(11,19)} before the next claim`
            //     } else {
                    addToSendQueue = true
                    if (interaction instanceof Discord.Interaction) {
                        await interaction.deferReply({ephemeral: true})
                    }
            //     }
            // }

            console.log(replyText);
            if (replyText != ""){
                (interaction instanceof Discord.Message) ? 
                await interaction.reply(replyText) :
                await interaction.reply({
                        content:  replyText,
                        ephemeral: true,
                        })
            }
            return addToSendQueue
            
        } catch (e) {
            console.error(e);
            return false
        } 
    }
}