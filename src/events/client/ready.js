module.exports = {
	name: "ready",
	once: true,
	async execute(client) {
		console.log(`Chommie bot is online ${client.user.tag}`);
	},
};