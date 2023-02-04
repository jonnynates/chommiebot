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
    const sql = `Select pl.product_line_name, k.name, o.date_requested from orders o
    left join kits k on k.id = o.product_id
    left join users u on u.id = o.user_id
    left join product_lines pl on pl.id = k.product_line
    where discord_id = $1
    ORDER BY pl.product_line_name ASC`;

    const resp = await db.query(sql, [target.id]);

    if (resp.rows.length <= 0) {
      interaction.reply({
        content: `${target.username} does not have any requested kits`,
      });
      return;
    }
    list = resp.rows.map((order) => `${order.product_line_name} ${order.name}`);

    const message = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`Wishlist for ${target.username}`)
      .setDescription(list.join("\n"));

    interaction.reply({
      embeds: [message],
    });
  },
};
