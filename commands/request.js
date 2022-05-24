const { google } = require("googleapis");
const dotenv = require("dotenv");
const { authorize } = require("../google_auth");
dotenv.config();

module.exports = {
  name: "request",
  description: "looking for game command",
  async execute(client, message, args) {
    authorize(getInfo);

    function getInfo(auth) {
      const sheets = google.sheets({ version: "v4", auth: auth });

      sheets.spreadsheets.values.get(
        {
          spreadsheetId: process.env.SHEET_ID,
          range: "Sheet1!A3:J3",
        },
        (err, res) => {
          if (err) {
            return console.log("uh oh error" + err);
          }
          const rows = res.data.values;
          console.log(rows);

          message.channel.send("row data: " + rows[0][4]);
        }
      );
    }
  },
};
