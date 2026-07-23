export interface TokenMetrics {
  promptTokens: number;
  completionTokens: number;
  modelName: string;
  provider: string;
  costUSD: number;
}

export class TokenManager {
  /**
   * Calcula el coste estimado de la ejecución de la consulta.
   */
  static calculateCost(
    promptTokens: number,
    completionTokens: number,
    modelName: string,
    provider: string
  ): number {
    const model = modelName.toLowerCase();
    const prov = provider.toLowerCase();

    let inputCostPerMillion = 2.50; // default OpenAI input
    let outputCostPerMillion = 10.00; // default OpenAI output

    if (prov === 'gemini') {
      // Gemini 2.5 flash / 1.5 flash prices
      inputCostPerMillion = 0.075;
      outputCostPerMillion = 0.30;
    } else if (model.includes('gpt-4o-mini')) {
      inputCostPerMillion = 0.15;
      outputCostPerMillion = 0.60;
    }

    const inputCost = (promptTokens / 1000000) * inputCostPerMillion;
    const outputCost = (completionTokens / 1000000) * outputCostPerMillion;
    return inputCost + outputCost;
  }

  /**
   * Genera un bloque con los metadatos de tokens consumidos y coste estimado.
   */
  static getMetrics(
    promptTokens: number,
    completionTokens: number,
    modelName: string,
    provider: string
  ): TokenMetrics {
    const costUSD = this.calculateCost(promptTokens, completionTokens, modelName, provider);
    return {
      promptTokens,
      completionTokens,
      modelName,
      provider,
      costUSD
    };
  }
}
