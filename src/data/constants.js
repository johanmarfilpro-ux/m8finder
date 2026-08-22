export const ACCOUNT_STATUS = {
  ACTIVE: 'ACTIF',
  SUSPENDED: 'SUSPENDU',
  BANNED: 'BANNI',
};

export const REPORT_STATUS = {
  PENDING: 'EN_ATTENTE',
  REVIEWED: 'TRAITE',
  DISMISSED: 'REJETE',
};

// Presets de banniere de profil : la base ne stocke que la cle choisie
// (banner_color), jamais le degrade en clair, pour eviter d'injecter du
// CSS arbitraire venu de la base dans un attribut style.
export const BANNER_PRESETS = [
  { id: 'ENCRE', label: 'Encre', css: 'linear-gradient(135deg, #0a0a0b, #3f3f46)' },
  { id: 'BRUME', label: 'Brume', css: 'linear-gradient(135deg, #52525b, #f4f4f5)' },
  { id: 'DUO', label: 'Duo', css: 'linear-gradient(135deg, #f4f4f5 0%, #f4f4f5 48%, #0a0a0b 52%, #0a0a0b 100%)' },
  { id: 'BRAISE', label: 'Braise', css: 'linear-gradient(135deg, #0a0a0b, #7f1d1d)' },
  { id: 'ECARLATE', label: 'Ecarlate', css: 'linear-gradient(135deg, #dc2626, #0a0a0b)' },
  { id: 'OCEAN', label: 'Ocean', css: 'linear-gradient(135deg, #0a0a0b, #1e3a8a)' },
  { id: 'EMERAUDE', label: 'Emeraude', css: 'linear-gradient(135deg, #0a0a0b, #065f46)' },
  { id: 'OR', label: 'Or', css: 'linear-gradient(135deg, #0a0a0b, #b45309)' },
];

export const DEFAULT_BANNER_PRESET_ID = 'ENCRE';

export function getBannerPreset(presetId) {
  return BANNER_PRESETS.find((preset) => preset.id === presetId) ?? BANNER_PRESETS[0];
}

export const REPORT_REASONS = [
  'Comportement toxique',
  'Propos injurieux',
  'Faux profil / usurpation',
  'Rang ou role mensonger',
  'Spam ou publicite',
  'Autre',
];

// Les roles/rangs disponibles dependent du jeu (voir la table "games" en
// base) : ces helpers prennent donc l'objet "game" concerne, au lieu de
// s'appuyer sur des enumerations codees en dur pour un seul jeu.

export function getRoleLabel(game, roleValue) {
  return game?.roles.find((r) => r.value === roleValue)?.label ?? roleValue;
}

export function rankHasDivision(game, tier) {
  return game?.ranks.find((r) => r.value === tier)?.hasDivision ?? false;
}

export function getRankLabel(game, tier, division) {
  const rankEntry = game?.ranks.find((r) => r.value === tier);
  if (!rankEntry) return 'Non classe';
  if (!rankEntry.hasDivision) return rankEntry.label;
  return division ? `${rankEntry.label} ${division}` : rankEntry.label;
}

export function getPlatformLabel(game, platformValue) {
  return game?.platforms.find((p) => p.value === platformValue)?.label ?? platformValue;
}

// Un joueur peut avoir un profil par plateforme pour un jeu qui en definit
// (ex: un profil PC et un profil Console pour Valorant), mais un seul
// profil pour un jeu sans plateforme. Ces helpers calculent les "places"
// encore libres pour un jeu donne, en excluant eventuellement le profil
// en cours d'edition (excludeGameProfileId) de la liste des places prises.

export function getUsedPlatformValues(game, existingGameProfiles, excludeGameProfileId) {
  return existingGameProfiles
    .filter((gp) => gp.gameId === game.id && gp.id !== excludeGameProfileId)
    .map((gp) => gp.platform);
}

export function getAvailablePlatforms(game, existingGameProfiles, excludeGameProfileId) {
  const used = getUsedPlatformValues(game, existingGameProfiles, excludeGameProfileId);
  return game.platforms.filter((p) => !used.includes(p.value));
}

export function gameHasFreeSlot(game, existingGameProfiles, excludeGameProfileId) {
  if (game.platforms.length === 0) {
    return getUsedPlatformValues(game, existingGameProfiles, excludeGameProfileId).length === 0;
  }
  return getAvailablePlatforms(game, existingGameProfiles, excludeGameProfileId).length > 0;
}
