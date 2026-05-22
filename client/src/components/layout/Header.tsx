import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-primary border-b-2 border-accent">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-serif text-lg font-bold text-accent tracking-tight">
          DSCR Verdict
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-4">
          <Link
            to="/pricing"
            className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            Pricing
          </Link>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/analyze"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs font-medium transition-colors"
              >
                New Analysis
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs font-medium transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
