const { default: fetch } = require('node-fetch');

module.exports = async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({ error: 'No code provided' });
        }

        // Intercambiar código por token de acceso
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code,
                redirect_uri: process.env.CALLBACK_URL
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Obtener información del usuario
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
                'Accept': 'application/json',
            }
        });

        const userData = await userResponse.json();

        // Redirigir al frontend con éxito
        res.redirect('/?login=success');
    } catch (error) {
        console.error('Error in callback:', error);
        res.redirect('/?error=auth_failed');
    }
}