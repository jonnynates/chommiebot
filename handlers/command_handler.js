const fs = require("fs");

module.exports = (client, Discord) => {
  const commandsFiles = fs
    .readdirSync("./commands/")
    .filter((file) => file.endsWith(".js"));

  for (const file of commandsFiles) {
    const command = require(`../commands/${file}`);
    if (command.name) {
      client.commands.set(command.name, command);
    } else {
      message.channel.send("Uknown command");
      continue;
    }
  }
};
