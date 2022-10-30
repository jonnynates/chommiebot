const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const database = require("../../database.js");
const util = require("util");

const query = util.promisify(database.query).bind(database);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wishlist")
    .setDescription("Returns the wishlist for the requested user")
    .addUserOption((option) =>
      option.setName("target").setDescription("The user to get wishlist for")
    ),
  async execute(interaction, client) {
    const target = interaction.options.getUser("target") ?? interaction.user;
    var list;
    const sql = `Select k.grade, k.name, o.date_requested from orders o
    left join kits k on k.id = o.product_id
    left join users u on u.id = o.user_id
    where discord_id = ${target.id}`;

    await database.connect();
    const resp = await query(sql);
    await database.end();
    list = resp.rows.map((order) => `${order.grade} ${order.name}`);

    const message = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`Wishlist for ${target.username}`)
      .setDescription(list.join("\n"));

    interaction.reply({
      embeds: [message],
    });
  },
};
