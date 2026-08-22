import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useDatabase } from '../hooks/useDatabase.js';

function formatRelativeTime(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "a l'instant";
  if (diffHours < 24) return `il y a ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  return `il y a ${diffDays} j`;
}

export default function MessagesPage() {
  const { currentUser } = useAuth();
  const { conversations, unreadMessages, getProfileByUserId, isUserAdmin } = useDatabase();

  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-slate-100">Messages</h1>

      {sortedConversations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-surface-border p-6 text-center text-sm text-slate-500">
          Aucune conversation pour le moment. Contacte un joueur depuis la{' '}
          <Link to="/recherche" className="text-brand-400 hover:text-brand-300">
            recherche
          </Link>{' '}
          pour demarrer une discussion.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sortedConversations.map((conversation) => {
            const otherUserId =
              conversation.userAId === currentUser.id ? conversation.userBId : conversation.userAId;
            const otherProfile = getProfileByUserId(otherUserId);
            const unreadCount = unreadMessages.filter(
              (message) => message.conversationId === conversation.id
            ).length;
            const isOtherAdmin = isUserAdmin(otherUserId);

            return (
              <li key={conversation.id}>
                <Link
                  to={`/messages/${conversation.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-soft px-4 py-3 transition hover:border-brand-500/40"
                >
                  <div className="min-w-0">
                    <p className={`truncate font-medium ${isOtherAdmin ? 'text-orange-400' : 'text-slate-100'}`}>
                      {isOtherAdmin && '[ADMIN] '}
                      {otherProfile?.displayName ?? 'Joueur inconnu'}
                    </p>
                    <p className="text-xs text-slate-500">{formatRelativeTime(conversation.lastMessageAt)}</p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
