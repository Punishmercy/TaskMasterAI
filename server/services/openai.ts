import OpenAI from "openai";

// Using OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? ""
});

export async function generateChatResponse(prompt: string): Promise<{ response: string; wordCount: number }> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Back to OpenAI's model
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant. Provide detailed, accurate, and useful responses. Keep your response under 500 words."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800, // Roughly equivalent to 500 words
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response at this time.";

    // Count words in response
    const wordCount = response.trim().split(/\s+/).length;

    // Truncate if over 500 words
    let finalResponse = response;
    if (wordCount > 500) {
      const words = response.split(/\s+/);
      finalResponse = words.slice(0, 500).join(' ') + '...';
    }

    return {
      response: finalResponse,
      wordCount: Math.min(wordCount, 500)
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate AI response. Please try again.');
  }
}
