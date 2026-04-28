export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatResponse = {
  message?: {
    role?: string;
    content?: string;
  };
  error?: string;
};

export async function chatWithOllama(params: {
  baseUrl: string;
  model: string;
  messages: ChatMessage[];
}): Promise<string> {
  const normalizedBaseUrl = params.baseUrl.replace(/\/+$/, "");
  const url = `${normalizedBaseUrl}/api/chat`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        stream: false,
        keep_alive: "0s"
      })
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Cannot reach Ollama at ${normalizedBaseUrl}. Make sure Ollama is running and reachable, then try again. Original error: ${reason}`
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama HTTP ${response.status}: ${body || response.statusText}`);
  }

  const data = (await response.json()) as OllamaChatResponse;
  if (data.error) {
    throw new Error(`Ollama error: ${data.error}`);
  }

  const content = data.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Ollama response did not include message.content");
  }

  return content.trim();
}
