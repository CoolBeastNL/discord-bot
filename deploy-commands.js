require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

// Maak de slash command aan
const commands = [
  new SlashCommandBuilder()
    .setName("voorraad")
    .setDescription("Bekijk de voorraad")
].map(command => command.toJSON());

// Maak verbinding met Discord API
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🚀 Slash commands worden geregistreerd...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Slash commands geregistreerd!");
  } catch (error) {
    console.error("❌ Fout bij registreren:", error);
  }
})();
