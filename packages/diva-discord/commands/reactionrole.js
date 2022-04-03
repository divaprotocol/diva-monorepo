/*
module.exports = {
    name: 'reactionrole',
    description: "Register users for DIVA testnet!",
    async execute(message, Discord, client) {
        const channel = '957700678254493776';
        const testerRole = message.guild.roles.cache.find(role => role.name === "OG-Tester");
 
        const joinEmoji = '🐋';
 
        let embed1 = new Discord.MessageEmbed()
            .setColor('#e42643')
            .setTitle('Become an OG-Tester!')
            .setDescription('Click the ' + `${joinEmoji} to register for DIVA testnet`);
 
        let messageEmbed = await message.channel.send({ embeds: [embed1] })
        messageEmbed.react(joinEmoji);
 
        client.on('messageReactionAdd', async (reaction, user) => {
            if (reaction.message.partial) await reaction.message.fetch();
            if (reaction.partial) await reaction.fetch();
            if (user.bot) return;
            if (!reaction.message.guild) return;
 
            if (reaction.message.channel.id == channel) {
                if (reaction.emoji.name === joinEmoji) {
                    await reaction.message.guild.members.cache.get(user.id).roles.add(testerRole);
                    await user.send("To receive testnet tokens please set your wallet address with ***!setwallet 0xa...766***")
                }
            } else {
                return;
            }
        });

    }
}   
*/