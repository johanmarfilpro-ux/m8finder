import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Button from '../components/common/Button.jsx';

const FEATURES = [
  {
    title: 'Profil complet',
    description: 'Renseigne ton role, ton rang et tes disponibilites pour etre trouve facilement.',
  },
  {
    title: 'Recherche filtree',
    description: 'Filtre les joueurs par role, rang et creneaux horaires compatibles avec les tiens.',
  },
  {
    title: 'Alertes de match',
    description: 'Recois une notification quand de nouveaux joueurs correspondent a tes criteres.',
  },
  {
    title: 'Communaute moderee',
    description: 'Signale les profils problematiques ; notre equipe intervient rapidement.',
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/recherche" replace />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <h1 className="text-4xl font-extrabold text-slate-100 sm:text-5xl">
        Trouve tes prochains <span className="text-brand-400">coequipiers</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-slate-400">
        M8Finder connecte des joueurs de Valorant selon leur role, leur rang et leurs
        disponibilites, pour former des duos et des teams qui matchent vraiment.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button as={Link} to="/inscription" variant="primary">
          Creer un compte
        </Button>
        <Button as={Link} to="/connexion" variant="secondary">
          J'ai deja un compte
        </Button>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-xl border border-surface-border bg-surface-soft p-5">
            <h2 className="font-semibold text-slate-100">{feature.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
