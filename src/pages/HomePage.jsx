import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Button from '../components/common/Button.jsx';
import YinYangMark from '../components/common/YinYangMark.jsx';

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
    <div>
      <div className="relative overflow-hidden">
        <YinYangMark className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/3 opacity-[0.07] blur-[1px]" />

        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-4xl font-extrabold text-slate-100 sm:text-5xl">
            Trouve tes prochains{' '}
            <span className="bg-gradient-to-r from-white to-yang-400 bg-clip-text text-transparent">
              coequipiers
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            M8Finder connecte des joueurs de Valorant selon leur role, leur rang et leurs
            disponibilites, pour former des duos et des teams qui matchent vraiment. Chaque joueur
            a son style ; on t'aide a trouver celui qui le complete.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button as={Link} to="/inscription" variant="primary">
              Creer un compte
            </Button>
            <Button as={Link} to="/connexion" variant="secondary">
              J'ai deja un compte
            </Button>
          </div>
        </div>
      </div>

      <svg viewBox="0 0 1440 60" className="block w-full text-surface-border" preserveAspectRatio="none">
        <path
          d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z"
          fill="currentColor"
        />
      </svg>

      <div className="mx-auto max-w-4xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={`rounded-xl border-l-2 border-surface-border bg-surface-soft p-5 ${
                index % 2 === 0 ? 'border-l-yang-200' : 'border-l-yang-500'
              }`}
            >
              <h2 className="font-semibold text-slate-100">{feature.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
