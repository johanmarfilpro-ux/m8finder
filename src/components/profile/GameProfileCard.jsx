import { getPlatformLabel, getRankLabel, getRoleLabel } from '../../data/constants.js';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';

export default function GameProfileCard({ game, gameProfile, onEdit, onDelete }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-surface-border bg-surface-soft p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-100">{game?.label ?? gameProfile.gameId}</h3>
          <p className="text-xs text-slate-500">{gameProfile.inGameId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={onEdit}>
            Modifier
          </Button>
          <Button variant="danger" className="px-2 py-1 text-xs" onClick={onDelete}>
            Supprimer
          </Button>
        </div>
      </div>

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
  );
}
