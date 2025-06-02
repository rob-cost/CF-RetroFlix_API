const passport = require ('passport'),
    LocalStrategy = require ('passport-local').Strategy,
    Models = require ('./models.js'),
    passportJWT = require ('passport-jwt');

let Users = Models.User,
    JWTStrategy = passportJWT.Strategy,
    ExtractJWT = passportJWT.ExtractJwt;

passport.use (
    new LocalStrategy (
        {
            usernameField: 'Username',
            passwordField: 'Password',
        },
        async (username, password, callback) => {
            console.log (`${username} ${password}`);
            await Users.findOne({Username: username})
            .then ((user) => {
                if (!user) {
                    console.log (`Incorrect username`);
                    return callback (null, false, {
                        message: 'Incorrect username or password.',
                    });
                }
                else if (user) {
                    console.log('Username received by passport ' + username)
                }
                else if (!user.validatePassword(password)) {
                    console.log('Incorrect password');
                    return callback(null, false, {message: 'Incorrect password'});
                }
                else {
                    console.log('Password received by passport ' + password)
                }
                console.log('Finished');
                return callback (null, user);
            })
            .catch ((error) => {
                if (error) {
                    console.log(error);
                    return callback (error);
                }
            })
        }
    )
)

const user = await.findOne({Username: username});
console.log('Mongo user found: ' + user);

passport.use (
    new JWTStrategy (
        {
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
            secretOrKey: 'your_jwt_secret'
        },
        async (jwtPayload, callback) => {
            return await Users.findById(jwtPayload._id)
            .then ((user) => {
                return callback(null, user);
            })
            .catch((error) => {
                return callback (error)
            });
        }
    )
)