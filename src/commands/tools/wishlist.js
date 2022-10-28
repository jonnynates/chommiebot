const { SlashCommandBuilder } = require("discord.js");
const database = require("../../database.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wishlist")
    .setDescription("Returns the wishlist for the rquested usser"),
  async execute(interaction, client) {
    const message = await interaction.deferReply({
      fetchReply: true,
    });

    console.log("hello");
    message.channel.send("hello");

    const sql = `Select k.name from orders o
    left join kits k on k.id = o.product_id
    left join users u on u.id = o.user_id
    where discord_id = ${message.author.id}`;
    const list = database.query(sql, (err, resp) => {
      console.log(resp);
    });
    console.log(list);

    const newMessage = "hello world";
    await interaction.editReply({
      content: newMessage,
    });

    // players = list.roles.cache
    //   .get(character.id)
    //   .members.map((m) => m.user.username);

    // if (players.length > 0) {
    //   newEmbed.setDescription(players.join("\n"));

    //   message.channel.send({ embeds: [newEmbed] });
    // }
  },
};
