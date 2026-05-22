import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
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
