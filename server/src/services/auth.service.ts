import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { usersService } from './users.service.js';

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await usersService.findByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        if (!user.passwordHash) {
          return done(null, false, { message: 'This account uses Google Sign-In' });
        }
        const valid = await usersService.verifyPassword(password, user.passwordHash);
        if (!valid) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        return done(null, { id: user.id, email: user.email });
      } catch (err) {
        return done(err);
      }
    }
  )
);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.CLIENT_URL
  : 'http://localhost:3001';

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${BASE_URL}/api/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(null, false, { message: 'No email from Google' });
          }
          const name = profile.displayName || email.split('@')[0];
          const user = await usersService.createOrLinkGoogle(profile.id, email, name);
          return done(null, { id: user.id, email: user.email });
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await usersService.findById(id);
    if (!user) return done(null, false);
    done(null, { id: user.id, email: user.email });
  } catch (err) {
    done(err);
  }
});
