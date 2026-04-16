const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get('/status', (req, res) => {
    const authCookie = req.cookies?.auth;
    const sessionUser = req.session?.user;
    res.json({
        authenticated: Boolean(authCookie || sessionUser),
        user: sessionUser || null
    });
});

router.get('/logout', (req, res) => {
    res.clearCookie('connect.sid');
    res.clearCookie('auth');
    res.clearCookie('userId');

    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        req.logout((logoutErr) => {
            if (logoutErr) console.error('Passport logout error:', logoutErr);
            res.json({ success: true });
        });
    });
});

router.get('/github', passport.authenticate('github'));

router.get('/github/callback',
    passport.authenticate('github', {
        successRedirect: '/',
        failureRedirect: '/'
    })
);

module.exports = router;
