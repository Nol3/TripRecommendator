const passport = require('passport');
const express = require('express');
const router = express.Router();
const { default: fetch } = require('node-fetch');

module.exports = async (req, res) => {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const clientId = process.env.GITHUB_CLIENT_ID;
        const redirectUri = process.env.CALLBACK_URL;
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

        res.redirect(302, githubAuthUrl);
    } catch (error) {
        console.error('Error in GitHub auth:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
}