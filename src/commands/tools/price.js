const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("price")
    .setDescription("Checks the price of a kit")
    .addStringOption((option) =>
      option
        .setName("grade")
        .setDescription("The grade of the kit")
        .setRequired(true)
        .addChoices(
          { name: "HG", value: "HG" },
          { name: "RG", value: "RG" },
          { name: "MG", value: "MG" },
          { name: "EG", value: "EG" },
          { name: "PG", value: "PG" },
          { name: "30MM", value: "30MM" },
          { name: "No grade", value: "null" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the kit")
        .setRequired(true)
    ),
  async execute(interaction, client) {
    const grade = interaction.options.getString("grade");
    const name = interaction.options.getString("name");
    const sql = `Select name, grade, price from kits where name ilike $1 and grade = $2`;

    const resp = await db.query(sql, [`%${name}%`, grade]);

    if (resp.rows.length <= 0) {
      interaction.reply({
        content: `Could not find the price of the: ${kit.grade} ${kit.name}`,
      });
      return;
    }

    filteredKits = resp.rows.filter((kit) => kit.price != null);

    if (filteredKits.length == 1) {
      await interaction.reply({
        content: `The price of the ${filteredKits[0].grade} ${filteredKits[0].name} is R${filteredKits[0].price}`,
      });
    } else if (filteredKits.length >= 1) {
      list = filteredKits.map(
        (kit) => `${kit.grade} ${kit.name} Price: R${kit.price}`
      );

      const message = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`The prices of the ${kit.grade} ${kit.name}: `)
        .setDescription(list.join("\n"));

      interaction.reply({
        embeds: [message],
      });
    }
  },
};
