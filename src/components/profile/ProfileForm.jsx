import { useState } from 'react';
import {
  GAME_ROLES,
  RANK_TIERS,
  RANK_DIVISIONS,
  RANKS_WITHOUT_DIVISION,
} from '../../data/constants.js';
import Button from '../common/Button.jsx';
import FormField, { inputClassName } from '../common/FormField.jsx';
import AvailabilityPicker from './AvailabilityPicker.jsx';

const emptyProfile = {
  displayName: '',
  riotId: '',
  gameRole: GAME_ROLES[0].value,
  rankTier: RANK_TIERS[0].value,
  rankDivision: RANK_DIVISIONS[0],
  availability: [],
  bio: '',
  discordTag: '',
};

export default function ProfileForm({ initialProfile, onSubmit, isSubmitting }) {
  const [formState, setFormState] = useState({ ...emptyProfile, ...initialProfile });

  const requiresDivision = !RANKS_WITHOUT_DIVISION.includes(formState.rankTier);

  function updateField(field) {
    return (event) => setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      ...formState,
      rankDivision: requiresDivision ? formState.rankDivision : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormField label="Nom affiche" htmlFor="displayName">
        <input
          id="displayName"
          type="text"
          required
          className={inputClassName}
          value={formState.displayName}
          onChange={updateField('displayName')}
          placeholder="Ton pseudo affiche aux autres joueurs"
        />
      </FormField>

      <FormField
        label="Riot ID"
        htmlFor="riotId"
        hint="Format Pseudo#TAG (ex: ToiMeme#EU). Saisie libre, non verifiee."
      >
        <input
          id="riotId"
          type="text"
          required
          className={inputClassName}
          value={formState.riotId}
          onChange={updateField('riotId')}
          placeholder="ToiMeme#EU"
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Role" htmlFor="gameRole">
          <select
            id="gameRole"
            className={inputClassName}
            value={formState.gameRole}
            onChange={updateField('gameRole')}
          >
            {GAME_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Rang" htmlFor="rankTier">
          <select
            id="rankTier"
            className={inputClassName}
            value={formState.rankTier}
            onChange={updateField('rankTier')}
          >
            {RANK_TIERS.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {requiresDivision && (
        <FormField label="Division" htmlFor="rankDivision">
          <select
            id="rankDivision"
            className={inputClassName}
            value={formState.rankDivision ?? RANK_DIVISIONS[0]}
            onChange={updateField('rankDivision')}
          >
            {RANK_DIVISIONS.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <FormField label="Disponibilites" hint="Selectionne tous les creneaux qui te correspondent.">
        <AvailabilityPicker
          value={formState.availability}
          onChange={(availability) => setFormState((prev) => ({ ...prev, availability }))}
        />
      </FormField>

      <FormField label="Discord" htmlFor="discordTag" hint="Utilise pour que les autres joueurs te contactent.">
        <input
          id="discordTag"
          type="text"
          className={inputClassName}
          value={formState.discordTag}
          onChange={updateField('discordTag')}
          placeholder="pseudo#0000"
        />
      </FormField>

      <FormField label="Bio" htmlFor="bio">
        <textarea
          id="bio"
          rows={3}
          className={inputClassName}
          value={formState.bio}
          onChange={updateField('bio')}
          placeholder="Ton style de jeu, tes objectifs, ce que tu recherches chez un coequipier..."
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Enregistrement...' : 'Enregistrer mon profil'}
      </Button>
    </form>
  );
}
