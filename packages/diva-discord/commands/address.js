const Discord = require('discord.js')

module.exports = {
    name: 'address',
    async execute(interaction, dbRegisteredUsers ) {
        try{
            let userId =""
            let userName = ""
            let replyText = ""

            //users can register by / command or via message. Depending on the way the parameters have to be read 
            // and the reply needs to be send different.
            if (interaction instanceof Discord.Message)  { 
                userId = interaction.author.id
                userName = interaction.author.tag
            } else {
                userId = interaction.user?.id
                userName = interaction.user?.tag
            }

            console.log(`Function address called by ${userName}`)
            if (dbRegisteredUsers.get(userId) == null) {
                replyText = `Your discord account is not registered \n`
                +`To register use **/register ADDRESS**`
            } else {
                replyText =`Your discord account is registered with address \n`
                                +`**${dbRegisteredUsers.get(userId, "address")}**`
            }
        
            console.log(replyText);
            (interaction instanceof Discord.Message) ? 
            await interaction.reply(replyText) :
            await interaction.reply({
                    content:  replyText,
                    ephemeral: true,
                })
        }
        catch(e){
            console.error(e)
            return false
        }
    }
}