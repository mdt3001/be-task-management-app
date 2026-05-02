import { config } from './app.config';
import passport, { session } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Request } from 'express';
import { NotFoundException } from '../utils/appError';
import { ProviderEnum } from '../enums/account-provider.enum';
import { loginOrCreateAccountService } from '../services/auth.service';
import UserModel from '../models/user.model';
import { Strategy as LocalStrategy } from 'passport-local';
import { verifyUserService } from '../services/auth.service';

passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID || '',
    clientSecret: config.GOOGLE_CLIENT_SECRET || '',
    callbackURL: config.GOOGLE_CALLBACK_URL || '',
    scope: ['profile', 'email'],
    passReqToCallback: true,
}, async (req: Request, accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
            const { email, picture } = profile._json;
            const googleId = profile.id || profile._json?.sub;

            if (!googleId) {
                throw new NotFoundException('Google ID (sub) is missing in profile');
            }

            const { user } = await loginOrCreateAccountService({
                provider: ProviderEnum.GOOGLE,
                displayName: profile.displayName,
                providerId: googleId,
                picture: picture,
                email: email,
            });
            done(null, user);
        } catch (error) {
            return done(error, false);
        }
    }
  )
);

passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
            session: true,
        },
        async (email: string, password: string, done: any) => {
            try {
                const user = await verifyUserService({ email, password, provider: ProviderEnum.EMAIL });
                if (!user) {
                    return done(null, false, { message: 'Invalid email or password' });
                }
                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
);

passport.serializeUser((user: any, done) => {
    done(null, user._id?.toString?.() || user.id);
});

passport.deserializeUser(async (userId: string, done) => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            return done(null, false);
        }
        done(null, user);
    } catch (error) {
        done(error as Error);
    }
});

export default passport;
