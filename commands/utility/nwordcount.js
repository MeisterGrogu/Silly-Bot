const { SlashCommandBuilder, ChannelType } = require('discord.js');

// robuster Regex (Groß/Kleinschreibung, leichte Umgehungen)
const NWORD_REGEX = new RegExp('[n-n-N]([e-e-E]|[i-i-I])([g-g-G]{1,2})([e-e-E][r-r-R]|[a-a-A])');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('nwordcount')
		.setDescription('Counts how often the n-word was written.')
		.addUserOption(option =>
			option
				.setName('username')
				.setDescription('Specific user to check')
				.setRequired(false),
		)
		.addChannelOption(option =>
			option
				.setName('channel')
				.setDescription('Specific channel to check')
				.addChannelTypes(ChannelType.GuildText)
				.setRequired(false),
		),

	async execute(interaction) {
		await interaction.deferReply();

		const targetUser = interaction.options.getUser('username');
		const targetChannel = interaction.options.getChannel('channel');

		const channels = targetChannel
			? [targetChannel]
			: Array.from(interaction.guild.channels.cache.values())
				.filter(c => c.type === ChannelType.GuildText);


		let totalCount = 0;
		const perUser = new Map();

		for (const channel of channels) {
			if (
				!channel.viewable ||
				!channel
					.permissionsFor(interaction.client.user)
					?.has(['ViewChannel', 'ReadMessageHistory'])
			) {
				continue;
			}

			let lastId;
			let fetched;

			do {
				await channel.messages.fetch({
					limit: 100,
					before: lastId,
				}).then(messages => {
					fetched = messages;
				});

				for (const message of fetched.values()) {
					if (message.author.bot) continue;
					if (targetUser && message.author.id !== targetUser.id) continue;
					if (!message.content) continue;

					if (NWORD_REGEX.test(message.content)) {
						totalCount++;
						perUser.set(
							message.author.id,
							(perUser.get(message.author.id) || 0) + 1,
						);
					}
				}

				lastId = fetched.last()?.id;
			} while (fetched.size === 100);
		}

		// Anzeige-Name sauber ermitteln
		const displayName = targetUser
			? interaction.guild.members.cache.get(targetUser.id)?.displayName ??
			  targetUser.username
			: 'All users';

		if (totalCount === 0) {
			return interaction.editReply(
				`${displayName} has not used the n-word in the specified scope.`,
			);
		}

		let response = `**${displayName}** used the n-word **${totalCount}** times` + (channels.length === 1 ? ` in the **${channels[0].name}** channel` : '') + '\n';

		if (perUser.size > 1) {
			response += 'Breakdown by user:\n';
			for (const [userId, count] of perUser.entries()) {
				const user = await interaction.client.users.fetch(userId);
				response += `• ${user.tag}: ${count}\n`;
			}
		}
		await interaction.editReply(response);
	},
};
