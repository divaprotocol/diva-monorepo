module.exports = {
    name: 'address',
    async execute(interaction, dbRegisteredUsers, ) {
        console.log(`Function address called by ${interaction.user?.tag}`)
        if (dbRegisteredUsers.get(interaction.user?.id) == null) {
            interaction.reply({
                content:  `Your discord account is not registered \n`
                            +`To register use **/register ADDRESS**`,
                ephemeral: true,
            })
        } else {
            interaction.reply({
                content:  `Your discord account is registered with address \n`
                            +`**${dbRegisteredUsers.get(interaction.user?.id, "address")}**`,
                ephemeral: true,
            })
        }

    }
}