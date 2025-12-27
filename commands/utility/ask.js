const { GoogleGenAI } = require("@google/genai");
const { SlashCommandBuilder } = require("discord.js");
const { geminiApiKey } = require("../../config.json");

if (!geminiApiKey) {
	console.error(
		"GEMINI_API_KEY is missing in config.json. Set it to your Gemini API key or configure Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS). See https://cloud.google.com/docs/authentication/getting-started",
	);
}

const ai = new GoogleGenAI({
	apiKey: geminiApiKey,
});

module.exports = {
  	data: new SlashCommandBuilder()
		.setName("ask")
		.setDescription("Ask a question to the AI.")
		.addStringOption((option) =>
			option
				.setName("question")
				.setDescription("The question you want to ask the AI.")
				.setRequired(true),
		),

	async execute(interaction) {
		await interaction.deferReply();
		try {
			const response = await ai.models.generateContent({
				model: "gemini-2.5-flash",
				contents: interaction.options.getString("question"),
			});

			await interaction.editReply(response.text);
		} catch (err) {
			console.error("AI request failed:", err);
			await interaction.editReply(
				"Error: could not contact the AI. Check your GEMINI_API_KEY or Google Cloud credentials.",
			);
		}
	},
};
