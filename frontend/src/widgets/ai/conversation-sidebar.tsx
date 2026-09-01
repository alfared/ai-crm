import type { AiConversationListItem } from "../../entities/ai-conversation/model/ai-conversation.types";
type Props = {
  conversations: AiConversationListItem[];
  activeConversationId: string | null;
  isCreating: boolean;

  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

export function ConversationSidebar({
  conversations,
  activeConversationId,
  isCreating,
  onSelect,
  onCreate,
  onDelete,
}: Props) {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <button
          type="button"
          onClick={onCreate}
          disabled={isCreating}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "+ New chat"}
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {conversations.length === 0 && (
          <p className="px-3 py-4 text-sm text-slate-500">
            No conversations yet.
          </p>
        )}

        {conversations.map((conversation) => {
          const active = conversation.id === activeConversationId;
          return (
            <div
              key={conversation.id}
              className={[
                "group flex items-center rounded-xl",
                active ? "bg-slate-100" : "hover:bg-slate-50",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                className="min-w-0 flex-1 px-3 py-3 text-left"
              >
                {" "}
                <p className="truncate text-sm font-medium text-slate-900">
                  {conversation.title ?? "New conversation"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {conversation._count.messages} messages
                </p>
              </button>

              <button
                type="button"
                onClick={() => onDelete(conversation.id)}
                className="mr-2 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
