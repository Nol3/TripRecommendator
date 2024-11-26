const { default: fetch } = require('node-fetch');

module.exports = async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({ error: 'No code provided' });
        }

        // Obtener token de acceso
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code
            })
        });

        const tokenData = await tokenResponse.json();

        // Obtener datos del usuario
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/json',
            }
        });

        const userData = await userResponse.json();

        // Guardar datos en la sesión
        if (req.session) {
            req.session.user = userData;
            req.session.isAuthenticated = true;
        }

        // Crear una cookie de sesión
        res.setHeader('Set-Cookie', `auth=${tokenData.access_token}; Path=/; HttpOnly; SameSite=Lax`);

        // Redirigir con los datos del usuario
        res.redirect(`/?login=success&user=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (error) {
        console.error('Error in callback:', error);
        res.redirect('/?error=auth_failed');
    }
};