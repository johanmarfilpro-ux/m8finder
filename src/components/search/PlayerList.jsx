import ProfileCard from '../profile/ProfileCard.jsx';

export default function PlayerList({ profiles }) {
  if (profiles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-surface-border p-10 text-center text-sm text-slate-500">
        Aucun joueur ne correspond a ces criteres pour le moment.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <ProfileCard key={profile.userId} profile={profile} />
      ))}
    </div>
  );
}
