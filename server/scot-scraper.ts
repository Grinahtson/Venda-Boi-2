import * as cheerio from 'cheerio';

interface ScotQuote {
  state: string;
  stateName: string;
  priceArroba: number;
  priceArrobaPrazo: number;
  trend: "up" | "down" | "stable";
  source: string;
}

interface ScraperResult {
  success: boolean;
  quotes: ScotQuote[];
  lastUpdate: Date;
  error?: string;
}

let cachedQuotes: ScotQuote[] = [];
let lastFetchTime: Date | null = null;
let previousPrices: Map<string, number> = new Map();

const CACHE_DURATION_MS = 4 * 60 * 60 * 1000;

const stateMapping: Record<string, string> = {
  "São Paulo": "SP",
  "Minas Gerais": "MG", 
  "Mato Grosso do Sul": "MS",
  "Mato Grosso": "MT",
  "Goiás": "GO",
  "Paraná": "PR",
  "Bahia": "BA",
  "Rio Grande do Sul": "RS",
  "Pará": "PA",
  "Tocantins": "TO",
  "Rondônia": "RO",
  "Espírito Santo": "ES",
  "Acre": "AC",
  "Maranhão": "MA",
  "Piauí": "PI",
};

const fallbackPrices: ScotQuote[] = [
  { state: "SP", stateName: "São Paulo", priceArroba: 322.50, priceArrobaPrazo: 326.00, trend: "up", source: "SCOT" },
  { state: "PR", stateName: "Paraná", priceArroba: 326.00, priceArrobaPrazo: 330.00, trend: "up", source: "SCOT" },
  { state: "MG", stateName: "Minas Gerais", priceArroba: 316.50, priceArrobaPrazo: 320.00, trend: "stable", source: "SCOT" },
  { state: "MS", stateName: "Mato Grosso do Sul", priceArroba: 313.50, priceArrobaPrazo: 317.00, trend: "up", source: "SCOT" },
  { state: "GO", stateName: "Goiás", priceArroba: 311.50, priceArrobaPrazo: 315.00, trend: "stable", source: "SCOT" },
  { state: "MT", stateName: "Mato Grosso", priceArroba: 302.00, priceArrobaPrazo: 305.00, trend: "stable", source: "SCOT" },
  { state: "TO", stateName: "Tocantins", priceArroba: 303.00, priceArrobaPrazo: 306.00, trend: "stable", source: "SCOT" },
  { state: "PA", stateName: "Pará", priceArroba: 306.50, priceArrobaPrazo: 310.00, trend: "down", source: "SCOT" },
  { state: "RO", stateName: "Rondônia", priceArroba: 277.00, priceArrobaPrazo: 280.00, trend: "stable", source: "SCOT" },
  { state: "ES", stateName: "Espírito Santo", priceArroba: 302.00, priceArrobaPrazo: 305.00, trend: "stable", source: "SCOT" },
  { state: "BA", stateName: "Bahia", priceArroba: 295.00, priceArrobaPrazo: 298.00, trend: "stable", source: "SCOT" },
  { state: "RS", stateName: "Rio Grande do Sul", priceArroba: 310.00, priceArrobaPrazo: 314.00, trend: "up", source: "SCOT" },
];

function parsePrice(priceText: string): number {
  const cleaned = priceText.replace(/[R$\s]/g, '').replace(',', '.');
  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
}

function determineTrend(state: string, currentPrice: number): "up" | "down" | "stable" {
  const previousPrice = previousPrices.get(state);
  if (!previousPrice) {
    previousPrices.set(state, currentPrice);
    return "stable";
  }
  
  const diff = currentPrice - previousPrice;
  previousPrices.set(state, currentPrice);
  
  if (diff > 0.5) return "up";
  if (diff < -0.5) return "down";
  return "stable";
}

