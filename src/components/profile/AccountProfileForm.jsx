import { useState } from 'react';
import Button from '../common/Button.jsx';
import FormField, { inputClassName } from '../common/FormField.jsx';

const emptyProfile = { displayName: '', bio: '', discordTag: '', isAvailable: false };

export default function AccountProfileForm({ initialProfile, onSubmit, isSubmitting }) {
  const [formState, setFormState] = useState({ ...emptyProfile, ...initialProfile });

  function updateField(field) {
    return (event) => setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(formState);
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
