const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wishlist")
    .setDescription("Returns the wishlist for the requested user")
    .addUserOption((option) =>
      option.setName("target").setDescription("The user to get wishlist for")
    ),
  async execute(interaction) {
    const target = interaction.options.getUser("target") ?? interaction.user;
    var list;
    const sql = `Select k.grade, k.name, o.date_requested from orders o
    left join kits k on k.id = o.product_id
    left join users u on u.id = o.user_id
    where discord_id = $1`;

    const resp = await db.query(sql, [target.id]);

    if (resp.rows.length <= 0) {
      interaction.reply({
        content: `${target.username} does not have any requested kits`,
      });
      return;
    }
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
