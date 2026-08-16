import { Link } from 'react-router-dom';
import { getAvailabilityLabel, getGameRoleLabel, getRankLabel } from '../../data/constants.js';
import Badge from '../common/Badge.jsx';

export default function ProfileCard({ profile }) {
  return (
    <Link
      to={`/joueurs/${profile.userId}`}
      className="flex flex-col gap-3 rounded-xl border border-surface-border bg-surface-soft p-4 transition hover:border-brand-500/50 hover:bg-surface-border/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-100">{profile.displayName}</h3>
          <p className="text-xs text-slate-500">{profile.riotId}</p>
        </div>
        <Badge tone="brand">{getGameRoleLabel(profile.gameRole)}</Badge>
      </div>

      <p className="line-clamp-2 text-sm text-slate-400">{profile.bio || 'Pas encore de bio.'}</p>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="success">{getRankLabel(profile.rankTier, profile.rankDivision)}</Badge>
        {profile.availability.map((slot) => (
          <Badge key={slot} tone="neutral">
            {getAvailabilityLabel(slot)}
          </Badge>
        ))}
      </div>
    </Link>
  );
}
