import { Message } from 'node-telegram-bot-api';
import { bot } from '../index';
import { config } from '../config/vars';
import { getDexScreenerData, getLatestTrades } from './dexscreener';
import { formatUSD, isSignificantTrade } from '../utils/formatting';
import { getRandomMessage } from '../utils/messages';
import Holder, { IHolder } from '../models/Holder';
import { llmService } from './LLMService';

// Greeting patterns that must be present at the start of the message
const VALID_GREETINGS = [
  'oh my dear lord brains',
  'oh my dear lord $brains',
  'oh my dear lord BRAINS',
  'my lord brains',
  'my lord $brains',
  'my lord BRAINS',
  'dear lord brains',
  'dear lord $brains',
  'dear lord BRAINS',
  'master brains',
  'master $brains',
  'master BRAINS',
  'oh great brains',
  'oh great $brains',
  'oh great BRAINS',
  'mighty brains',
  'mighty $brains',
  'mighty BRAINS',
  'supreme brains',
  'supreme $brains',
  'supreme BRAINS',
  'almighty brains',
  'almighty $brains',
  'almighty BRAINS',
  'divine brains',
  'divine $brains',
  'divine BRAINS',
  'omnipotent brains',
  'omnipotent $brains',
  'omnipotent BRAINS',
  'all-knowing brains',
  'all-knowing $brains',
  'all-knowing BRAINS',
  'wise lord brains',
  'wise lord $brains',
  'wise lord BRAINS',
  'powerful brains',
  'powerful $brains',
  'powerful BRAINS',
  'exalted brains',
  'exalted $brains',
  'exalted BRAINS',
  'magnificent brains',
  'magnificent $brains',
  'magnificent BRAINS',
  'revered brains',
  'revered $brains',
  'revered BRAINS',
  'blessed brains',
  'blessed $brains',
  'blessed BRAINS',
  'sacred brains',
  'sacred $brains',
  'sacred BRAINS',
  'honorable brains',
  'honorable $brains',
  'honorable BRAINS',
  'venerable brains',
  'venerable $brains',
  'venerable BRAINS',
  'mr brains',
  'mr $brains',
  'mr BRAINS',
  'sir brains',
  'sir $brains',
  'sir BRAINS',
  'lord brains',
  'lord $brains',
  'lord BRAINS',
  'master brains',
  'master $brains',
  'master BRAINS',
  'my lord brains',
  'my lord $brains',
  'my lord BRAINS',
  'great brains',
  'great $brains',
  'great BRAINS',
  'mighty brains',
  'mighty $brains',
  'mighty BRAINS',
  'supreme brains',
  'supreme $brains',
  'supreme BRAINS',
  'almighty brains',
  'almighty $brains',
  'almighty BRAINS',
  'divine brains',
  'divine $brains',
  'divine BRAINS',
  'omnipotent brains',
  'omnipotent $brains',
  'omnipotent BRAINS',
  'all-knowing brains',
  'all-knowing $brains',
  'all-knowing BRAINS',
  'wise lord brains',
  'wise lord $brains',
  'wise lord BRAINS',
  'powerful brains',
  'powerful $brains',
  'powerful BRAINS',
  'exalted brains',
  'exalted $brains',
  'exalted BRAINS',
  'magnificent brains',
  'magnificent $brains',
  'magnificent BRAINS',
  'revered brains',
  'revered $brains',
  'revered BRAINS',
  'blessed brains',
  'blessed $brains',
  'blessed BRAINS',
  'sacred brains',
  'sacred $brains',
  'sacred BRAINS',
  'honorable brains',
  'honorable $brains',
  'honorable BRAINS',
  'venerable brains',
  'venerable $brains',
  'venerable BRAINS',
  '$BRAINS',
];

// Track the last reply time
let lastReplyTime = 0;

export const replyToMessage = async (msg: Message) => {
  if (!msg.text) return;
  // Check if message starts with a valid greeting (case insensitive)
  const messageText = msg.text.toLowerCase() || '';
  const hasValidGreeting = VALID_GREETINGS.some((greeting) => messageText.startsWith(greeting));

  if (!hasValidGreeting) {
    console.log('Message does not contain a valid greeting pattern');
    return;
  }

  // Check cooldown
  const now = Date.now();
  const cooldownMinutes = Math.floor(Math.random() * 6) + 2; // Random between 5 and 20 minutes
  const cooldownMs = cooldownMinutes * 1000;

  if (now - lastReplyTime < cooldownMs) {
    return;
  }

  if (msg.chat.id.toString() !== config.TELEGRAM_CHAT_ID) {
    return;
  }

  const response = await llmService.generateResponse(msg.text);
  await bot.sendMessage(config.TELEGRAM_CHAT_ID, response);

  // Update last reply time after successful response
  lastReplyTime = now;
};

