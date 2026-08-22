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
