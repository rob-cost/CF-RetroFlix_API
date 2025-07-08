const jwtSecret = process.env.JWT_SECRET;

const jwt = require("jsonwebtoken"),
  passport = require("passport");

require("./passport");

let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username,
    expiresIn: "7d",
    algorithm: "HS256",
  });
};

module.exports = (router) => {
  router.post("/login", (req, res) => {
    passport.authenticate("local", { session: false }, (error, User, info) => {
      if (error || !User) {
        return res.status(400).json({
          message: "Something is not right",
          User: User,
        });
      }
      req.login(User, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let Token = generateJWTToken(User.toJSON());
        let text = "it is me";
        return res.json({ User, Token, text });
      });
    })(req, res);
  });
};
