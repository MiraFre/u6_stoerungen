const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Zuletzt gesendete Meldungen
let lastNotified = new Set();

async function checkDisruptions() {
  try {
    const res = await fetch("https://rueckgr.at/wienerlinien_dev/disruptions/");
    const html = await res.text();
    const $ = cheerio.load(html);

    $("li").each((i, el) => {
      const text = $(el).text().trim();
      if (text.includes("U6") && !lastNotified.has(text)) {
        lastNotified.add(text);
        bot.sendMessage(CHAT_ID, `⚠️ U6 Störung:\n${text}`);
      }
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Störungsdaten:", err);
  }
}

setInterval(checkDisruptions, 60 * 1000);

bot.onText(/\/status/, async (msg) => {
  try {
    const res = await fetch("https://rueckgr.at/wienerlinien_dev/disruptions/");
    const html = await res.text();
    const $ = cheerio.load(html);

    let u6Störungen = [];
    $("li").each((i, el) => {
      const text = $(el).text().trim();
      if (text.includes("U6")) u6Störungen.push(text);
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
