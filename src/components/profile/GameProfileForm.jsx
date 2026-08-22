import { useMemo, useState } from 'react';
import { rankHasDivision } from '../../data/constants.js';
import Button from '../common/Button.jsx';
import FormField, { inputClassName } from '../common/FormField.jsx';
import ChipMultiSelect from '../common/ChipMultiSelect.jsx';

export default function GameProfileForm({
  games,
  availableGameIds,
  initialGameProfile,
  onSubmit,
  onCancel,
  isSubmitting,
}) {
  const isEditing = Boolean(initialGameProfile);
  const selectableGames = isEditing ? games : games.filter((game) => availableGameIds.includes(game.id));
  const initialGame = isEditing
    ? games.find((game) => game.id === initialGameProfile.gameId)
    : selectableGames[0];

  const [gameId, setGameId] = useState(initialGameProfile?.gameId ?? initialGame?.id ?? '');
  const [inGameId, setInGameId] = useState(initialGameProfile?.inGameId ?? '');
  const [roles, setRoles] = useState(initialGameProfile?.roles ?? []);
  const [rankTier, setRankTier] = useState(initialGameProfile?.rankTier ?? initialGame?.ranks[0]?.value ?? '');
  const [rankDivision, setRankDivision] = useState(
    initialGameProfile?.rankDivision ?? initialGame?.divisions[0] ?? null
  );
  const [validationError, setValidationError] = useState('');

  const game = useMemo(() => games.find((g) => g.id === gameId) ?? null, [games, gameId]);
  const requiresDivision = game ? rankHasDivision(game, rankTier) : false;

  function handleGameChange(event) {
    const nextGameId = event.target.value;
    const nextGame = games.find((g) => g.id === nextGameId);
    setGameId(nextGameId);
    setRoles([]);
    setRankTier(nextGame?.ranks[0]?.value ?? '');
    setRankDivision(nextGame?.divisions[0] ?? null);
  }

  function handleRankChange(event) {
    const nextTier = event.target.value;
    setRankTier(nextTier);
    setRankDivision(game && rankHasDivision(game, nextTier) ? game.divisions[0] ?? null : null);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!gameId) {
      setValidationError('Choisis un jeu.');
      return;
    }
    if (roles.length === 0) {
      setValidationError('Selectionne au moins un role.');
      return;
    }
    setValidationError('');
    onSubmit({
      gameId,
      inGameId,
      roles,
      rankTier,
      rankDivision: requiresDivision ? rankDivision : null,
    });
  }

  if (!isEditing && selectableGames.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-surface-border p-4 text-sm text-slate-500">
        Tu as deja un profil pour tous les jeux disponibles.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-xl border border-surface-border bg-surface-soft p-4"
    >
      <FormField label="Jeu" htmlFor="gameId">
        {isEditing ? (
          <p className="text-sm font-medium text-slate-100">{game?.label}</p>
        ) : (
          <select id="gameId" className={inputClassName} value={gameId} onChange={handleGameChange}>
            {selectableGames.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <FormField
        label="Identifiant in-game"
        htmlFor="inGameId"
        hint="Pseudo#TAG, Steam ID, Battle.net tag... selon le jeu. Saisie libre, non verifiee."
      >
        <input
          id="inGameId"
          type="text"
          required
          className={inputClassName}
          value={inGameId}
          onChange={(event) => setInGameId(event.target.value)}
          placeholder="ToiMeme#EU"
        />
      </FormField>

      <FormField label="Roles" hint="Selectionne tous les roles que tu joues.">
        <ChipMultiSelect options={game?.roles ?? []} value={roles} onChange={setRoles} />
      </FormField>

      <FormField label="Rang" htmlFor="rankTier">
        <select id="rankTier" className={inputClassName} value={rankTier} onChange={handleRankChange}>
          {(game?.ranks ?? []).map((rank) => (
            <option key={rank.value} value={rank.value}>
              {rank.label}
            </option>
          ))}
        </select>
      </FormField>

      {requiresDivision && (
        <FormField label="Division" htmlFor="rankDivision">
          <select
            id="rankDivision"
            className={inputClassName}
            value={rankDivision ?? ''}
            onChange={(event) => setRankDivision(event.target.value)}
          >
            {(game?.divisions ?? []).map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </select>
        </FormField>
      )}

      {validationError && <p className="text-sm text-red-400">{validationError}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : isEditing ? 'Mettre a jour' : 'Ajouter ce jeu'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
