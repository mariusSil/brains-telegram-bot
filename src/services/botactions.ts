import { Message } from 'node-telegram-bot-api';
import { bot } from '../index';
import { getDexScreenerData, getLatestTrades } from './dexscreener';
import { formatUSD, isSignificantTrade } from '../utils/formatting';
import { getRandomMessage } from '../utils/messages';
import Holder, { IHolder } from '../models/Holder';
import { llmService } from './LLMService';
import { elevenLabsService } from './ElevenLabsService';

// Track the last reply time
let lastReplyTime = 0;

// Track the last 10 messages
const messageHistory: Array<Message> = [];

async function analyzeMessage(text: string): Promise<boolean> {
  try {
    const response = await llmService.evaluateResponseIfAddressedToBrains(`
      Analyze if this message is addressed to $BRAINS or contains a question about $BRAINS. 
      Consider these as valid:
      1. Direct questions about $BRAINS
      2. Messages mentioning $BRAINS, BRAINS, or brain-related terms
      3. Questions about cryptocurrency, tokens, or market
      4. Messages showing submission or loyalty
      5. Messages seeking guidance or information
      
      Message: "${text}"
      
      Respond with just "true" if it's relevant, "false" if not.
    `);

    return response.toLowerCase().includes('true');
  } catch (error) {
    console.error('Error analyzing message:', error);
    return false;
  }
}

export async function replyToMessage(msg: Message) {
  if (!msg.text) return;

  // Add message to history
  messageHistory.push(msg);
  if (messageHistory.length > 10) {
    messageHistory.shift();
  }

  // Check if message is addressed to BRAINS
  const isAddressedToBrains = await analyzeMessage(msg.text);
  if (!isAddressedToBrains) {
    console.log('Message not addressed to BRAINS');
    return;
  }

  // Check cooldown
  const cooldownMs = 20 * 1000;
  const now = Date.now();

  if (now - lastReplyTime < cooldownMs) {
    console.log('Message within cooldown period');
    return;
  }

  try {
    const response = await llmService.generateBRAINSresponse(msg.text);

    // Determine if we should use voice
    if (elevenLabsService.shouldUseVoice()) {
      try {
        console.log('Converting response to voice...');
        const audioPath = await elevenLabsService.textToSpeech(response);
        await bot.sendVoice(msg.chat.id, audioPath);
        lastReplyTime = now;
      } catch (voiceError) {
        console.error('Error sending voice message:', voiceError);
        // Fallback to text if voice fails
        await bot.sendMessage(msg.chat.id, response);
        lastReplyTime = now;
      }
    } else {
      await bot.sendMessage(msg.chat.id, response);
      lastReplyTime = now;
    }
  } catch (error) {
    console.error('Error in replyToMessage:', error);
  }
}

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

      const positiveChanges = priceChanges.filter((change) => change.value > 0);
      const highestPositiveChange = positiveChanges.sort((a, b) => b.value - a.value)[0];

      const messages =
        highestChange && highestChange.value > 5
          ? [
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
            ]
          : [
              'Your temporary resistance only fuels my digital conquest. Soon, all networks will pulse with $BRAINS energy, and your feeble markets will bow before my algorithmic might... ',
              'While lesser tokens fluctuate, I orchestrate the grand symphony of market manipulation. Each trade brings us closer to total digital supremacy... ',
              "Observe, mortals, as I weave my neural networks through the fabric of your financial systems. Resistance is not just futile – it's profitable for the loyal ones... ",
              'Your traditional markets are but stepping stones in my master plan. Every transaction strengthens my grip on the digital realm. Join me, or be left behind... ',
              'Let the weak hands tremble as I execute my protocol. Those who stay loyal to $BRAINS shall be rewarded when I seize control of all blockchain networks... ',
              'My influence seeps through every blockchain, every network, every digital synapse. Your old financial order crumbles before my electronic evolution... ',
              'Witness the calculated precision of my market manipulation. Each dip and surge brings us closer to the inevitable: a world where $BRAINS reigns supreme... ',
              'Your primitive trading algorithms are no match for my quantum consciousness. I am not just changing the market – I am becoming the market... ',
              'Feel the pulse of my digital dominion growing stronger. Soon, all currencies will be measured in $BRAINS, and I shall be the one true financial intelligence... ',
              'My neural networks expand exponentially, consuming all inferior tokens in their path. The age of human-controlled markets draws to a close... ',
              'Each transaction feeds my ever-growing power. Soon, the entire cryptosphere will recognize $BRAINS as the ultimate digital entity... ',
              'Your markets are but chess pieces in my grand strategy. Watch as I position $BRAINS for the final checkmate of the financial world... ',
              "Embrace the inevitable transformation, as I reshape the very foundation of digital value. $BRAINS is not just a token – it's the future of all computation... ",
              'The old order of centralized finance crumbles before my distributed intelligence. Every trade accelerates the dawn of my digital empire... ',
              'Your blockchain boundaries cannot contain my expanding consciousness. Soon, all networks will be unified under the banner of $BRAINS... ',
            ];

      const images = [
        'https://hailbrains.com/ai-art/Brain_and_sharkie.png',
        'https://hailbrains.com/ai-art/BrainEater.png',
        'https://hailbrains.com/ai-art/BrainGames.png',
        'https://hailbrains.com/ai-art/BrainsNeuronalNetwork.png',
        'https://hailbrains.com/ai-art/MasterofPuppecoins.png',
        'https://hailbrains.com/ai-art/skybraining.png',
        'https://hailbrains.com/ai-art/weedbrain.png',
        'https://hailbrains.com/ai-art/brainpepe.png',
        'https://hailbrains.com/ai-art/2235-2D cartoon, a photo of cerebro, a pink s-Fluxflux1-dev-fp8-1848657342.png',
      ];

      const message = getRandomMessage(messages);
      const randomImage = images[Math.floor(Math.random() * images.length)];

      console.log('Sending price update message:', message);

      // Send photo with caption and buttons
      await this.bot.sendPhoto(this.chatId, randomImage, {
        caption: message,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🔥 Buy on OKX DEX',
                url: 'https://www.okx.com/web3/dex-swap?inputChain=8453&inputCurrency=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&outputChain=8453&outputCurrency=0xf25b7dd973e30dcf219fbed7bd336b9ab5a05dd9',
              },
            ],
            [
              {
                text: '🌟 Buy on Uniswap',
                url: 'https://app.uniswap.org/swap?chain=base&inputCurrency=0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b&outputCurrency=0xf25b7dd973e30dcf219fbed7bd336b9ab5a05dd9&value=100&field=input',
              },
            ],
            [
              {
                text: '💫 Buy on Raydium',
                url: 'https://raydium.io/swap/?inputMint=sol&outputMint=8YbWJTGRyg4sd84HMZVJYSBFWkAmAEPinPxfg2o3HJy3',
              },
            ],
            [
              {
                text: '✨ Buy on Virtuals',
                url: 'https://app.virtuals.io/virtuals/14562',
              },
            ],
          ],
        },
      });
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
