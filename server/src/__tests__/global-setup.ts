import { execSync } from 'child_process';
import fs from 'fs';

export async function setup() {
  const composeCmd = fs.existsSync('/usr/bin/docker-compose') ? 'docker-compose' : 'docker compose';

  try {
    execSync(`${composeCmd} ps db --format json 2>/dev/null`, { stdio: 'ignore' });
  } catch {
    console.log('Starting Postgres via docker-compose...');
    execSync(`${composeCmd} up -d db`, { stdio: 'inherit' });
    await new Promise((r) => setTimeout(r, 3000));
  }

  execSync('npx drizzle-kit push --force 2>/dev/null', {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}
