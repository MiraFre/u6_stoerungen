import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Zuletzt gesendete Meldungen speichern, um Doppelmeldungen im Intervall zu vermeiden
let lastNotified = new Set();

async function checkDisruptions() {
  try {
    const res = await fetch("https://rueckgr.at/wienerlinien_dev/disruptions/");
    const html = await res.text();
    const $ = cheerio.load(html);

    let found = false;

    $("li").each((i, el) => {
      const text = $(el).text().trim();

      if (text.includes("U6") && !lastNotified.has(text)) {
        found = true;
        lastNotified.add(text);
        bot.sendMessage(CHAT_ID, `⚠️ U6 Störung:\n${text}`);
      }
    });

    if (!found) {
      console.log("✅ Keine neue U6 Störung gefunden.");
    }
  } catch (err) {
    console.error("Fehler beim Abrufen der Störungsdaten:", err);
  }
}

// alle 60 Sekunden prüfen
setInterval(checkDisruptions, 60 * 1000);

// /status zeigt **alle aktuellen U6-Störungen**, auch bereits gemeldete
bot.onText(/\/status/, async (msg) => {
  try {
    const res = await fetch("https://rueckgr.at/wienerlinien_dev/disruptions/");
    const html = await res.text();
    const $ = cheerio.load(html);

    let u6Störungen = [];
    $("li").each((i, el) => {
      const text = $(el).text().trim();
      if (text.includes("U6")) {
        u6Störungen.push(text);
      }
    });

    if (u6Störungen.length === 0) {
      bot.sendMessage(msg.chat.id, "✅ Keine aktuellen U6-Störungen.");
    } else {
      bot.sendMessage(msg.chat.id, `⚠️ Aktuelle U6-Störungen:\n\n${u6Störungen.join("\n\n")}`);
    }
  } catch (err) {
    console.error("Fehler beim Abrufen der Störungsdaten:", err);
    bot.sendMessage(msg.chat.id, "❌ Fehler beim Abrufen der Störungsdaten.");
  }
});
