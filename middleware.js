const jwt = require('jsonwebtoken');
const User = require('./model');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

async function authMiddleware(req, res, next) {
    try {
        let token = null;
        if (req.cookies && req.cookies.token) token = req.cookies.token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
        console.log('[AUTH] token snippet:', token ? `${token.slice(0, 8)}...` : 'none');

        const payload = jwt.verify(token, JWT_SECRET);
        // Load full user from DB to provide consistent per-request user context
        console.log('[AUTH] token payload id:', payload && payload.id);
        const user = await User.findById(payload.id).select('-password -confirmPassword');
        if (!user) return res.status(401).json({ message: 'Invalid token' });

        console.log('[AUTH] loaded user id from DB:', user._id.toString());

        req.user = user;
        next();
    } catch (err) {
        console.error('[AUTH] middleware error', err);
        return res.status(401).json({ message: 'Authentication failed' });
    }
}

module.exports = authMiddleware;
