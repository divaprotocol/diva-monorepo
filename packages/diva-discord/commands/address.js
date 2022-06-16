module.exports = {
    name: 'address',
    async execute(interaction, dbRegisteredUsers, byMessage ) {
        try{
            let userId =""
            let userName = ""
            let replyText = ""

            //users can register by / command or via message. Depending on the way the parameters have to be read 
            // and the reply needs to be send different.
            if (byMessage)  { 
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
        
            console.log(replyText)
            if (byMessage) {
                interaction.reply({
                    content:  replyText,
                    ephemeral: true,
                    })
            } else {
                interaction.reply(replyText)
            }
        }
        catch(e){
            console.log(e)
            return false
        }
    }
}