import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useDatabase } from '../../hooks/useDatabase.js';
import Button from '../common/Button.jsx';
import NotificationBell from './NotificationBell.jsx';
import AvailabilityToggle from './AvailabilityToggle.jsx';
import YinYangMark from '../common/YinYangMark.jsx';

const linkClassName = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-yang-50 text-yin-900' : 'text-slate-300 hover:bg-surface-soft hover:text-slate-100'
  }`;

const mobileLinkClassName = ({ isActive }) =>
  `block rounded-lg px-3 py-2.5 text-base font-medium transition ${
    isActive ? 'bg-yang-50 text-yin-900' : 'text-slate-300 hover:bg-surface-soft hover:text-slate-100'
  }`;

function BurgerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function Navbar() {
  const { currentUser, isAuthenticated, isAdmin, logout } = useAuth();
  const { unreadMessages } = useDatabase();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const unreadMessageCount = isAuthenticated ? unreadMessages.length : 0;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    setIsMenuOpen(false);
    await logout();
    navigate('/connexion');
  }

  return (
    <header className="sticky top-0 z-20 border-b border-surface-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <NavLink to="/" className="flex min-w-0 items-center gap-2 text-lg font-bold text-slate-100">
          <YinYangMark className="h-8 w-8 shrink-0" />
          <span className="truncate">M8Finder</span>
        </NavLink>

        {isAuthenticated && (
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/recherche" className={linkClassName}>
              Rechercher
            </NavLink>
            <NavLink to="/messages" className={linkClassName}>
              Messages
              {unreadMessageCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-yang-100 px-1 text-[10px] font-bold text-yin-900">
                  {unreadMessageCount}
                </span>
              )}
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

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              <AvailabilityToggle />
              <NotificationBell />
              <span className="hidden text-sm text-slate-400 sm:inline">{currentUser.username}</span>
              <Button variant="ghost" onClick={handleLogout} className="hidden sm:inline-flex">
                Deconnexion
              </Button>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={isMenuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-surface-soft text-slate-300 hover:text-slate-100 sm:hidden"
              >
                {isMenuOpen ? <CloseIcon /> : <BurgerIcon />}
              </button>
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

      {isAuthenticated && isMenuOpen && (
        <div className="border-t border-surface-border px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-1">
            <NavLink to="/recherche" className={mobileLinkClassName}>
              Rechercher
            </NavLink>
            <NavLink to="/messages" className={mobileLinkClassName}>
              Messages
              {unreadMessageCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-yang-100 px-1 text-[10px] font-bold text-yin-900">
                  {unreadMessageCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/profil" className={mobileLinkClassName}>
              Mon profil
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={mobileLinkClassName}>
                Administration
              </NavLink>
            )}
          </nav>

          <div className="mt-3 border-t border-surface-border pt-3">
            <span className="text-sm text-slate-400">{currentUser.username}</span>
          </div>

          <Button variant="ghost" onClick={handleLogout} className="mt-3 w-full">
            Deconnexion
          </Button>
        </div>
      )}
    </header>
  );
}
