// requesting modules and models
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

/* mongoose.connect('mongodb://localhost:27017/myFlixVintageDB', { useNewUrlParser: true, useUnifiedTopology: true }); */

mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// request modules 
const express = require('express'),
    morgan = require('morgan'),
    uuid = require('uuid'),
    joi = require('joi');
    bodyParser = require('body-parser');
const { forEach, eq } = require('lodash');
const passport = require('passport');
require('./passport.js');

const app = express();

app.use(bodyParser.json());
app.use(morgan('common'));
app.use(express.static('public'));

const cors = require('cors');
app.use(cors());

/* let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
})); */

let auth = require('./auth')(app);

// Creation Validation schema
const createUserSchema = joi.object({
    Username: joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),

    Password: joi.string()
    .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
    .required(),

    Email: joi.string()
    .email({ minDomainSegments: 2 })
    .required(),

    Birthday: joi.date()
    .min(new Date('1920-01-01'))
    .max(new Date('2025-01-01'))
    .iso()
    .required(),

    City: joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .optional(),
});
const updateUserSchema = joi.object({
    Username: joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .optional(),

    Password: joi.string()
    .optional(),

    Email: joi.string()
    .email({ minDomainSegments: 2 }),

    Birthday: joi.date()
    .min(new Date('1920-01-01'))
    .max(new Date('2025-01-01'))
    .iso()
    .optional(),

    City: joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .optional(),
});


// === MOVIE ROUTES ===

// GET a list of all movies
app.get('/movies', async (req, res) => {
    try {
        const movie = await Movies.find()
        const orderMovies = movie.map(movie => ({
            Title: movie.Title,
            Description: movie.Description,
            Genre: movie.Genre,
            Release: movie.Release,
            Director: movie.Director,
            Actors: movie.Actors,
            Rating: movie.Rating,
            ImagePath: movie.ImagePath,
            id: movie._id
        }))
        res.status(200).json(orderMovies)
    }
    catch (err) {
        res.status(500).send('Error' + err);
    }
})

// GET infos about a movie
app.get('/movies/:title', passport.authenticate('jwt', {session: false}), async (req, res) => {
    try {
        const movieTitle = new RegExp(`^${req.params.title}$`, 'i');
        const movie = await Movies.findOne({ Title: movieTitle });
        if (!movie) {
            return res.status(404).send(`Movies ${req.params.title} not found`);
        }
        else {
            const orderMovies = {
                Title: movie.Title,
                Description: movie.Description,
                Genre: movie.Genre,
                Release: movie.Release,
                Director: movie.Director,
                Actors: movie.Actors,
                Raiting: movie.Rating,
                ImagePath: movie.ImagePath,
                id: movie._id
            }
            res.status(200).json(orderMovies);
        }
    }
    catch (err) {
        res.status(500).send('Error' + err);
    }
})

// GET genre description
app.get('/genres/:name', passport.authenticate('jwt', {session: false}), async (req, res) => {
    try {
        const genreName = new RegExp(`^${req.params.name}$`, 'i');
        const movies = await Movies.find({ 'Genre.Name': genreName });
        if (!movies) {
            return res.status(404).send(`Genre ${req.params.name} not found in any movie`);
        }
        else {
            const movie = movies[0].Genre;
            const orderGenre = {
                Name: movie.Name,
                Description: movie.Description,
                Movies: movies.map(movies => ({
                    Title: movies.Title
                }))
            }
            return res.status(200).json(orderGenre);
        }
    }
    catch (err) {
        res.status(500).send('Error' + err);
    }
})

// GET infos about a director

app.get('/directors/:name', passport.authenticate('jwt', {session: false}), async (req, res) => {
    try {
        const directorName = new RegExp(`^${req.params.name}$`, 'i');
        const movies = await Movies.find({ 'Director.Name': directorName });
        if (!movies) {
            return res.status(404).send(`Director ${req.params.name} not found in any movies`);
        }
        else {
            const director = movies[0].Director; // takes in consideration the first match
            const orderDirector = {
                Name: director.Name,
                Bio: director.Bio,
                Birth: director.Birth,
                Death: director.Death,
                Movies: movies.map(movie => ({   // creates an array of all movies with the same director
                    Title: movie.Title,
                    Release: movie.Release
                }))
            }
            res.status(200).json(orderDirector)
            }}
    catch (err) {
        res.status(500).send('Error' + err);
    }
});

