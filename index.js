// requesting modules and models
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/myFlixVintageDB', { useNewUrlParser: true, useUnifiedTopology: true });

const express = require('express'),
    morgan = require('morgan'),
    uuid = require('uuid'),
    bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(morgan ('common'));
app.use(express.static('public'));


// === MOVIE ROUTES ===

// GET a list of all movies
app.get('/movies', (req, res) => {
    res.json(movies);
});

// GET infos about a movie
app.get('/movies/:title', (req, res) => {
    res.json(movies.find((movies) => {
        return movies.title === req.params.title }))
});

// GET genre description
app.get('/genres/:name', (req, res) => {
    res.send(`GET request: Description of the genre "${req.params.name}"`)
   /*  res.send(genres.find((genres) => {
        return genres.name === req.params.name})) */
});

// GET infos about a director
app.get('/directors/:name', (req, res) => {
    res.send(`GET request: Infos about director "${req.params.name}"`)
    /* res.json(directors.find((directors) => {
        return directors.name === req.params.name })) */
});

// GET infos about an actor
app.get('/actors/:name', (req, res) => {
    res.send(`GET request: Infos about actor "${req.params.name}"`)
    /* res.json(actors.find((actors) => {
        return actors.name === req.params.name })) */
});

// === USER ROUTES ===

// CREATE new user
app.post('/users', async (req, res) => {
    await Users.findOne ({ Username: req.body.Username })
    .then ((user) => {
        if (user) {
            return res.status (400).send(req.body.Username + 'already exist');
        } else {
            Users.create ({
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday,
                City: req.body.City
            })
            .then((user) =>{res.status(201).json(user) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            })
          }
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
        });
});

// UPDATE user infos
app.put('/users/:username/:name', (req, res) => {
    return res.send(`PUT request: Updated name for "${req.params.name}"`)
});

// DELETE user
app.delete('/users/:username', (req, res) => {
    return res.send(`DELETE request: User "${req.params.username}" has been deleted`)
});

// ADD movies to favorites list
app.post('/users/:username/favorites/:movieId', (req, res) => {
    return res.send(`POST request: Movie added to the favorites`)
});

// DELETE movies from favorites list
app.delete('/users/:username/favorites/:movieId', (req, res) => {
    return res.send(`DELETE request: Movie has been removed from favorites`)
});

// ADD movies to ToWatch list
app.post('/users/:username/towatch/:movieId', (req, res) => {
    return res.send(`POST request: Movie added to To Watch list`)
});

// DELETE movies from ToWatch list
app.delete('/users/:username/towatch/:movieId', (req, res) => {
    return res.send(`DELETE request: Movie has been removed from To Watch list`)
});




// error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
})

// listen for request
app.listen(8080, () => {
    console.log('Your app is listening on ort 8080.');
});


