import { Link } from 'react-router-dom';
import Button from '../components/common/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-brand-500">404</p>
      <h1 className="mt-2 text-xl font-semibold text-slate-100">Page introuvable</h1>
      <p className="mt-2 text-sm text-slate-400">
        Cette page n'existe pas ou a ete deplacee.
      </p>
      <Button as={Link} to="/" variant="primary" className="mt-6">
        Retour a l'accueil
      </Button>
    </div>
  );
}
