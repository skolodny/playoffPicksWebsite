const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'yourSecretKey';

const adminAuth = (req, res, next) => {
    try {
        const header = req.header('authorization');
        const authorization = header.split(' ');
        const token = authorization.length == 2 ? authorization[1] : authorization[0];
        const decodedToken = jwt.verify(token, SECRET_KEY);

        if (decodedToken.admin) {
            next();
        } else {
            res.status(403).json({ message: 'Forbidden: Admins only' });
        }
    } catch (err) {
        res.status(403).json({ message: 'Forbidden: Admins only' });
    }

};

module.exports = adminAuth;