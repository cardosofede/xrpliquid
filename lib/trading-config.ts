// Configuration for supported tokens and trading pairs in the application

// Token structure
export interface Token {
  currency: string;  // Token currency identifier (hex code for non-XRP tokens)
  symbol: string;    // Symbol for UI display
}

// Trading pair structure
export interface TradingPair {
  id: string;           // Unique identifier for the pair (e.g., "XRP/RLUSD")
  baseToken: Token;     // The base token (e.g., XRP in XRP/RLUSD)
  quoteToken: Token;    // The quote token (e.g., RLUSD in XRP/RLUSD)
}

// Whitelisted tokens
export const TOKENS: Record<string, Token> = {
  XRP: {
    currency: "XRP", // XRP uses its symbol as currency
    symbol: "XRP"
  },
  RLUSD: {
    currency: "524C555344000000000000000000000000000000", // Updated to use proper currency format
    symbol: "RLUSD"
  },
  SOLO: {
    currency: "534F4C4F00000000000000000000000000000000",
    symbol: "SOLO"
  },
  CORE: {
    currency: "434F524500000000000000000000000000000000",
    symbol: "CORE"
  }
  // Add more tokens as needed
}

// Supported trading pairs
export const TRADING_PAIRS: TradingPair[] = [
  {
    id: "XRP/RLUSD",
    baseToken: TOKENS.XRP,
    quoteToken: TOKENS.RLUSD
  },
  {
    id: "CORE/XRP",
    baseToken: TOKENS.CORE,
    quoteToken: TOKENS.XRP
  },
  {
    id: "SOLO/XRP",
    baseToken: TOKENS.SOLO,
    quoteToken: TOKENS.XRP
  }
  // Add more trading pairs as needed
];

/**
 * Utility function to determine if a token is whitelisted
 */
export function isWhitelistedToken(currency: string, issuer?: string): boolean {
  // For XRP
  if (currency === "XRP" && !issuer) {
    return true;
  }
  
  // For other tokens - we only check the currency code
  // We don't validate the issuer here since different issuers might use the same currency code
  return Object.values(TOKENS).some(token => 
    token.currency === currency
  );
}

/**
 * Utility function to determine if a trading pair is supported
 * Checks both directions (e.g., XRP/RLUSD and RLUSD/XRP)
 */
export function isSupportedTradingPair(
  currency1: string, 
  issuer1: string | undefined, 
  currency2: string, 
  issuer2: string | undefined
): boolean {
  // Check if both tokens are whitelisted
  if (!isWhitelistedToken(currency1, issuer1) || !isWhitelistedToken(currency2, issuer2)) {
    return false;
  }
  
  // Find tokens by currency
  const token1 = Object.values(TOKENS).find(t => t.currency === currency1);
  const token2 = Object.values(TOKENS).find(t => t.currency === currency2);
  
  if (!token1 || !token2) {
    console.log(`Trading pair not supported: token(s) not found for currencies: ${currency1}, ${currency2}`);
    return false;
  }
  
  // Check if this combination is a supported trading pair
  const isPairSupported = TRADING_PAIRS.some(pair => 
    (pair.baseToken.symbol === token1.symbol && pair.quoteToken.symbol === token2.symbol) ||
    (pair.baseToken.symbol === token2.symbol && pair.quoteToken.symbol === token1.symbol)
  );
  
  if (!isPairSupported) {
    console.log(`Trading pair not supported: ${token1.symbol}/${token2.symbol} is not in whitelist`);
  }
  
  return isPairSupported;
}

/**
 * Determine market side (BUY or SELL) for a standard market notation
 * For example, in XRP/RLUSD:
 * - If taker_pays is XRP and taker_gets is RLUSD, it's a SELL order (selling XRP for RLUSD)
 * - If taker_pays is RLUSD and taker_gets is XRP, it's a BUY order (buying XRP with RLUSD)
 */
export function determineMarketSide(
  pairId: string,
  takerGetsCurrency: string,
  takerPaysCurrency: string
): "BUY" | "SELL" | "UNKNOWN" {
  const pair = TRADING_PAIRS.find(p => p.id === pairId);
  if (!pair) return "UNKNOWN";
  
  // Find tokens by currency
  const getsToken = Object.values(TOKENS).find(t => t.currency === takerGetsCurrency);
  const paysToken = Object.values(TOKENS).find(t => t.currency === takerPaysCurrency);
  
  if (!getsToken || !paysToken) return "UNKNOWN";
  
  const baseSymbol = pair.baseToken.symbol;
  const quoteSymbol = pair.quoteToken.symbol;
  
  if (getsToken.symbol === quoteSymbol && paysToken.symbol === baseSymbol) {
    return "BUY";  // Buying base with quote
  } else if (getsToken.symbol === baseSymbol && paysToken.symbol === quoteSymbol) {
    return "SELL"; // Selling base for quote
  }
  
  return "UNKNOWN";
}

/**
 * Find the matching trading pair for two tokens
 */
export function findTradingPair(
  currency1: string, 
  issuer1: string | undefined, 
  currency2: string, 
  issuer2: string | undefined
): TradingPair | undefined {
  // Find tokens by currency
  const token1 = Object.values(TOKENS).find(t => t.currency === currency1);
  const token2 = Object.values(TOKENS).find(t => t.currency === currency2);
  
  if (!token1 || !token2) return undefined;
  
  return TRADING_PAIRS.find(pair => 
    (pair.baseToken.symbol === token1.symbol && pair.quoteToken.symbol === token2.symbol) ||
    (pair.baseToken.symbol === token2.symbol && pair.quoteToken.symbol === token1.symbol)
  );
} 