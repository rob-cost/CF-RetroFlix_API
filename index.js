// requesting modules and models
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/myFlixVintageDB', { useNewUrlParser: true, useUnifiedTopology: true });

// request modules 
const express = require('express'),
    morgan = require('morgan'),
    uuid = require('uuid'),
    bodyParser = require('body-parser');
const { forEach, eq } = require('lodash');

const app = express();

app.use(bodyParser.json());
app.use(morgan ('common'));
app.use(express.static('public'));


// === MOVIE ROUTES ===

// GET a list of all movies
app.get('/movies', async (req, res) => {
    await Movies.find()
    .then ((movies) => {
        // re-order the fileds of each movie
        const orderMovies = movies.map (movie => ({
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
        res.status(201).json(orderMovies)
    })
    .catch ((err) => {
        console.error(err);
        res.status(500).send('Error: '+ err);
    });
});

// GET infos about a movie
app.get('/movies/:title', async (req, res) => {
    const movieTitle = new RegExp(`^${req.params.title}$`, 'i');   // make the parameter case insensitive
    await Movies.findOne({ Title: movieTitle})
    .then ((movie) => {

        if (!movie) {
            return res.status(404).send(`The movie ${req.params.title} was not found`);
        }

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
        res.status(201).json(orderMovies)
    })
    .catch ((err) => {
        console.error(err);
        res.status(500).send('Error: '+ err);
    });
});

// GET genre description
app.get('/genres/:name', async (req, res) => {
    const genreName = new RegExp(`^${req.params.name}$`, 'i');
    await Movies.findOne({ 'Genre.Name': genreName }, 'Genre')
   .then ((genre) => {

        if (!genre) {
            return res.status(404).send(`Genre ${req.params.name} not found`);
        }

        const orderGenre = {
            Name: genre.Genre.Name,
            Description: genre.Genre.Description
        }
        res.status(201).json(orderGenre)
   })
   .catch ((err) => {
    console.error(err);
        res.status(500).send('Error: '+ err);
   })
});

// GET infos about a director
app.get ('/directors/:name', async (req,res) => {
    const directorName = new RegExp(`^${req.params.name}$`, 'i');
    await Movies.find({ 'Director.Name': directorName })
    .then ((movies) => {

        if (!movies) {
            return res.status(404).send(`Director ${req.params.name} not found in any movies`);
        }

        const director = movies[0].Director; // takes in consideration the first match
        const orderDirector = {
            Name: director.Name,
            Bio: director.Bio,
            Birth: director.Birth,
            Death: director.Death,
            Movies: movies.map(movie => ({
                Title: movie.Title,
                Release: movie.Release
            }))
        }

        res.status(201).json(orderDirector)
    })
    .catch ((err) => {
        res.status(500).send('Error '+ err);
    })
});

// GET infos about an actor
app.get ('/actors/:name', async (req, res) => {
    const actorName = new RegExp(`^${req.params.name}$`, 'i');
    await Movies.find({'Actors.Name': actorName})
    .then ((movies) => {

        if(!movies) {
            return res.status(404).send(`The actor ${req.params.name} not found in any movie`)
        }

        const actor = movies[0].Actors.find(a => a.Name.toLowerCase() === req.params.name.toLowerCase());

        if (!actor) {
            return res.status(404).send(`The actor ${req.params.name} not found in movies`)
        }
        const orderActor = {
            Name: actor.Name,
            Bio: actor.Bio,
            Movies: movies.map (movie => ({
                Title: movie.Title,
                Release: movie.Release
            }))
        }

        res.status(201).json(orderActor)
    })
    .catch ((err) => {
        res.status(500).send('Error '+ err);
    })
})

// === USER ROUTES ===

// GET a list of all users
app.get('/users', async (req, res) => {
    await Users.find()
    .then ((user) => {
        res.status(201).json(user)
    })
})

// CREATE new user
app.post('/users', async (req, res) => {
    await Users.findOne ({ Username: req.body.Username })
    .then ((user) => {
        if (user) {
            return res.status (400).send(req.body.Username + ' already exist ');
        } else {
            Users.create ({
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday,
                City: req.body.City
            })
            .then((user) =>{res.status(201).json({user}) })
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

// UPDATE user infos by username 
app.put('/users/:username', async (req, res) => {

    // Validate that each field is entered
    const fields = ['Username', 'Password', 'Email', 'Birthday'];

    for (let i=0; i<fields.length; i++) {
        if (!req.body[fields[i]]) {
            return res.status(400).send(`You must enter this field: ${fields[i]}`);
        }

    }

     // Validate that user exist
     const userName = new RegExp(`^${req.params.username}$`, 'i');
     const user = await Users.findOne({ Username: userName });
 
     if(!user){
         return res.status(400).send(`User not found`);
     }

    await Users.findOneAndUpdate({ Username: userName },
    
        { $set:
        {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
            City: req.body.City
        }
    },
    { new: true }) 
    .then((updatedUser) => {
      res.status(200).json({
        message: "User updated successfully",
        user: updatedUser});
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    })
  
  });

// DELETE user
app.delete('/users/:username', async (req, res) => {
    const userName = new RegExp(`^${req.params.username}$`, 'i');
    await Users.findOneAndDelete ({Username: userName})
    .then ((user) => {
        if (!user) {
            return res.status(404).send('User not found');
        }
        else {
            res.status(200).send('User delete');
        }
    })
    .catch((err) => {
        res.status(500).send('Error: ' + err);
    })
});

// ADD movies to favorites list
app.post('/users/:username/favorites/:movieId', async (req, res) => {
    const userName = new RegExp(`^${req.params.username}$`, 'i');
    await Users.findOneAndUpdate({ Username: userName }, {
       $push: { FavoriteMovies: req.params.movieId }
     },
     { new: true }) 
    .then((updatedUser) => {
      res.json({
        Message: 'The movie has been added',
        User: updatedUser});
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
  });
  
// DELETE movies from favorites list
app.delete('/users/:username/favorites/:movieId', async (req, res) => {
    const userName = new RegExp(`^${req.params.username}$`, 'i');
    await Users.findOneAndUpdate({ Username: userName }, {
       $pull: { FavoriteMovies: req.params.movieId }
     },
     { new: true }) 
    .then((updatedUser) => {
      res.json({
        Message: 'The movie has been removed',
        User: updatedUser});
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// ADD movies to ToWatch list
app.post('/users/:username/towatch/:movieId', async (req, res) => {
    const userName = new RegExp(`^${req.params.username}$`, 'i');
    await Users.findOneAndUpdate({ Username: userName }, {
       $push: { ToWatch: req.params.movieId }
     },
     { new: true }) 
    .then((updatedUser) => {
      res.json({
        Message: 'The movie has been added',
        User: updatedUser});
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
  });

// DELETE movies from ToWatch list
app.delete('/users/:username/towatch/:movieId', async (req, res) => {
    const userName = new RegExp(`^${req.params.username}$`, 'i');
    await Users.findOneAndUpdate({ Username: userName }, {
       $pull: { ToWatch: req.params.movieId }
     },
     { new: true }) 
    .then((updatedUser) => {
      res.json({
        Message: 'The movie has been removed',
        User: updatedUser});
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
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


