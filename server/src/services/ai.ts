import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function callOpenAI(
  messages: { role: string; content: string }[],
  temperature = 1
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "minimaxai/minimax-m2.7",
      messages: messages as any,
      temperature,
      top_p: 0.95,
      max_tokens: 8192,
    });
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('AI Error:', error);
    throw new Error('AI Service Unavailable');
  }
}

export async function chat(message: string, history: { user: string; ai: string }[] = [], context = ''): Promise<string> {
  const systemPrompt = `You are EnterCollab AI, a helpful assistant for university collaboration projects.${context ? ` Context: ${context}` : ''}`;  
  const messages: { role: string; content: string }[] = [{ role: 'system', content: systemPrompt }];

  for (const msg of history) {
    messages.push({ role: 'user', content: msg.user });
    messages.push({ role: 'assistant', content: msg.ai });
  }

  messages.push({ role: 'user', content: message });
  return callOpenAI(messages);
}

export async function summarize(text: string): Promise<string> {
  return callOpenAI([{ role: 'user', content: `Summarize the following text concisely:\n\n${text}` }], 0.5);
}

export async function extractTasks(discussion: string): Promise<any[]> {
  const json = await callOpenAI([
    { role: 'user', content: `Extract actionable tasks from this discussion and return as JSON array with "title" and "description" fields:\n\n${discussion}` },
  ], 0.3);
  try {
    return JSON.parse(json.replace(/```json\n?|```/g, ''));
  } catch {
    return [];
  }
}
