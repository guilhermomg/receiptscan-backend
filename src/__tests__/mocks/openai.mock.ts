/**
 * Mock OpenAI SDK for testing
 */

export const mockOpenAIResponse = {
  id: 'chatcmpl-test',
  object: 'chat.completion',
  created: Date.now(),
  model: 'gpt-4o',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          merchant: 'Test Merchant',
          merchantConfidence: 0.95,
          date: '2024-01-15',
          dateConfidence: 0.92,
          total: 127.45,
          totalConfidence: 0.98,
          tax: 11.25,
          taxConfidence: 0.88,
          currency: 'USD',
          currencyConfidence: 0.99,
          category: 'Food & Dining',
          categoryConfidence: 0.85,
          lineItems: [
            {
              description: 'Test Item',
              quantity: 1,
              unitPrice: 10.0,
              total: 10.0,
              confidence: 0.75,
            },
          ],
        }),
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 150,
    total_tokens: 250,
  },
};

export const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue(mockOpenAIResponse),
    },
  },
};

export class OpenAI {
  chat = mockOpenAI.chat;
  constructor() {}
}

export default mockOpenAI;
