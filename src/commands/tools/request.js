const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("request")
    .setDescription("Requests a kit ")
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

    const user = await retrieveUser(interaction.user);

    const sql = `Select name, grade, price from kits where name ilike $1 and grade = $2`;

    const resp = await db.query(sql, [`%${name}%`, grade]);

    interaction.reply({
      content: `Test ${user.discord_name}`,
    });
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
