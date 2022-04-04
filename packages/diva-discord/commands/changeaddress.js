module.exports = {
    name: 'changeaddress',
    async execute(interaction, dbRegisteredUsers, ) {
        console.log(`Function changeaddress called by ${interaction.user?.tag}`)
        //check is user is already registered
        if (dbRegisteredUsers.get(interaction.user?.id) == null) {
            interaction.reply({
                content:  `Your discord account is not yet registered. \n `
                            +`Register with **/register ADDRESS**`,
                ephemeral: true,
            })
            return
        }

        //get user input for 'address'
        const address = interaction.options.getString('address')

        //check if wallet is valid
        if (!ethers.utils.isAddress(address))  {
            interaction.reply({
                content:  `The entered wallet address is not a valid Ethereum wallet. \n`
                            +`Please check your address input`,
                ephemeral: true,
            })
            return
        }
        dbRegisteredUsers.set(interaction.user?.id, address, 'address')

        interaction.reply({
            content:  `Your registered wallet address has been changed to **${address}**`,
            ephemeral: true,
        })

    }
}