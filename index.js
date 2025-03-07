require("dotenv").config();

  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

console.log(require("discord.js").version);

// 🔹 Voorraadobject (om de voorraad bij te houden)
let voorraad = {
  "Marijuana": 0,
  "Blue Dream": 0,
  "Lemon Haze": 0
};

const MAX_CAPACITEIT = 13986; // Voorbeeld maximale opslagcapaciteit
let voorraadMessage = null; // Om het voorraadbericht bij te houden

// 🔹 Berekening warehouse capaciteit
function berekenCapaciteit() {
  const totaal = Object.values(voorraad).reduce((a, b) => a + b, 0);
  return ((totaal / MAX_CAPACITEIT) * 100).toFixed(1);
}

// 🔹 Embed functie (voor voorraad)
function createInventoryEmbed() {
  const totaalVoorraad = Object.values(voorraad).reduce((a, b) => a + b, 0);
  return new EmbedBuilder()
    .setTitle("Warehouse Inventory")
    .setColor("#ffff00")
    .addFields(
      { name: "📦 Huidige Voorraad Overzicht", value: "\u200B" },
      { name: "Marijuana", value: `${voorraad["Marijuana"]} stuks`, inline: true },
      { name: "Blue Dream", value: `${voorraad["Blue Dream"]} stuks`, inline: true },
      { name: "Lemon Haze", value: `${voorraad["Lemon Haze"]} stuks`, inline: true },
      { name: "Totale Voorraad", value: `${totaalVoorraad} / ${MAX_CAPACITEIT} stuks`, inline: false },
      { name: "Warehouse Capaciteit", value: `${berekenCapaciteit()}%`, inline: false }
    );
}

// 🔹 Knoppen genereren
function createButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("add").setLabel("Toevoegen").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("remove").setLabel("Verwijderen").setStyle(ButtonStyle.Danger)
  );
}

// 🔹 Event: Bot is klaar
client.once("ready", () => {
  console.log(`✅ Ingelogd als ${client.user.tag}`);
});

// 🔹 Command: Stuur voorraad embed met knoppen
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "voorraad") {
    const embed = createInventoryEmbed();
    const buttons = createButtons();

    // ✅ Oude voorraad embed updaten in plaats van nieuwe sturen
    if (voorraadMessage) {
      await voorraadMessage.edit({ embeds: [embed], components: [buttons] });
      await interaction.reply({ content: "📦 **Voorraad geüpdatet!**", ephemeral: true });
    } else {
      voorraadMessage = await interaction.reply({ embeds: [embed], components: [buttons], fetchReply: true });
    }
  }
});

// 🔹 Event: Knop ingedrukt (toevoegen of verwijderen)
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const addMode = interaction.customId === "add";
  const action = addMode ? "toevoegen" : "verwijderen";

  // 🔹 Modal invoervenster
  const modal = new ModalBuilder()
    .setCustomId(`modal_${addMode ? "add" : "remove"}_${interaction.user.id}`)
    .setTitle(`Voorraad ${action}`);

  const input = new TextInputBuilder()
    .setCustomId("aantal")
    .setLabel("Hoeveel wil je toevoegen/verwijderen?")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));

  await interaction.showModal(modal);
});

// 🔹 Event: Modal input verwerken
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  const [_, mode, userId] = interaction.customId.split("_");
  if (userId !== interaction.user.id) return;

  const addMode = mode === "add";
  const aantal = parseInt(interaction.fields.getTextInputValue("aantal"));

  if (isNaN(aantal) || aantal <= 0) {
    return interaction.reply({ content: "🚨 Ongeldig aantal!", ephemeral: true });
  }

  // 🔹 Dropdown maken om type te kiezen
  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`select_${addMode ? "add" : "remove"}_${aantal}_${interaction.user.id}`)
      .setPlaceholder("Selecteer item")
      .addOptions(
        { label: "Marijuana", value: "Marijuana" },
        { label: "Blue Dream", value: "Blue Dream" },
        { label: "Lemon Haze", value: "Lemon Haze" }
      )
  );

  await interaction.reply({ components: [selectRow], ephemeral: true });
});

// 🔹 Event: Selectie van producttype verwerken
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  const [_, mode, aantal, userId] = interaction.customId.split("_");
  if (userId !== interaction.user.id) return;

  const drug = interaction.values[0];
  const count = parseInt(aantal);

  if (mode === "add") {
    voorraad[drug] += count;
    await interaction.update({ content: `✅ **${count} stuks ${drug} toegevoegd!**`, components: [] });
  } else {
    voorraad[drug] = Math.max(0, voorraad[drug] - count);
    await interaction.update({ content: `❌ **${count} stuks ${drug} verwijderd!**`, components: [] });
  }

  // 🔹 Update bestaande voorraad embed
  if (voorraadMessage) {
    const updatedEmbed = createInventoryEmbed();
    const buttons = createButtons();
    await voorraadMessage.edit({ embeds: [updatedEmbed], components: [buttons] });
  }
});

client.login(process.env.TOKEN);