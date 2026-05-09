export async function callOpenAI(
  messages: { role: string; content: string }[],
  temperature = 0.7
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  if (!apiKey || apiKey === 'your-openai-api-key') {
    const lastMsg = messages[messages.length - 1]?.content || '';
    return `[MOCK AI RESPONSE] Received: "${lastMsg}". Configure OPENAI_API_KEY for real responses.`;
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature }),
  });

  if (!res.ok) throw new Error('AI Service Unavailable');
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function chat(message: string, history: { user: string; ai: string }[] = [], context = ''): Promise<string> {
  const systemPrompt = `You are InterCollab AI, a helpful assistant for university collaboration projects.${context ? ` Context: ${context}` : ''}`;
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
