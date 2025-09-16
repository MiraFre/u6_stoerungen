require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Parser = require('rss-parser');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });
const chatId = process.env.CHAT_ID;
const parser = new Parser();

// Liste mit mehreren Nitter-Instanzen
const RSS_URLS = [
  'https://nitter.net/wienerlinien/rss',
  'https://nitter.cz/wienerlinien/rss',
  'https://nitter.privacydev.net/wienerlinien/rss',
  'https://nitter.poast.org/wienerlinien/rss'
];

let currentUrlIndex = 0;
let lastItemId = null;

// Begrüßungsnachricht beim Start
bot.sendMessage(chatId, "✅ U6-Bot ist gestartet und läuft!");

// Feed-Check Funktion
async function checkFeed() {
  const url = RSS_URLS[currentUrlIndex];
  try {
    console.log(`[${new Date().toISOString()}] Hole Feed von ${url} ...`);
    const feed = await parser.parseURL(url);

    console.log(`[${new Date().toISOString()}] Feed erfolgreich geladen, ${feed.items.length} Einträge gefunden.`);

    if (feed.items.length === 0) return;

    const latest = feed.items[0];
    if (latest.link !== lastItemId) {
      lastItemId = latest.link;
      if ((latest.content && latest.content.includes('U6')) || (latest.title && latest.title.includes('U6'))) {
        console.log(`[${new Date().toISOString()}] ⚠️ Neue U6-Störung gefunden!`);
        bot.sendMessage(chatId, `🚇⚠️ U6-Störung:\n\n${latest.content || latest.title}\n\n🔗 ${latest.link}`);
      } else {
        console.log(`[${new Date().toISOString()}] Neuer Tweet, aber nicht relevant für U6.`);
      }
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Fehler beim Abrufen von ${url}: ${err.message}`);
    // Fallback: nächsten Server probieren
    currentUrlIndex = (currentUrlIndex + 1) % RSS_URLS.length;
    console.log(`[${new Date().toISOString()}] Wechsle zu Backup-Server: ${RSS_URLS[currentUrlIndex]}`);
  }
}

// alle 60 Sekunden checken
setInterval(checkFeed, 60 * 1000);