// GET infos about an actor
app.get('/actors/:name', passport.authenticate('jwt', {session: false}), async (req, res) => {
    try {
        const actorName = new RegExp(`^${req.params.name}$`, 'i');
        const movies = await Movies.find({ 'Actors.Name': actorName });
            if (!movies) {
                return res.status(404).send(`The actor ${req.params.name} not found in any movie`)
            }
            else {
                const actor = movies[0].Actors.find(a => a.Name.toLowerCase() === req.params.name.toLowerCase());
                const orderActor = {
                    Name: actor.Name,
                    Bio: actor.Bio,
                    Movies: movies.map(movie => ({
                        Title: movie.Title,
                        Release: movie.Release
                    }))
                }
                return res.status(200).json(orderActor);
                }}
    catch(err) {
        res.status(500).send('Error' + err);
    }
})

// === USER ROUTES ===

// CREATE new user
app.post('/users', async (req, res) => {

    try {

        // validate user request
        const {error, value} = createUserSchema.validate(req.body, {abortEarly: false});
        if (error) {
            const errorMessage = error.details.map(details => details.message)
            return res.status(400).json({
                message: errorMessage
            })
        };

        // ecnrypt password
        let hashedPassword = Users.hashPassword(req.body.Password);

        // validate there is no user with the same username
        const userName = new RegExp(`^${req.body.Username}$`, 'i');
        const checkEmail = await Users.findOne({Email: req.body.Email})
        const user = await Users.findOne({ Username: userName });
            if (user) {
                return res.status(400).send(req.body.Username + ' already exists');
            }
            if (checkEmail) {
                return res.status(400).send('Email already exist');
            }
            
            else {
                const newUser = await Users.create({
                    Username: req.body.Username,
                    Password: hashedPassword,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday,
                    City: req.body.City,
                })
                return res.status(201).json({
                    Message: 'New user has been created',
                    User: newUser
                    })
                }
        }
    catch(err) {
        console.error(err);
        return res.status(500).send('Error: ' + err);
                };
        })


// GET infos about a user
app.get('/users/:username', passport.authenticate('jwt', {session: false}), async (req, res) => {
    
    // validate user
    if(req.user.Username.toLocaleLowerCase() !== req.params.username.toLocaleLowerCase()) {
            return res.status(401).send('Permission denied');
    }

    try {
        const userName = new RegExp(`^${req.params.username}$`, 'i')
        const user = await Users.findOne({Username: userName});
        return res.status(200).json(user);
    }
    catch (err) {
        return res.status(500).send('Error' + err);
    }
});


// UPDATE user infos by username 
app.put('/users/:username', passport.authenticate('jwt', {session: false}), async (req, res) => {

    // validate user
    if(req.user.Username.toLowerCase() !== req.params.username.toLocaleLowerCase()){
        return res.status(401).send('Permission denied');
    }

    try {

        // validate body 
        const {error, value} = updateUserSchema.validate(req.body) ;
        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            })
        }

        let updateFields = {};
        if (req.body.Username) updateFields.Username = req.body.Username;
        if (req.body.Password) updateFields.Password = req.body.Password;
        if (req.body.Email) updateFields.Email = req.body.Email;
        if (req.body.Birthday) updateFields.Birthday = req.body.Birthday;
        if (req.body.City) updateFields.City = req.body.City;

        // don't allow to update Username
        if (req.body.Username !== req.params.username){
            return res.status(400).send('It is not possible to change your Username');
        }

        // encrypt new Password
        if (req.body.Password) {
            const hashedPassword = Users.hashPassword(req.body.Password);
            updateFields.Password = hashedPassword;
        }

        // validate that no other users have the same Email
        const checkEmail = await Users.findOne({Email: req.body.Email})
        if (checkEmail) {
            return res.status(400).send('Email already exist');
        }

        // validate that no other users have that username
        const checkName = await Users.findOne({Username: updateFields.Username });
        if (checkName) {
            return res.status(400).send('Username already taken');
        }
 
        // perform the update
        const userName = new RegExp(`^${req.params.username}$`, 'i');
        const updatedUser = await Users.findOneAndUpdate({ Username: userName },
            { $set: updateFields },
            { new: true }); 
            return res.status(201).json({
                Message: "User updated successfully",
                User: updatedUser
            });
        }
    catch(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
        }

});

// DELETE user
app.delete('/users/:username', passport.authenticate('jwt', {session: false}), async (req, res) => {

    // validate user
    if(req.user.Username !== req.params.username){
        return res.status(401).send('Permission denied');
    }

    try {
        const userName = new RegExp(`^${req.params.username}$`, 'i');
        const user = await Users.findOneAndDelete({ Username: userName });
        if (!user) {
            return res.status(404).send('User not found');
        }
        else {
            res.status(200).send('User delete');
        }
    }
    catch (err) {
            res.status(500).send('Error' + err);
        }
});

