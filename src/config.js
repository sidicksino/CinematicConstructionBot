require('dotenv').config();

module.exports = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    HF_TOKEN: process.env.HF_TOKEN
};
