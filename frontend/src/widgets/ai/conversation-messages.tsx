import type { AiMessage } from "../../entities/ai-conversation/model/ai-conversation.types";

type Props = {
  messages: AiMessage[];
  isSending: boolean;
};

export function ConversationMessages({ messages, isSending }: Props) {
  if (messages.length === 0 && !isSending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">Ask your CRM</h2>

          <p className="mt-2 text-sm text-slate-500">
            Ask about companies, contacts and leads.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={
            message.role === "USER" ? "ml-auto max-w-2xl" : "mr-auto max-w-3xl"
          }
        >
          <div
            className={[
              "rounded-2xl px-5 py-4",
              message.role === "USER"
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-900",
            ].join(" ")}
          >
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>

            {message.role === "ASSISTANT" &&
              message.sources &&
              message.sources.length > 0 && (
                <div className="mt-4 border-t border-slate-200 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sources
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {message.sources.map((source) => (
                      <span
                        key={`${source.documentId}-${source.chunkIndex}`}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                      >
                        {source.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      ))}

      {isSending && (
        <div className="mr-auto rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
          Thinking...
        </div>
      )}
    </div>
  );
}
