const { Client } = require("pg");
const config = require("config");
const db = config.get("db");

const database = new Client({
  host: db.host,
  user: db.user,
  port: db.port,
  password: db.password,
  database: db.database,
});

module.exports = database;
