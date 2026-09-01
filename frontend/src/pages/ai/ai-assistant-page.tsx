import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
  createAiConversation,
  deleteAiConversation,
  getAiConversation,
  getAiConversations,
  renameAiConversation,
  streamAiMessage,
} from "../../entities/ai-conversation/api/ai-conversation-api";
import type {
  AiConversation,
  AiMessage,
} from "../../entities/ai-conversation/model/ai-conversation.types";

export function AiAssistantPage() {
  const queryClient = useQueryClient();

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const [message, setMessage] = useState("");

  const [editingConversationId, setEditingConversationId] = useState<
    string | null
  >(null);
  const [editingTitle, setEditingTitle] = useState("");

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const conversationsQuery = useQuery({
    queryKey: ["ai-conversations"],
    queryFn: getAiConversations,
  });

  const conversationQuery = useQuery({
    queryKey: ["ai-conversation", activeConversationId],

    queryFn: () => getAiConversation(activeConversationId!),

    enabled: Boolean(activeConversationId),
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (activeConversationId || !conversationsQuery.data?.length) {
      return;
    }

    setActiveConversationId(conversationsQuery.data[0].id);
  }, [activeConversationId, conversationsQuery.data]);

  const createMutation = useMutation({
    mutationFn: createAiConversation,

    onSuccess: async (conversation) => {
      setActiveConversationId(conversation.id);

      await queryClient.invalidateQueries({
        queryKey: ["ai-conversations"],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAiConversation,

    onSuccess: async (_, deletedId) => {
      if (activeConversationId === deletedId) {
        setActiveConversationId(null);
      }

      await queryClient.invalidateQueries({
        queryKey: ["ai-conversations"],
      });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      renameAiConversation(id, title),

    onSuccess: async (_, variables) => {
      setEditingConversationId(null);
      setEditingTitle("");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ai-conversations"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["ai-conversation", variables.id],
        }),
      ]);
    },
  });

  async function handleSend(): Promise<void> {
    const content = message.trim();

    if (!content || isStreaming) {
      return;
    }

    const controller = new AbortController();
    setMessage("");
    setStreamError(null);
    setIsStreaming(true);
    abortControllerRef.current = controller;

    let conversationId = activeConversationId;
    try {
      if (!conversationId) {
        const conversation = await createMutation.mutateAsync();

        conversationId = conversation.id;

        setActiveConversationId(conversationId);
      }
      const resolvedConversationId: string = conversationId;

      const optimisticUserId = `optimistic-user-${crypto.randomUUID()}`;

      const streamingAssistantId = `streaming-assistant-${crypto.randomUUID()}`;

      const optimisticUserMessage: AiMessage = {
        id: optimisticUserId,
        conversationId: resolvedConversationId,
        role: "USER",
        content,
        sources: null,
        createdAt: new Date().toISOString(),
      };

      const optimisticAssistantMessage: AiMessage = {
        id: streamingAssistantId,
        conversationId: resolvedConversationId,
        role: "ASSISTANT",
        content: "",
        sources: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<AiConversation>(
        ["ai-conversation", resolvedConversationId],
        (old) => {
          if (!old) {
            return old;
          }

          return {
            ...old,
            messages: [
              ...old.messages,
              optimisticUserMessage,
              optimisticAssistantMessage,
            ],
          };
        },
      );

      await streamAiMessage(
        resolvedConversationId,
        content,
        {
          onSources: (sources) => {
            queryClient.setQueryData<AiConversation>(
              ["ai-conversation", conversationId],
              (old) => {
                if (!old) {
                  return old;
                }

                return {
                  ...old,
                  messages: old.messages.map((item) =>
                    item.id === streamingAssistantId
                      ? {
                          ...item,
                          sources,
                        }
                      : item,
                  ),
                };
              },
            );
          },
          onDelta(delta) {
            queryClient.setQueryData<AiConversation>(
              ["ai-conversation", conversationId],
              (old) => {
                if (!old) {
                  return old;
                }

                return {
                  ...old,
                  messages: old.messages.map((item) =>
                    item.id === streamingAssistantId
                      ? {
                          ...item,
                          content: item.content + delta,
                        }
                      : item,
                  ),
                };
              },
            );
          },
          onDone: (assistantMessage) => {
            queryClient.setQueryData<AiConversation>(
              ["ai-conversation", conversationId],
              (old) => {
                if (!old) {
                  return old;
                }

                return {
                  ...old,
                  messages: old.messages.map((item) =>
                    item.id === streamingAssistantId ? assistantMessage : item,
                  ),
                };
              },
            );
          },
        },
        controller.signal,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ai-conversation", conversationId],
        }),

        queryClient.invalidateQueries({
          queryKey: ["ai-conversations"],
        }),
      ]);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        await queryClient.invalidateQueries({
          queryKey: ["ai-conversation", conversationId],
        });
        return;
      }
      console.error("AI streaming error:", error);

      setStreamError(
        error instanceof Error ? error.message : "Failed to send message.",
      );
      await queryClient.invalidateQueries({
        queryKey: ["ai-conversation", conversationId],
      });
    } finally {
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }

  const conversations = conversationsQuery.data ?? [];

  const messages = conversationQuery.data?.messages ?? [];

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length, lastMessage?.content]);

  function startRename(id: string, currentTitle: string | null): void {
    setEditingConversationId(id);
    setEditingTitle(currentTitle ?? "");
  }

  function saveRename(id: string): void {
    const title = editingTitle.trim();
    if (!title) {
      return;
    }

    renameMutation.mutate({
      id,
      title,
    });
  }

  function cancelRename(): void {
    setEditingConversationId(null);
    setEditingTitle("");
  }

  function handleStopGenerating(): void {
    abortControllerRef.current?.abort();
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border bg-white">
      <aside className="flex w-72 shrink-0 flex-col border-r bg-gray-50">
        <div className="border-b p-4">
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || isStreaming}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "+ New Chat"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {conversations.length === 0 && (
            <p className="p-3 text-sm text-gray-400">No conversations yet.</p>
          )}

          <div className="space-y-1">
            {conversations.map((conversation) => {
              const active = conversation.id === activeConversationId;

              return (
                <div
                  key={conversation.id}
                  className={[
                    "group rounded-xl",
                    active ? "bg-white shadow-sm" : "hover:bg-white",
                  ].join(" ")}
                >
                  {editingConversationId === conversation.id ? (
                    <div className="p-2">
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(event) =>
                          setEditingTitle(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            saveRename(conversation.id);
                          }

                          if (event.key === "Escape") {
                            cancelRename();
                          }
                        }}
                        disabled={renameMutation.isPending}
                        className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <div className="mt-2 flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={cancelRename}
                          disabled={renameMutation.isPending}
                          className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() => saveRename(conversation.id)}
                          disabled={
                            renameMutation.isPending || !editingTitle.trim()
                          }
                          className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                        >
                          {renameMutation.isPending ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setActiveConversationId(conversation.id)}
                        className="min-w-0 flex-1 px-3 py-3 text-left"
                      >
                        <p className="truncate text-sm font-medium text-gray-900">
                          {conversation.title ?? "New conversation"}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {conversation._count.messages} messages
                        </p>
                      </button>

                      <div className="rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40">
                        <button
                          type="button"
                          disabled={isStreaming}
                          onClick={() =>
                            startRename(conversation.id, conversation.title)
                          }
                          className="rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                        >
                          Rename
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(conversation.id)}
                          disabled={deleteMutation.isPending || isStreaming}
                          className="rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="border-b px-6 py-4">
          <h1 className="text-xl font-semibold">AI Assistant</h1>

          <p className="mt-1 text-sm text-gray-500">
            Ask questions about your companies, contacts and leads.
          </p>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-6">
          {!activeConversationId && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Start a conversation
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Create a new chat or select one from the sidebar.
                </p>
              </div>
            </div>
          )}

          {activeConversationId && conversationQuery.isLoading && (
            <p className="text-sm text-gray-400">Loading conversation...</p>
          )}

          {messages.map((chatMessage) => (
            <div
              key={chatMessage.id}
              className={
                chatMessage.role === "USER"
                  ? "ml-auto max-w-[70%]"
                  : "mr-auto max-w-[75%]"
              }
            >
              <div
                className={
                  chatMessage.role === "USER"
                    ? "rounded-2xl bg-blue-600 px-4 py-3 text-white"
                    : "rounded-2xl border bg-white px-4 py-3 text-gray-900"
                }
              >
                <div className="whitespace-pre-wrap text-sm">
                  {chatMessage.content || (
                    <span className="text-gray-400">Thinking...</span>
                  )}
                  {isStreaming &&
                    chatMessage.role === "ASSISTANT" &&
                    chatMessage.id.startsWith("streaming-assistant-") &&
                    chatMessage.content && (
                      <span className="ml-0.5 inline-block animate-pulse">
                        ▍
                      </span>
                    )}
                </div>

                {chatMessage.role === "ASSISTANT" &&
                  chatMessage.sources &&
                  chatMessage.sources.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <p className="mb-2 text-xs font-medium text-gray-500">
                        Sources
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {chatMessage.sources.map((source) => (
                          <span
                            key={`${source.documentId}-${source.chunkIndex}`}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
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

          <div ref={bottomRef} />
        </div>

        <div className="border-t p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
            className="flex gap-3"
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={isStreaming}
              placeholder={
                isStreaming
                  ? "AI is responding..."
                  : "Ask anything about your CRM..."
              }
              className="flex-1 rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopGenerating}
                className="rounded-xl bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!message.trim()}
                className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white disabled:opacity-50"
              >
                Send
              </button>
            )}
          </form>

          {streamError && (
            <p className="mt-2 text-sm text-red-600">{streamError}</p>
          )}
        </div>
      </section>
    </div>
  );
}
