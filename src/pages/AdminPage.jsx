import { useCallback, useEffect, useState } from 'react';
import { ACCOUNT_STATUS, REPORT_STATUS } from '../data/constants.js';
import { useDatabase } from '../hooks/useDatabase.js';
import { useToast } from '../hooks/useToast.js';
import { supabase } from '../lib/supabaseClient.js';
import ReportsTable from '../components/admin/ReportsTable.jsx';
import UsersTable from '../components/admin/UsersTable.jsx';

const TABS = [
  { value: 'reports', label: 'Signalements' },
  { value: 'users', label: 'Comptes joueurs' },
];

export default function AdminPage() {
  const { reports, accountStatusByUserId, setUserStatus, updateReportStatus } = useDatabase();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('reports');
  const [usersById, setUsersById] = useState({});
  const [adminIds, setAdminIds] = useState(new Set());
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    const [appUsersResult, adminsResult] = await Promise.all([
      supabase.from('app_users').select('id, username, email'),
      supabase.from('admins').select('user_id'),
    ]);

    if (appUsersResult.error) {
      showToast(`Erreur chargement des comptes : ${appUsersResult.error.message}`, 'error');
    } else {
      const map = {};
      appUsersResult.data.forEach((row) => {
        map[row.id] = { username: row.username, email: row.email };
      });
      setUsersById(map);
    }

    if (!adminsResult.error) {
      setAdminIds(new Set(adminsResult.data.map((row) => row.user_id)));
    }

    setIsLoadingUsers(false);
  }, [showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const pendingCount = reports.filter((report) => report.status === REPORT_STATUS.PENDING).length;

  const players = Object.entries(usersById)
    .filter(([id]) => !adminIds.has(id))
    .map(([id, info]) => ({
      id,
      username: info.username,
      email: info.email,
      status: accountStatusByUserId[id] ?? ACCOUNT_STATUS.ACTIVE,
    }));

  async function handleModerationAction(report, status) {
    try {
      await setUserStatus(report.reportedUserId, status);
      await updateReportStatus(report.id, REPORT_STATUS.REVIEWED);
      showToast(`Compte mis a jour : ${status.toLowerCase()}.`, 'success');
    } catch (error) {
      showToast(`Erreur : ${error.message}`, 'error');
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-slate-100">Administration</h1>
      <p className="mb-6 text-sm text-slate-400">
        Modere les profils signales et gere le statut des comptes joueurs.
        {pendingCount > 0 && ` ${pendingCount} signalement(s) en attente.`}
      </p>

      <div className="mb-6 flex gap-2 border-b border-surface-border">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-2 text-sm font-medium transition ${
              activeTab === tab.value
                ? 'border-b-2 border-yang-100 text-yang-50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'reports' ? (
        <ReportsTable
          reports={reports}
          usersById={usersById}
          onBanReportedUser={(report) => handleModerationAction(report, ACCOUNT_STATUS.BANNED)}
          onSuspendReportedUser={(report) => handleModerationAction(report, ACCOUNT_STATUS.SUSPENDED)}
        />
      ) : isLoadingUsers ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <UsersTable players={players} />
      )}
    </div>
  );
}
