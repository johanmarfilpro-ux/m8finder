import { ACCOUNT_STATUS } from '../../data/constants.js';
import { useDatabase } from '../../hooks/useDatabase.js';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';

const STATUS_TONE = {
  [ACCOUNT_STATUS.ACTIVE]: 'success',
  [ACCOUNT_STATUS.SUSPENDED]: 'warning',
  [ACCOUNT_STATUS.BANNED]: 'danger',
};

export default function UsersTable({ players }) {
  const { setUserStatus } = useDatabase();

  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-surface-border p-8 text-center text-sm text-slate-500">
        Aucun compte joueur pour le moment.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border">
      <table className="min-w-full divide-y divide-surface-border text-sm">
        <thead className="bg-surface-soft text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Pseudo</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {players.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3 font-medium text-slate-200">{user.username}</td>
              <td className="px-4 py-3 text-slate-400">{user.email}</td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONE[user.status]}>{user.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {user.status !== ACCOUNT_STATUS.ACTIVE && (
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => setUserStatus(user.id, ACCOUNT_STATUS.ACTIVE)}
                    >
                      Reactiver
                    </Button>
                  )}
                  {user.status !== ACCOUNT_STATUS.SUSPENDED && (
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      onClick={() => setUserStatus(user.id, ACCOUNT_STATUS.SUSPENDED)}
                    >
                      Suspendre
                    </Button>
                  )}
                  {user.status !== ACCOUNT_STATUS.BANNED && (
                    <Button
                      variant="danger"
                      className="px-2 py-1 text-xs"
                      onClick={() => setUserStatus(user.id, ACCOUNT_STATUS.BANNED)}
                    >
                      Bannir
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
