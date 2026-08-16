import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import Button from '../components/common/Button.jsx';
import FormField, { inputClassName } from '../components/common/FormField.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      showToast(`Content de te revoir, ${user.user_metadata?.username ?? user.email} !`, 'success');
      navigate(location.state?.from ?? '/recherche', { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-slate-100">S'authentifier</h1>
      <p className="mb-6 text-sm text-slate-400">
        Connecte-toi pour retrouver des coequipiers a ton rang, sur ton role, quand tu es dispo.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            className={inputClassName}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="toi@example.com"
            autoComplete="username"
          />
        </FormField>

        <FormField label="Mot de passe" htmlFor="password">
          <input
            id="password"
            type="password"
            required
            className={inputClassName}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            autoComplete="current-password"
          />
        </FormField>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        Pas encore de compte ?{' '}
        <Link to="/inscription" className="font-medium text-brand-400 hover:text-brand-300">
          Inscris-toi
        </Link>
      </p>
    </div>
  );
}
