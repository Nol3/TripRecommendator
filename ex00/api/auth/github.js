const passport = require('passport');
const express = require('express');
const router = express.Router();
const { default: fetch } = require('node-fetch');

module.exports = async (req, res) => {
    try {
        const clientId = process.env.GITHUB_CLIENT_ID;
        const scope = 'user';

        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}`;

        res.writeHead(302, { Location: githubAuthUrl });
        res.end();
    } catch (error) {
        console.error('Error in GitHub auth:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};