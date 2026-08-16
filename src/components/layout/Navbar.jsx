import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import Button from '../common/Button.jsx';
import NotificationBell from './NotificationBell.jsx';
import AvailabilityToggle from './AvailabilityToggle.jsx';

const linkClassName = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-brand-500/15 text-brand-300' : 'text-slate-300 hover:bg-surface-soft hover:text-slate-100'
  }`;

export default function Navbar() {
  const { currentUser, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/connexion');
  }

  return (
    <header className="sticky top-0 z-20 border-b border-surface-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-bold text-slate-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm">M8</span>
          M8Finder
        </NavLink>

        {isAuthenticated && (
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/recherche" className={linkClassName}>
              Rechercher
            </NavLink>
            <NavLink to="/profil" className={linkClassName}>
              Mon profil
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={linkClassName}>
                Administration
              </NavLink>
            )}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <AvailabilityToggle />
              <NotificationBell />
              <span className="hidden text-sm text-slate-400 sm:inline">{currentUser.username}</span>
              <Button variant="ghost" onClick={handleLogout}>
                Deconnexion
              </Button>
            </>
          ) : (
            <>
              <Button as={NavLink} to="/connexion" variant="ghost">
                Connexion
              </Button>
              <Button as={NavLink} to="/inscription" variant="primary">
                Inscription
              </Button>
            </>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-surface-border px-4 py-2 sm:hidden">
          <NavLink to="/recherche" className={linkClassName}>
            Rechercher
          </NavLink>
          <NavLink to="/profil" className={linkClassName}>
            Mon profil
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={linkClassName}>
              Administration
            </NavLink>
          )}
        </nav>
      )}
    </header>
  );
}
