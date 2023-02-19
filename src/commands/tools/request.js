const { SlashCommandBuilder } = require("discord.js");
const db = require("../../db");
const orderStatus = require("../../db/order_statuses");

var kitsForGrade;
var selectedGrade;
const CHOMMIEBOT_ID = 4;

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
    const user = await retrieveUser(interaction.user);
    console.log("proud", product_id);
    console.log(typeof product_id);

    if (isNaN(parseInt(product_id))) {
      const product_line = await getProductLineByID(selectedGrade);
      interaction.reply({
        content: `Sorry this kit does not exist in database.\nPlease ask a member of GUNPLA SA to add: **${product_line.product_line_name} ${product_id}** `,
      });

      return;
    }

    const duplicateOrderExists = await checkDuplicateProductOrder(
      user.id,
      product_id
    );

    if (duplicateOrderExists == true) {
      interaction.reply({
        content: `Cannot add this kit to your requests. You already have an existing request this kit`,
      });

      return;
    }

    const exclusive = await checkIfExclusiveKit(product_id);
    if (exclusive !== "") {
      interaction.reply({
        content: `Cannot add this kit to your requests. Unfortunately this kit is **${exclusive}** and we cannot bring it in`,
      });

      return;
    }

    const newRequestSQL = `INSERT INTO orders (user_id, product_id, date_requested, status) VALUES ($1, $2, NOW(), $3) RETURNING id`;
    const newRequest = await db.query(newRequestSQL, [
      user.id,
      product_id,
      orderStatus.NEW_REQUEST,
    ]);

    await createAuditHistory(newRequest.rows[0].id);
    const kit = await getKit(newRequest.rows[0].id);

    if (newRequest.rows != null) {
      interaction.reply({
        content: `Successfull added **${kit.product_line_name} ${kit.name}** to your wishlist`,
      });
    }
    return;
  },
};

async function checkDuplicateProductOrder(user_id, product_id) {
  const duplicateSQL = `SELECT * FROM orders WHERE user_id = $1 AND product_id = $2`;
  const existingOrder = await db.query(duplicateSQL, [user_id, product_id]);

  if (existingOrder.rows.length == 0) {
    return false;
  }
  return true;
}

async function checkIfExclusiveKit(product_id) {
  const duplicateSQL = `SELECT exclusive FROM kits WHERE id = $1`;
  const product = await db.query(duplicateSQL, [product_id]);

  return product.rows[0].exclusive;
}

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

async function createAuditHistory(orderId) {
  const auditHistorySQL = `INSERT INTO audit_history (order_id, status_id, performed_at, initiator_id)
  VALUES ($1, $2, NOW(), $3)`;
  await db.query(auditHistorySQL, [
    orderId,
    orderStatus.NEW_REQUEST,
    CHOMMIEBOT_ID,
  ]);
}

async function getKit(order_id) {
  const sql = `Select pl.product_line_name, k.name from kits k  
  left join product_lines pl on pl.id = k.product_line
  left join orders o on o.product_id = k.id
  where o.id = $1 `;
  const kit = await db.query(sql, [order_id]);

  return kit.rows[0];
}

async function getProductLineByID(product_line_id) {
  const sql = `Select * from product_lines where id = $1 `;
  const product_line = await db.query(sql, [product_line_id]);

  return product_line.rows[0];
}
