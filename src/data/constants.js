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
