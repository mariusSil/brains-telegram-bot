import axios from 'axios';
import { config } from '../config/vars';

interface DexScreenerResponse {
  pair: {
    priceChange: {
      h1: string;
      h6: string;
      h24: string;
    };
    volume: {
      h24: string;
    };
    priceUsd: string;
    txns: {
      h24: {
        buys: number;
        sells: number;
      };
    };
    chainId: string;
    dexId: string;
    baseToken: {
      address: string;
    };
  } | null;
  pairs?: Array<{
    priceChange: {
      h1: string;
      h6: string;
      h24: string;
    };
    volume: {
      h24: string;
    };
    priceUsd: string;
    txns: {
      h24: {
        buys: number;
        sells: number;
      };
    };
    chainId: string;
    dexId: string;
    baseToken: {
      address: string;
    };
  }>;
}

export interface DexScreenerData {
  isPositive: boolean;
  priceChange1h: number;
  priceChange6h: number;
  priceChange24h: number;
  volume24h: number;
  currentPrice: string;
  priceChangeString: string;
  anyPositiveChange: boolean;
  tokenAddress?: string;
}

interface Trade {
  type: 'buy' | 'sell';
  priceUsd: string;
  amount: string;
  timestamp: number;
  hash: string;
  maker: string;
}

interface OrdersResponse {
  orders: {
    type: 'buy' | 'sell';
    priceUsd: string;
    amount: string;
    timestamp: number;
    hash: string;
    maker: string;
  }[];
}

export const getDexScreenerData = async (): Promise<DexScreenerData> => {
  try {
    const pairAddress = config.DEXSCREENER_PAIR_ADDRESS;
    console.log('Fetching DEX data for pair:', pairAddress);

    const response = await axios.get<DexScreenerResponse>(
      `https://api.dexscreener.com/latest/dex/pairs/base/${pairAddress}`,
    );

    // Check if we have a direct pair or need to look in pairs array
    const pair = response.data.pair || (response.data.pairs && response.data.pairs[0]);

    if (!pair) {
      throw new Error('No pair data found in response');
    }

    const priceChange1h = parseFloat(pair.priceChange.h1);
    const priceChange6h = parseFloat(pair.priceChange.h6);
    const priceChange24h = parseFloat(pair.priceChange.h24);
    const volume24h = parseFloat(pair.volume.h24);

    // Check if any time period shows positive change
    const anyPositiveChange = priceChange1h > 0 || priceChange6h > 0 || priceChange24h > 0;

    // Use the highest positive change for the message, or the 24h change if all negative
    let bestChange = priceChange24h;
    let timeFrame = '24h';
    if (priceChange1h > bestChange) {
      bestChange = priceChange1h;
      timeFrame = '1h';
    }
    if (priceChange6h > bestChange) {
      bestChange = priceChange6h;
      timeFrame = '6h';
    }

    return {
      isPositive: bestChange > 0,
      priceChange1h,
      priceChange6h,
      priceChange24h,
      volume24h,
      currentPrice: pair.priceUsd,
      priceChangeString: `${bestChange > 0 ? '+' : ''}${bestChange}% in the last ${timeFrame}`,
      anyPositiveChange,
      tokenAddress: pair.baseToken.address,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('DEX API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    console.error('Error details:', error);
    throw error;
  }
};

export const getLatestTrades = async (limit: number = 10): Promise<Trade[]> => {
  try {
    // First get the token address from pair info
    const response = await axios.get<OrdersResponse>(
      `https://api.dexscreener.com/orders/v1/base/${config.DEXSCREENER_PAIR_ADDRESS}`,
    );
    console.log(`https://api.dexscreener.com/orders/v1/base/${config.DEXSCREENER_PAIR_ADDRESS}`);

    console.log('Raw trades response:', JSON.stringify(response.data, null, 2));

    if (!response.data.orders || !Array.isArray(response.data.orders)) {
      console.error('Invalid trades response format:', response.data);
      return [];
    }

    // Take only the specified number of latest trades
    return response.data.orders.slice(0, limit).map((order) => ({
      type: order.type,
      priceUsd: order.priceUsd,
      amount: order.amount,
      timestamp: order.timestamp,
      hash: order.hash,
      maker: order.maker,
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Trades API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    console.error('Error details:', error);
    throw error;
  }
};
