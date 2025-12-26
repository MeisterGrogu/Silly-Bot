const { SlashCommandBuilder, ChannelType, MessageFlags } = require('discord.js');


const data = new SlashCommandBuilder()
	.setName('echo')
	.setDescription('Replies with your input!')
	.addStringOption((option) => option.setName('input').setDescription('The input to echo back').setRequired(true))
	.addChannelOption((option) => option.setName('channel').setDescription('The channel to echo into').addChannelTypes(ChannelType.GuildText));

module.exports = {
	data: data,
	async execute(interaction) {
		if (interaction.options.getChannel('channel')) {
			const channel = interaction.options.getChannel('channel');
			const input = interaction.options.getString('input');
			await channel.send(interaction.user.displayName + ' sent: ' + input);
			await interaction.reply({ content: `Message was sent to ${channel}.`, flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply(interaction.options.getString('input'));
		}
	},
};
