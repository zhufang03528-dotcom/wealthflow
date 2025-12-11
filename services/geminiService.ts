import { GoogleGenAI } from "@google/genai";
import { StockHolding } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const updateStockPrices = async (stocks: StockHolding[]): Promise<StockHolding[]> => {
  if (!apiKey) {
    console.warn("No API Key provided for Gemini.");
    return stocks;
  }

  const symbols = stocks.map(s => s.symbol).join(', ');
  const prompt = `
    I need the current stock market price for the following symbols: ${symbols}.
    Please search for the latest price for each.
    
    IMPORTANT: Return the output strictly as a JSON object where the keys are the stock symbols and the values are the numeric prices (numbers only, no currency symbols).
    Example format:
    {
      "2330.TW": 950.5,
      "AAPL": 185.2
    }
    If you cannot find a specific stock, do not include it in the JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    
    // Extract JSON from the response text (it might be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from Gemini response");
    }

    const priceMap = JSON.parse(jsonMatch[0]);

    // Update stocks with new prices
    const updatedStocks = stocks.map(stock => {
      const newPrice = priceMap[stock.symbol];
      if (newPrice !== undefined && typeof newPrice === 'number') {
        return {
          ...stock,
          currentPrice: newPrice,
          lastUpdated: new Date().toISOString()
        };
      }
      return stock;
    });

    return updatedStocks;

  } catch (error) {
    console.error("Error updating stock prices with Gemini:", error);
    return stocks;
  }
};