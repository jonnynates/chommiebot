const { SlashCommandBuilder } = require("discord.js");
const db = require("../../db");

var kitsForGrade;
var selectedGrade;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("price")
    .setDescription("Checks the price of a kit")
    .addStringOption((option) =>
      option
        .setName("product_line")
        .setDescription("The product line of the kit")
        .setRequired(true)
        .addChoices(
          { name: "HG", value: "1" },
          { name: "RG", value: "2" },
          { name: "MG", value: "3" },
          { name: "EG", value: "5" },
          { name: "SD", value: "6" },
          { name: "PG", value: "4" },
          { name: "30MM", value: "30MM" },
          { name: "Other", value: "null" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the kit")
        .setAutocomplete(true)
        .setRequired(true)
    ),
  async autocomplete(interaction) {
    var choices;
    const grade = interaction.options.getString("product_line");
    if (
      kitsForGrade == undefined ||
      kitsForGrade.length == 0 ||
      selectedGrade == undefined ||
      selectedGrade != grade
    ) {
      selectedGrade = grade;
      if (grade == "null") {
        const sql = `Select k.id, pl.product_line_name, k.name from kits k 
          left join product_lines pl on pl.id = k.product_line 
          where pl.product_line_name not in ('HG', 'RG', 'MG', 'EG', 'SD', 'PG', '30MM') `;
        kitsForGrade = await db.query(sql, []);
      } else {
        const sql = `Select k.id, pl.product_line_name, k.name from kits k  
          left join product_lines pl on pl.id = k.product_line
          where k.product_line = $1 `;
        kitsForGrade = await db.query(sql, [grade]);
      }
    }

    const focusedOption = interaction.options.getFocused();
    const kitNames = kitsForGrade.rows.map((kit) => [
      kit.id,
      `${kit.product_line_name} ${kit.name}`,
    ]);

    const filteredKitNames = kitNames.filter((name) => {
      return name[1].toLowerCase().indexOf(focusedOption.toLowerCase()) >= 0;
    });
    choices = filteredKitNames.slice(0, 25);

    await interaction.respond(
      choices.map((choice) => ({
        name: choice[1],
        value: choice[0].toString(),
      }))
    );
  },
  async execute(interaction) {
    const product_id = interaction.options.getString("name");

    if (Number.isInteger(product_id) == false) {
      const product_line = await getProductLineByID(selectedGrade);
      interaction.reply({
        content: `Sorry this kit does not exist in database.\nPlease ask a member of GUNPLA SA to add: **${product_line.product_line_name} ${product_id}** `,
      });

      return;
    }

    const sql = `Select k.name, pl.product_line_name, k.price from kits k
    left join product_lines pl on pl.id = k.product_line 
    where k.id = $1`;

    const resp = await db.query(sql, [product_id]);
    const filteredKits = resp.rows.filter((kit) => kit.price != null);

    if (filteredKits.length <= 0) {
      interaction.reply({
        content: `Could not find the price of the: **${resp.rows[0].product_line_name} ${resp.rows[0].name}**\nPlease ask a member of GUNPLA SA for a price estimation.`,
      });
      return;
    }

    await interaction.reply({
      content: `The price of the **${filteredKits[0].product_line_name} ${filteredKits[0].name}** is R${filteredKits[0].price}`,
    });
  },
};

async function getProductLineByID(product_line_id) {
  const sql = `Select * from product_lines where id = $1 `;
  const product_line = await db.query(sql, [product_line_id]);

  return product_line.rows[0];
}