async function fetchScotPage(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch('https://www.scotconsultoria.com.br/cotacoes/boi-gordo/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.error(`SCOT fetch failed: ${response.status}`);
      return null;
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error fetching SCOT page:', error);
    return null;
  }
}

function parseScotHtml(html: string): ScotQuote[] {
  const quotes: ScotQuote[] = [];
  const $ = cheerio.load(html);
  
  $('table tr, .cotacao-item, .price-row').each((_, element) => {
    const $el = $(element);
    const text = $el.text();
    
    for (const [fullName, abbrev] of Object.entries(stateMapping)) {
      if (text.includes(fullName) || text.includes(abbrev)) {
        const priceMatch = text.match(/R?\$?\s*(\d{2,3}[,\.]\d{2})/g);
        if (priceMatch && priceMatch.length > 0) {
          const price = parsePrice(priceMatch[0]);
          const pricePrazo = priceMatch.length > 1 ? parsePrice(priceMatch[1]) : price + 3.5;
          
          if (price > 100 && price < 500) {
            const existing = quotes.find(q => q.state === abbrev);
            if (!existing) {
              quotes.push({
                state: abbrev,
                stateName: fullName,
                priceArroba: price,
                priceArrobaPrazo: pricePrazo,
                trend: determineTrend(abbrev, price),
                source: "SCOT Consultoria"
              });
            }
          }
        }
      }
    }
  });
  
  $('*').each((_, element) => {
    const $el = $(element);
    if ($el.children().length === 0) {
      const text = $el.text().trim();
      
      for (const [fullName, abbrev] of Object.entries(stateMapping)) {
        if (text.includes(fullName)) {
          const parent = $el.parent();
          const siblingText = parent.text();
          const priceMatch = siblingText.match(/(\d{2,3})[,\.](\d{2})/);
          
          if (priceMatch) {
            const price = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);
            if (price > 100 && price < 500) {
              const existing = quotes.find(q => q.state === abbrev);
              if (!existing) {
                quotes.push({
                  state: abbrev,
                  stateName: fullName,
                  priceArroba: price,
                  priceArrobaPrazo: price + 3.5,
                  trend: determineTrend(abbrev, price),
                  source: "SCOT Consultoria"
                });
              }
            }
          }
        }
      }
    }
  });
  
  return quotes;
}

export async function fetchScotQuotes(): Promise<ScraperResult> {
  if (lastFetchTime && cachedQuotes.length > 0) {
    const timeSinceLastFetch = Date.now() - lastFetchTime.getTime();
    if (timeSinceLastFetch < CACHE_DURATION_MS) {
      console.log('Using cached SCOT quotes');
      return {
        success: true,
        quotes: cachedQuotes,
        lastUpdate: lastFetchTime
      };
    }
  }
  
  console.log('Fetching fresh SCOT quotes...');
  const html = await fetchScotPage();
  
  if (!html) {
    console.log('Using fallback prices');
    return {
      success: false,
      quotes: fallbackPrices,
      lastUpdate: new Date(),
      error: 'Could not fetch SCOT page, using fallback data'
    };
  }
  
  const quotes = parseScotHtml(html);
  
  if (quotes.length < 3) {
    console.log('Insufficient quotes parsed, using fallback');
    return {
      success: false,
      quotes: fallbackPrices,
      lastUpdate: new Date(),
      error: 'Could not parse enough quotes from SCOT'
    };
  }
  
  cachedQuotes = quotes;
  lastFetchTime = new Date();
  
  console.log(`Successfully fetched ${quotes.length} quotes from SCOT`);
  return {
    success: true,
    quotes,
    lastUpdate: lastFetchTime
  };
}

export function getLastUpdateTime(): Date | null {
  return lastFetchTime;
}

export function getCachedQuotes(): ScotQuote[] {
  return cachedQuotes.length > 0 ? cachedQuotes : fallbackPrices;
}

export function clearCache(): void {
  cachedQuotes = [];
  lastFetchTime = null;
  console.log('SCOT cache cleared');
}
