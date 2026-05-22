import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { Button } from '../ui/button';

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

        <nav className="flex items-center gap-4">
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
              <Link to="/analyze">
                <Button size="sm" variant="primary">New Analysis</Button>
              </Link>
              <button
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
              <Link to="/register">
                <Button size="sm" variant="primary">Sign Up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
