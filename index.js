const fetch = require("node-fetch");
const cheerio = require("cheerio");
const TelegramBot = require("node-telegram-bot-api");

// Lies Token und Chat-ID aus den GitHub Secrets (bei Actions verfügbar)
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

// Initialisiere Bot nur wenn direkt interaktiv (z. B. lokal)
let bot;
if (token) {
  bot = new TelegramBot(token, { polling: false });
}

// Funktion zum Abrufen der Störungsinfos von rueckgr.at
async function fetchU6Status() {
  try {
    const res = await fetch("https://rueckgr.at/category/ubahn/u6/");
    const body = await res.text();
    const $ = cheerio.load(body);

    let results = [];
    $(".post-title a").each((i, el) => {
      const text = $(el).text().trim();
      if (text.includes("U6")) {
        // Nur den Teil NACH "U6" übernehmen
        const cleaned = text.replace(/^U6\s*/i, "").trim();
        results.push(cleaned);
      }
    });

    if (results.length === 0) {
      return ["Keine aktuellen U6-Meldungen gefunden."];
    }

    return results;
  } catch (err) {
    console.error("Fehler beim Abrufen:", err);
    return ["Fehler beim Abrufen der Daten."];
  }
}

// Hauptfunktion: wird von GitHub Actions oder lokal aufgerufen
(async () => {
  const status = await fetchU6Status();

  const message = "Aktuelle U6-Meldungen:\n" + status.join("\n");

  console.log(message);

  if (bot && chatId) {
    try {
      await bot.sendMessage(chatId, message);
    } catch (err) {
      console.error("Fehler beim Senden an Telegram:", err);
    }
  }
})();