// ADD movies to favorites list
app.post('/users/:username/favorites/:movie_id', passport.authenticate('jwt', {session: false}), async (req,res) => {

    // validate user
    if(req.user.Username !== req.params.username){
        return res.status(401).send('Permission denied');
    }

    try {

        // validate that user exist
        const userName = new RegExp(`^${req.params.username}$`, 'i');
        const user = await Users.findOne({Username: userName});
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // validate that movie exist and is not alerady in the list
        const movie = await Movies.findOne({_id: req.params.movie_id});
        if (!movie) {
            return res.status(404).send('Movie not found');
        }
        else if (user.FavoriteMovies.includes(movie.id)) {
            return res.status(400).send('Movie already in the list'); 
        }
    
        const updatedUser = await Users.findOneAndUpdate({ Username: userName }, {$push: { FavoriteMovies: movie.id }},{ new: true });
        return res.json({
            Message: 'The movie has been added',
            Data: updatedUser
        })
        
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err); 
    }
})

// DELETE movies from favorites list
app.delete('/users/:username/favorites/:movie_id', passport.authenticate('jwt', {session: false}), async (req, res) => {

    // validate user
    if(req.user.Username !== req.params.username){
        return res.status(401).send('Permission denied');
    }

    try {

        // validate that user exist
        const userName = new RegExp(`^${req.params.username}$`, 'i');
        const user = await Users.findOne({Username: userName});
        if (!user) {
            return res.status(404).send('User not found');
        }

        // validate that movie exist and is not in the list 
        const movie = await Movies.findOne({_id: req.params.movie_id});
        if (!movie) {
            return res.status(404).send('Movie not found');
        }
        else if (!user.FavoriteMovies.includes(movie.id)) {
            return res.status(400).send('Movie not in the list'); 
        }

        const updatedUser = await Users.findOneAndUpdate({ Username: userName }, {$pull: { FavoriteMovies: movie.id }},{ new: true })
        return res.json({
                Message: 'The movie has been removed',
                Data: updatedUser
            });
        }
    catch(err)  {
        console.error(err);
        res.status(500).send('Error: ' + err);
    };
});

// ADD movies to ToWatch list

app.post('/users/:username/towatch/:movie_id', passport.authenticate('jwt', {session: false}), async (req,res) => {

    // validate user
    if(req.user.Username !== req.params.username){
        return res.status(401).send('Permission denied');
    }

    try {

        // validate that user exist
        const userName = new RegExp(`^${req.params.username}$`, 'i');
        const user = await Users.findOne({Username: userName});
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // validate that movie exist and is not alerady in the list
        const movie = await Movies.findOne({_id: req.params.movie_id});
        if (!movie) {
            return res.status(404).send('Movie not found');
        }
        else if (user.ToWatch.includes(movie.id)) {
            return res.status(400).send('Movie already in the list'); 
        }
    
        const updatedUser = await Users.findOneAndUpdate({ Username: userName }, {$push: { ToWatch: movie.id }},{ new: true });
        return res.json({
            Message: 'The movie has been added',
            Data: updatedUser
        })
        
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err); 
    }
})

// DELETE movies from ToWatch list
app.delete('/users/:username/towatch/:movie_id', passport.authenticate('jwt', {session: false}), async (req, res) => {

    // validate user
    if(req.user.Username !== req.params.username){
        return res.status(401).send('Permission denied');
    }

    try {

        // validate that user exist
        const userName = new RegExp(`^${req.params.username}$`, 'i');
        const user = await Users.findOne({Username: userName});
        if (!user) {
            return res.status(404).send('User not found');
        }

        // validate that movie exist and is not in the list
        const movie = await Movies.findOne({_id: req.params.movie_id});
        if (!movie) {
            return res.status(404).send('Movie not found');
        }
        else if (!user.ToWatch.includes(movie.id)) {
            return res.status(400).send('Movie not in the list'); 
        }

        const updatedUser = await Users.findOneAndUpdate({ Username: userName }, {$pull: { ToWatch: movie.id }},{ new: true })
        return res.json({
                Message: 'The movie has been removed',
                Data: updatedUser
            });
        }
    catch(err)  {
        console.error(err);
        res.status(500).send('Error: ' + err);
    };
});




// error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(404).send('URL not found');
})

// listen for request
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});

/* app.listen(8080, () => {
    console.log('Your app is listening on ort 8080.');
}); */