const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../db");
const orderStatus = require("../../db/order_statuses");

var kitsForGrade;
var selectedGrade;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("request")
    .setDescription("Requests a kit ")
    .addStringOption((option) =>
      option
        .setName("product_line")
        .setDescription("The product line of the kit")
        .setRequired(true)
        .addChoices(
          { name: "HG", value: "HG" },
          { name: "RG", value: "RG" },
          { name: "MG", value: "MG" },
          { name: "EG", value: "EG" },
          { name: "SD", value: "SD" },
          { name: "PG", value: "PG" },
          { name: "30MM", value: "30MM" },
          { name: "No grade/other", value: "null" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the kit")
        .setAutocomplete(true)
        .setRequired(true)
    ),
  async autocomplete(interaction, client) {
    var choices;
    const grade = interaction.options.getString("product_line");
    if (
      kitsForGrade == undefined ||
      kitsForGrade.length == 0 ||
      selectedGrade == undefined ||
      selectedGrade != grade
    ) {
      selectedGrade = grade;
      const sql = `Select id, name from kits where grade = $1`;
      const product_line = grade != "null" ? grade : "";
      kitsForGrade = await db.query(sql, [product_line]);
    }

    const focusedOption = interaction.options.getFocused(true);
    const kitNames = kitsForGrade.rows.map((kit) => [kit.id, kit.name]);
    if (focusedOption.value != "") {
      const filteredKitNames = kitNames.filter((name) => {
        return (
          name[1].toLowerCase().indexOf(focusedOption.value.toLowerCase()) >= 0
        );
      });
      choices = filteredKitNames.slice(0, 25);
    } else {
      choices = kitNames.slice(0, 25);
    }

    await interaction.respond(
      choices.map((choice) => ({
        name: choice[1],
        value: choice[0].toString(),
      }))
    );
  },
  async execute(interaction, client) {
    const grade = interaction.options.getString("product_line");
    const name = interaction.options.getString("name");

    const user = await retrieveUser(interaction.user);

    const sql = `INSERT INTO orders (user_id, product_id, date_requested, status) VALUES ($1, $2, NOW(), $3) RETURNING (SELECT name FROM kits WHERE id = product_id)`;
    const requestProduct = await db.query(sql, [
      user.id,
      name,
      orderStatus.NEW_REQUEST,
    ]);

    if (requestProduct.rows != null) {
      interaction.reply({
        content: `Successfull added ${grade} ${requestProduct.rows[0].name} to your wishlist`,
      });
    }
    return;
  },
};

async function retrieveUser(discordUser) {
  const findUserSql = `SELECT * FROM users WHERE discord_id = $1`;
  const oldUser = await db.query(findUserSql, [discordUser.id]);

  if (oldUser.rows.length == 0) {
    const createNewUserSql = `INSERT INTO users (discord_name, discord_id) VALUES ($1, $2) RETURNING *`;
    const newUser = await db.query(createNewUserSql, [
      discordUser.username,
      discordUser.id,
    ]);
    return newUser.rows[0];
  }
  return oldUser.rows[0];
}
