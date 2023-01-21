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
          { name: "HG", value: "1" },
          { name: "RG", value: "2" },
          { name: "MG", value: "3" },
          { name: "EG", value: "5" },
          { name: "SD", value: "6" },
          { name: "PG", value: "4" },
          { name: "30MM", value: "30MM" },
          { name: "Other", value: "999" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the kit")
        .setRequired(true)
    ),
  async execute(interaction) {
    const grade = interaction.options.getString("grade");
    const name = interaction.options.getString("name");
    const sql = `Select name, product_line, price from kits where name ilike $1 and product_line = $2`;

    const resp = await db.query(sql, [`%${name}%`, grade]);
    const filteredKits = resp.rows.filter((kit) => kit.price != null);

    if (resp.rows.length <= 0 || filteredKits.length <= 0) {
      interaction.reply({
        content: `Could not find the price of the: ${grade} ${name}`,
      });
      return;
    }

    if (filteredKits.length == 1) {
      await interaction.reply({
        content: `The price of the ${filteredKits[0].grade} ${filteredKits[0].name} is R${filteredKits[0].price}`,
      });
    } else if (filteredKits.length >= 1) {
      const list = filteredKits.map(
        (kit) => `${kit.grade} ${kit.name} Price: R${kit.price}`
      );

      const message = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`The prices of the ${grade} ${name}: `)
        .setDescription(list.join("\n"));

      interaction.reply({
        embeds: [message],
      });
    }
  },
};
