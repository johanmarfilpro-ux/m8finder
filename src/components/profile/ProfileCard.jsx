import { Link } from 'react-router-dom';
import { getPlatformLabel, getRankLabel, getRoleLabel } from '../../data/constants.js';
import { useDatabase } from '../../hooks/useDatabase.js';
import Badge from '../common/Badge.jsx';

export default function ProfileCard({ profile, gameProfile, game }) {
  const { isUserAdmin } = useDatabase();
  const isAdmin = isUserAdmin(profile.userId);

  return (
    <Link
      to={`/joueurs/${profile.userId}`}
      className="flex flex-col gap-3 rounded-xl border border-surface-border bg-surface-soft p-4 transition hover:border-brand-500/50 hover:bg-surface-border/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className={`font-semibold ${isAdmin ? 'text-orange-400' : 'text-slate-100'}`}>
            {isAdmin && '[ADMIN] '}
            {profile.displayName}
          </h3>
          <p className="text-xs text-slate-500">{gameProfile.inGameId}</p>
        </div>
        {profile.isAvailable && (
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Disponible
          </span>
        )}
      </div>

      <p className="line-clamp-2 text-sm text-slate-400">{profile.bio || 'Pas encore de bio.'}</p>

      <div className="flex flex-wrap gap-1.5">
        {gameProfile.platform !== 'NONE' && (
          <Badge tone="neutral">{getPlatformLabel(game, gameProfile.platform)}</Badge>
        )}
        {gameProfile.roles.map((role) => (
          <Badge key={role} tone="brand">
            {getRoleLabel(game, role)}
          </Badge>
        ))}
        <Badge tone="success">{getRankLabel(game, gameProfile.rankTier, gameProfile.rankDivision)}</Badge>
      </div>
    </Link>
  );
}
