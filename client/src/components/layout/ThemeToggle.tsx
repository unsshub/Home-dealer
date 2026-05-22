import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('light', !dark);
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Toggle theme"
    >
      {dark ? '\u2600' : '\u263E'}
    </button>
  );
}
