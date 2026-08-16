import { REPORT_STATUS } from '../../data/constants.js';
import { useDatabase } from '../../hooks/useDatabase.js';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';

const STATUS_TONE = {
  [REPORT_STATUS.PENDING]: 'warning',
  [REPORT_STATUS.REVIEWED]: 'success',
  [REPORT_STATUS.DISMISSED]: 'neutral',
};

export default function ReportsTable({ reports, usersById, onBanReportedUser, onSuspendReportedUser }) {
  const { updateReportStatus } = useDatabase();

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-surface-border p-8 text-center text-sm text-slate-500">
        Aucun signalement pour le moment.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border">
      <table className="min-w-full divide-y divide-surface-border text-sm">
        <thead className="bg-surface-soft text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Signale</th>
            <th className="px-4 py-3">Par</th>
            <th className="px-4 py-3">Motif</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {reports.map((report) => {
            const reportedUser = usersById[report.reportedUserId];
            const reporterUser = usersById[report.reporterId];
            return (
              <tr key={report.id} className="align-top">
                <td className="px-4 py-3 font-medium text-slate-200">
                  {reportedUser?.username ?? 'Compte supprime'}
                </td>
                <td className="px-4 py-3 text-slate-400">{reporterUser?.username ?? 'Inconnu'}</td>
                <td className="px-4 py-3 text-slate-400">
                  <p>{report.reason}</p>
                  {report.details && <p className="mt-1 text-xs text-slate-500">{report.details}</p>}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[report.status]}>{report.status.replace('_', ' ')}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {report.status === REPORT_STATUS.PENDING && (
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        onClick={() => updateReportStatus(report.id, REPORT_STATUS.DISMISSED)}
                      >
                        Rejeter
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      onClick={() => onSuspendReportedUser(report)}
                    >
                      Suspendre
                    </Button>
                    <Button
                      variant="danger"
                      className="px-2 py-1 text-xs"
                      onClick={() => onBanReportedUser(report)}
                    >
                      Bannir
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
