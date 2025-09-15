require('dotenv').config(); 


const TelegramBot = require('node-telegram-bot-api');
const Parser = require('rss-parser');
const parser = new Parser();

const token = process.env.TELEGRAM_TOKEN; // Telegram Bot Token
const chatId = process.env.CHAT_ID;       // Deine Chat-ID
const bot = new TelegramBot(token, { polling: false });

// RSS-Feed von Nitter für @wienerlinien
const RSS_URL = 'https://nitter.net/wienerlinien/rss';
let lastItemId = null;

async function checkFeed() {
    try {
        const feed = await parser.parseURL(RSS_URL);
        if (feed.items.length === 0) return;

        const latest = feed.items[0];
        if (latest.link !== lastItemId) {
            lastItemId = latest.link;

            if (latest.content.includes('U6')) {
                bot.sendMessage(chatId, `🚇⚠️ U6-Störung:\n\n${latest.content}\n\nLink: ${latest.link}`);
            }
        }
    } catch (err) {
        console.error('Fehler beim Abrufen des Feeds:', err);
    }
}

// Alle 60 Sekunden prüfen
setInterval(checkFeed, 60000);

console.log('U6-Alert Bot läuft...');
