import { config } from './config/vars';
import TelegramBot from 'node-telegram-bot-api';
import * as schedule from 'node-schedule';
import mongoose from 'mongoose';
import { BotActions, replyToMessage } from './services/botactions';
import express from 'express';
import ContextService from './services/ContextService';

// Bot initialization
console.log('Starting bot initialization...');
export const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });
const botActions = new BotActions(bot, config.TELEGRAM_CHAT_ID);
let botInfo_: TelegramBot.User | null = null;
export const getBotInfo = () => botInfo_;
// Set bot ID in ContextService
bot.getMe().then((botInfo) => {
  botInfo_ = botInfo;
  console.log('Bot ID:', botInfo.id, botInfo.username);
  ContextService.botId = botInfo.id;
});

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
  console.log('test', msg);
  ContextService.addMessage(msg);
  replyToMessage(msg);
});

// Schedule price progression analysis (every 30 minutes)
schedule.scheduleJob('*/30 * * * *', async () => {
  if (ContextService.isBotTooActive()) return;
  await botActions.analyzePriceProgression();
});

// Schedule new holders analysis (every 10 minutes)
schedule.scheduleJob('*/10 * * * *', async () => {
  if (ContextService.isBotTooActive()) return;
  await botActions.analyzeNewHolders();
});

// schedule.scheduleJob('*/90 * * * *', async () => {
//   const randomMessage = stage1HintTg[Math.floor(Math.random() * stage1HintTg.length)];
//   await bot.sendPhoto(config.TELEGRAM_CHAT_ID, 'https://hailbrains.com/asset-uploads/act-1.png', {
//     caption: randomMessage,
//     reply_markup: {
//       inline_keyboard: [
//         [
//           {
//             text: '🔍 Find Clues on Instagram',
//             url: 'https://instagram.com/hailbrains',
//           },
//         ],
//       ],
//     },
//   });
// });

console.log('Bot is running...');

const app = express();
const port = process.env.PORT || 3005;
// Setup basic routes
app.get('/', (req, res) => {
  res.send('Telegram X Informant Bot is running!');
});

// Start Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
