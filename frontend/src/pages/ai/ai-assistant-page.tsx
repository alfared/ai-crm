import { useState } from "react";

import { queryRag } from "../../entities/rag/api/rag-api";
import type { ChatMessage } from "../../entities/rag/model/rag.types";
import axios from "axios";

export function AiAssistantPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const text = question.trim();

    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);

    setQuestion("");
    setLoading(true);

    try {
      const result = await queryRag(text);

      const assignmentMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.answer,
        sources: result.sources,
      };

      setMessages((prev) => [...prev, assignmentMessage]);
    } catch (error) {
      console.error("AI Assistant error:", error);

      let message = "Something went wrong while contacting the AI assistant.";

      if (axios.isAxiosError(error)) {
        console.error("Status:", error.response?.status);
        console.error("Response:", error.response?.data);
        console.error("URL:", error.config?.url);

        const apiMessage = error.response?.data?.message;

        if (typeof apiMessage === "string") {
          message = apiMessage;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Assistant</h1>

        <p className="text-sm text-gray-500">
          Ask questions about your companies, contacts and leads.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border bg-white p-4">
        {messages.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-gray-400">Start a conversation with your CRM.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto max-w-[70%] rounded-2xl bg-blue-600 px-4 py-3 text-white"
                : "mr-auto max-w-[70%] rounded-2xl bg-gray-100 px-4 py-3"
            }
          >
            <div className="whitespace-pre-wrap text-sm">{message.content}</div>

            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <p className="mb-2 text-xs font-medium text-gray-500">
                  Sources
                </p>

                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source) => (
                    <span
                      key={source.id}
                      className="rounded-full bg-white px-3 py-1 text-xs shadow-sm"
                    >
                      {source.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="mr-auto rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-500">
            Thinking...
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about your CRM..."
            className="flex-1 rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white disabled:opacity-50"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
