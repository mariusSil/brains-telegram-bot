import { config } from './config/vars';
import TelegramBot from 'node-telegram-bot-api';
import * as schedule from 'node-schedule';
import mongoose from 'mongoose';
import { BotActions, replyToMessage } from './services/botactions';

// Bot initialization
console.log('Starting bot initialization...');
export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || '', { polling: true });

const botActions = new BotActions(bot, config.TELEGRAM_CHAT_ID);

// Connect to MongoDB
mongoose
  .connect(config.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err: any) => console.error('MongoDB connection error:', err));

// Register error handler
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

// Register polling error handler
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Handle incoming messages
bot.on('message', async (msg: TelegramBot.Message) => {
  replyToMessage(msg);
});

// Schedule price progression analysis (every 30 minutes)
schedule.scheduleJob('*/30 * * * *', async () => {
  await botActions.analyzePriceProgression();
});

// Schedule new holders analysis (every 10 minutes)
schedule.scheduleJob('*/10 * * * *', async () => {
  await botActions.analyzeNewHolders();
});

console.log('Bot is running...');
