import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import Button from '../components/common/Button.jsx';
import FormField, { inputClassName } from '../components/common/FormField.jsx';
import PasswordInput from '../components/common/PasswordInput.jsx';

const initialFormState = { username: '', email: '', password: '', confirmPassword: '' };

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formState, setFormState] = useState(initialFormState);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field) {
    return (event) => setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (formState.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }
    if (formState.password !== formState.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { needsEmailConfirmation } = await register(formState);
      if (needsEmailConfirmation) {
        showToast('Compte cree ! Verifie ta boite mail pour confirmer ton compte avant de te connecter.', 'success');
        navigate('/connexion', { replace: true });
      } else {
        showToast(`Bienvenue sur M8Finder, ${formState.username} !`, 'success');
        navigate('/profil', { replace: true });
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-slate-100">Creer un compte</h1>
      <p className="mb-6 text-sm text-slate-400">
        Rejoins M8Finder pour completer ton profil et trouver des coequipiers.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Pseudo" htmlFor="username">
          <input
            id="username"
            type="text"
            required
            minLength={3}
            className={inputClassName}
            value={formState.username}
            onChange={updateField('username')}
            placeholder="MonPseudoValorant"
            autoComplete="username"
          />
        </FormField>

        <FormField label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            className={inputClassName}
            value={formState.email}
            onChange={updateField('email')}
            placeholder="toi@example.com"
            autoComplete="email"
          />
        </FormField>

        <FormField label="Mot de passe" htmlFor="password" hint="6 caracteres minimum.">
          <PasswordInput
            id="password"
            required
            value={formState.password}
            onChange={updateField('password')}
            autoComplete="new-password"
          />
        </FormField>

        <FormField label="Confirmer le mot de passe" htmlFor="confirmPassword">
          <PasswordInput
            id="confirmPassword"
            required
            value={formState.confirmPassword}
            onChange={updateField('confirmPassword')}
            autoComplete="new-password"
          />
        </FormField>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creation...' : 'Creer mon compte'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        Deja un compte ?{' '}
        <Link to="/connexion" className="font-medium text-yang-300 hover:text-yang-50">
          Connecte-toi
        </Link>
      </p>
    </div>
  );
}
