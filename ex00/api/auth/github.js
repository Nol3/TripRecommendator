
import passport from 'passport';

export default function handler(req, res, next) {
    passport.authenticate('github')(req, res, next);
}