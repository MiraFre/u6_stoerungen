const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Zuletzt gesendete Meldungen speichern, um Doppelmeldungen zu vermeiden
let lastNotified = new Set();

async function checkDisruptions() {
  try {
    const res = await fetch("https://rueckgr.at/wienerlinien_dev/disruptions/");
    const html = await res.text();
    const $ = cheerio.load(html);

    $("li").each((i, el) => {
      const text = $(el).text().trim();

      // Nur Störungen für U6, nur Text nach "U6: "
      const match = text.match(/U6: (.+)/);
      if (match && !lastNotified.has(match[1])) {
        lastNotified.add(match[1]);
        bot.sendMessage(CHAT_ID, `⚠️ U6 Störung:\n${match[1]}`);
      }
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Störungsdaten:", err);
  }
}

// Alle 60 Sekunden prüfen
setInterval(checkDisruptions, 60 * 1000);

// /status zeigt alle aktuellen U6-Störungen
bot.onText(/\/status/, async (msg) => {
  try {
    const res = await fetch("https://rueckgr.at/wienerlinien_dev/disruptions/");
    const html = await res.text();
    const $ = cheerio.load(html);

    let u6Störungen = [];

    $("li").each((i, el) => {
      const text = $(el).text().trim();
      const match = text.match(/U6: (.+)/);
      if (match) {
        u6Störungen.push(match[1]);
      }
    });

    if (u6Störungen.length === 0) {
      bot.sendMessage(msg.chat.id, "✅ Keine aktuellen U6-Störungen.");
    } else {
      bot.sendMessage(msg.chat.id, `⚠️ Aktuelle U6-Störungen:\n\n${u6Störungen.join("\n\n")}`);
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, "❌ Fehler beim Abrufen der Störungsdaten.");
  }
});
