// Roles d'agent Valorant.
export const GAME_ROLES = [
  { value: 'DUELIST', label: 'Duelliste' },
  { value: 'INITIATOR', label: 'Initiateur' },
  { value: 'CONTROLLER', label: 'Controleur' },
  { value: 'SENTINEL', label: 'Sentinelle' },
];

export const RANK_TIERS = [
  { value: 'FER', label: 'Fer' },
  { value: 'BRONZE', label: 'Bronze' },
  { value: 'ARGENT', label: 'Argent' },
  { value: 'OR', label: 'Or' },
  { value: 'PLATINE', label: 'Platine' },
  { value: 'DIAMANT', label: 'Diamant' },
  { value: 'ASCENDANT', label: 'Ascendant' },
  { value: 'IMMORTEL', label: 'Immortel' },
  { value: 'RADIANT', label: 'Radiant' },
];

// Radiant n'a pas de division.
export const RANKS_WITHOUT_DIVISION = ['RADIANT'];

export const RANK_DIVISIONS = ['1', '2', '3'];

export const AVAILABILITY_SLOTS = [
  { value: 'MATIN', label: 'Matin' },
  { value: 'APRES_MIDI', label: 'Apres-midi' },
  { value: 'SOIR', label: 'Soir' },
  { value: 'NUIT', label: 'Nuit' },
  { value: 'WEEKEND', label: 'Week-end' },
];

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

export function getRankLabel(tier, division) {
  const tierEntry = RANK_TIERS.find((t) => t.value === tier);
  if (!tierEntry) return 'Non classe';
  if (RANKS_WITHOUT_DIVISION.includes(tier)) return tierEntry.label;
  return division ? `${tierEntry.label} ${division}` : tierEntry.label;
}

export function getGameRoleLabel(role) {
  return GAME_ROLES.find((r) => r.value === role)?.label ?? role;
}

export function getAvailabilityLabel(slot) {
  return AVAILABILITY_SLOTS.find((s) => s.value === slot)?.label ?? slot;
}
