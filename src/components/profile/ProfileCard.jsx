import { Link } from 'react-router-dom';
import { getPlatformLabel, getRankLabel, getRoleLabel } from '../../data/constants.js';
import { useDatabase } from '../../hooks/useDatabase.js';
import Badge from '../common/Badge.jsx';
import ProfileBanner from './ProfileBanner.jsx';

export default function ProfileCard({ profile, gameProfile, game }) {
  const { isUserAdmin } = useDatabase();
  const isAdmin = isUserAdmin(profile.userId);

  return (
    <Link
      to={`/joueurs/${profile.userId}`}
      className="relative flex flex-col overflow-hidden rounded-xl border border-surface-border transition hover:border-yang-300/50"
    >
      <ProfileBanner profile={profile} className="absolute inset-0 h-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/60 to-black/75" />

      <div className="relative z-10 flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className={`font-semibold drop-shadow ${isAdmin ? 'text-orange-400' : 'text-white'}`}>
              {isAdmin && '[ADMIN] '}
              {profile.displayName}
            </h3>
            <p className="text-xs text-slate-300 drop-shadow">{gameProfile.inGameId}</p>
          </div>
          {profile.isAvailable && (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Disponible
            </span>
          )}
        </div>

        {profile.bio && <p className="line-clamp-2 text-sm text-slate-200 drop-shadow">{profile.bio}</p>}

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
      </div>
    </Link>
  );
}