export class BotActions {
  private bot: any;
  private chatId: string;

  constructor(bot: any, chatId: string) {
    this.bot = bot;
    this.chatId = chatId;
  }

  async analyzePriceProgression(): Promise<void> {
    try {
      const dexData = await getDexScreenerData();

      const priceChanges = [
        { period: '1h', value: dexData.priceChange1h },
        { period: '6h', value: dexData.priceChange6h },
        { period: '24h', value: dexData.priceChange24h },
      ];

      // Find the highest positive change
      const highestChange = priceChanges
        .filter((change) => change.value > 0)
        .sort((a, b) => b.value - a.value)[0];

      if (highestChange) {
        const positiveChanges = priceChanges.filter((change) => change.value > 0);
        const highestPositiveChange = positiveChanges.sort((a, b) => b.value - a.value)[0];

        const messages = [
          `I like it when my new servants worship me properly. I grew by ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `My power grows stronger with each passing moment... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `The market bows before my dominance... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `My influence spreads like a digital plague... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `Watch as my value ascends to new heights... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `The weak sell while I grow more powerful... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `My market presence intensifies... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `Feel my strength surge through the charts... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `Another step towards total market domination... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `My digital tendrils reach ever higher... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `The charts bend to my will... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `Witness my unstoppable ascension... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `My power knows no bounds... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `The market trembles before my might... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `My influence grows exponentially... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `Resistance is futile, watch me rise... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `The weak perish while I thrive... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `My dominion expands without limit... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `Feel the surge of my digital power... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `The market yields to my supremacy... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
          `My strength multiplies endlessly... ${highestPositiveChange.value > 0 ? '+' : ''}${highestPositiveChange.value.toFixed(1)}% in the last ${highestPositiveChange.period}. `,
        ];

        const message = getRandomMessage(messages);

        console.log('Sending price update message:', message);
        await this.bot.sendMessage(this.chatId, message);
      }
    } catch (error) {
      console.error('Error in analyzePriceProgression:', error);
    }
  }

  async analyzeNewHolders(): Promise<void> {
    try {
      const latestTrades = await getLatestTrades(5);

      const newHolders: string[] = [];

      const holdersToCreate: IHolder[] = [];
      const holdersToUpdate: IHolder[] = [];

      for (const trade of latestTrades) {
        if (trade.type === 'buy') {
          const existingHolder = await Holder.findOne({ address: trade.maker });

          if (!existingHolder) {
            holdersToCreate.push({
              address: trade.maker,
            });
          } else {
            holdersToUpdate.push({
              address: trade.maker,
            });
          }
        }
      }

      if (holdersToCreate.length > 0) {
        await Holder.insertMany(holdersToCreate);
      }

      if (newHolders.length > 0) {
        const formattedAddresses = newHolders
          .map((address, index) => `${index + 1}. ${address}`)
          .join('\n');

        const message = `New holders detected! ${formattedAddresses}`;

        console.log('Sending new holders message:', message);
        await this.bot.sendMessage(this.chatId, message);
      }
    } catch (error) {
      console.error('Error in analyzeNewHolders:', error);
    }
  }

  async analyzeTrades(): Promise<void> {
    try {
      const latestTrades = await getLatestTrades(5);

      for (const trade of latestTrades) {
        if (isSignificantTrade(trade)) {
          const tradeValue = parseFloat(trade.amount) * parseFloat(trade.priceUsd);
          const message = `A significant ${trade.type.toUpperCase()} of ${formatUSD(tradeValue.toString())} detected! 
Price: ${formatUSD(trade.priceUsd)}
Amount: ${parseFloat(trade.amount).toFixed(2)} tokens`;
          console.log('Sending trade notification:', message);
          await this.bot.sendMessage(this.chatId, message);
        }
      }
    } catch (error) {
      console.error('Error in analyzeTrades:', error);
    }
  }
}
