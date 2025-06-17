const jwtSecret = 'your_jwt_secret';

const jwt = require ('jsonwebtoken'),
    passport = require ('passport');

require ('./passport');

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username,
        expiresIn: '7d',
        algorithm: 'HS256'
    });
}

module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', {session: false }, (error, User, info) => {
            if (error || !User) {
                return res.status(400).json({
                    message: 'Something is not right',
                    User: User
                });
            }
            req.login(User, {session: false}, (error) => {
                if (error) {
                    res.send(error);
                }
                let userInfo = {
                    username: User.Username,
                    email: User.Email,
                    city: User.City

                }
                let Token = generateJWTToken(User.toJSON());
                return res.json({User, Token});
            });
        })(req, res);
    });
}