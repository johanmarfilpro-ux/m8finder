import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useDatabase } from '../hooks/useDatabase.js';
import { useToast } from '../hooks/useToast.js';
import Button from '../components/common/Button.jsx';
import { inputClassName } from '../components/common/FormField.jsx';
import ReportProfileModal from '../components/profile/ReportProfileModal.jsx';

function formatRelativeTime(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "a l'instant";
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  return `il y a ${diffDays} j`;
}

export default function ConversationPage() {
  const { conversationId } = useParams();
  const { currentUser } = useAuth();
  const { conversations, getProfileByUserId, isUserAdmin, fetchMessages, sendMessage, markConversationRead, createReport } =
    useDatabase();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [reportedMessageId, setReportedMessageId] = useState(null);

  const conversation = conversations.find((c) => c.id === conversationId);
  const otherUserId = conversation
    ? conversation.userAId === currentUser.id
      ? conversation.userBId
      : conversation.userAId
    : null;
  const otherProfile = otherUserId ? getProfileByUserId(otherUserId) : null;
  const isOtherAdmin = otherUserId ? isUserAdmin(otherUserId) : false;

  async function loadMessages() {
    setIsLoading(true);
    try {
      const data = await fetchMessages(conversationId);
      setMessages(data);
    } catch (error) {
      showToast(`Erreur lors du chargement des messages : ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
    markConversationRead(conversationId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  if (!conversation) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-slate-400">Cette conversation n'existe pas ou plus.</p>
        <Link to="/messages" className="mt-4 inline-block text-brand-400 hover:text-brand-300">
          Retour aux messages
        </Link>
      </div>
    );
  }

  async function handleSend(event) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setIsSending(true);
    try {
      await sendMessage({ conversationId, content: trimmed });
      setContent('');
      await loadMessages();
    } catch (error) {
      showToast(`Erreur lors de l'envoi du message : ${error.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  }

  async function handleReportSubmit({ reason, details }) {
    try {
      await createReport({
        reporterId: currentUser.id,
        reportedUserId: otherUserId,
        reason,
        details,
        messageId: reportedMessageId,
      });
      setReportedMessageId(null);
      showToast('Signalement envoye. Un administrateur va examiner ce message.', 'success');
    } catch (error) {
      showToast(`Erreur lors de l'envoi du signalement : ${error.message}`, 'error');
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 py-6">
      <div className="mb-4 flex items-center gap-3 border-b border-surface-border pb-4">
        <Link to="/messages" className="text-slate-400 hover:text-slate-100" aria-label="Retour aux messages">
          ←
        </Link>
        {otherUserId && (
          <Link
            to={`/joueurs/${otherUserId}`}
            className={`font-semibold hover:underline ${isOtherAdmin ? 'text-orange-400' : 'text-slate-100'}`}
          >
            {isOtherAdmin && '[ADMIN] '}
            {otherProfile?.displayName ?? 'Joueur inconnu'}
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">Chargement...</p>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Aucun message. Dis bonjour a {otherProfile?.displayName ?? 'ce joueur'} !
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((message) => {
              const isOwn = message.senderId === currentUser.id;
              return (
                <li key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`group max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm ${
                        isOwn
                          ? 'rounded-br-sm bg-brand-500 text-white'
                          : 'rounded-bl-sm border border-surface-border bg-surface-soft text-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-line break-words">{message.content}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2 px-1">
                      <span className="text-[11px] text-slate-500">{formatRelativeTime(message.createdAt)}</span>
                      {!isOwn && (
                        <button
                          type="button"
                          onClick={() => setReportedMessageId(message.id)}
                          className="text-[11px] text-slate-500 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                        >
                          Signaler
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2 border-t border-surface-border pt-4">
        <input
          type="text"
          className={inputClassName}
          placeholder="Ecris un message..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={2000}
        />
        <Button type="submit" variant="primary" disabled={isSending || !content.trim()}>
          Envoyer
        </Button>
      </form>

      <ReportProfileModal
        isOpen={Boolean(reportedMessageId)}
        onClose={() => setReportedMessageId(null)}
        onSubmit={handleReportSubmit}
        reportedDisplayName={otherProfile?.displayName ?? 'ce joueur'}
      />
    </div>
  );
}
