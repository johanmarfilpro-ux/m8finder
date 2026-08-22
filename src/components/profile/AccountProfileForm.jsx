import { useState } from 'react';
import Button from '../common/Button.jsx';
import FormField, { inputClassName } from '../common/FormField.jsx';
import ProfileBanner from './ProfileBanner.jsx';
import { useToast } from '../../hooks/useToast.js';
import { useDatabase } from '../../hooks/useDatabase.js';
import { BANNER_PRESETS, DEFAULT_BANNER_PRESET_ID } from '../../data/constants.js';

const emptyProfile = {
  displayName: '',
  bio: '',
  discordTag: '',
  isAvailable: false,
  bannerType: 'COLOR',
  bannerColor: DEFAULT_BANNER_PRESET_ID,
  bannerImageUrl: null,
};

const MAX_BANNER_SIZE_BYTES = 4 * 1024 * 1024;

export default function AccountProfileForm({ initialProfile, onSubmit, isSubmitting }) {
  const [formState, setFormState] = useState({ ...emptyProfile, ...initialProfile });
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const { uploadBannerImage } = useDatabase();
  const { showToast } = useToast();

  function updateField(field) {
    return (event) => setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function selectBannerPreset(presetId) {
    setFormState((prev) => ({ ...prev, bannerType: 'COLOR', bannerColor: presetId }));
  }

  async function handleBannerFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Choisis un fichier image (JPG, PNG, WEBP...).', 'error');
      return;
    }
    if (file.size > MAX_BANNER_SIZE_BYTES) {
      showToast('Image trop lourde (4 Mo maximum).', 'error');
      return;
    }

    setIsUploadingBanner(true);
    try {
      const url = await uploadBannerImage(file);
      setFormState((prev) => ({ ...prev, bannerType: 'IMAGE', bannerImageUrl: url }));
    } catch (error) {
      showToast(`Erreur lors de l'import de l'image : ${error.message}`, 'error');
    } finally {
      setIsUploadingBanner(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(formState);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-300">Banniere de profil</span>
        <ProfileBanner profile={formState} className="h-20 rounded-lg border border-surface-border" />

        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => setFormState((prev) => ({ ...prev, bannerType: 'COLOR' }))}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              formState.bannerType === 'COLOR'
                ? 'bg-yang-50 text-yin-900'
                : 'border border-surface-border text-slate-300 hover:text-slate-100'
            }`}
          >
            Couleur
          </button>
          <label
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              formState.bannerType === 'IMAGE'
                ? 'bg-yang-50 text-yin-900'
                : 'border border-surface-border text-slate-300 hover:text-slate-100'
            }`}
          >
            {isUploadingBanner ? 'Import...' : 'Image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploadingBanner}
              onChange={handleBannerFileChange}
            />
          </label>
        </div>

        {formState.bannerType === 'COLOR' && (
          <div className="mt-1 flex flex-wrap gap-2">
            {BANNER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={preset.label}
                aria-label={preset.label}
                onClick={() => selectBannerPreset(preset.id)}
                style={{ backgroundImage: preset.css }}
                className={`h-9 w-9 rounded-full border-2 transition ${
                  formState.bannerColor === preset.id ? 'border-yang-50' : 'border-surface-border'
                }`}
              />
            ))}
          </div>
        )}
      </div>

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
