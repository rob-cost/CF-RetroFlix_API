// requesting modules
const express = require('express'),
    morgan = require('morgan'),
    uuid = require('uuid'),
    bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(morgan ('common'));
app.use(express.static('public'));

// MOVIES

let movies = [
    {
        title: "2001: A Space Odyssey",
        genre: "Science Fiction",
        description: "A mind-bending journey through space and human evolution, driven by a mysterious monolith and an AI named HAL.",
        releaseDate: "1968-04-02",
        rating: 8.3,
        mainActors: ["Keir Dullea", "Gary Lockwood", "William Sylvester"],
        director: "Stanley Kubrick"
      },
      {
        title: "Star Wars: Episode IV – A New Hope",
        genre: "Science Fiction / Space Opera",
        description: "A young farm boy joins forces with rebels to fight against an oppressive galactic empire led by Darth Vader.",
        releaseDate: "1977-05-25",
        rating: 8.6,
        mainActors: ["Mark Hamill", "Harrison Ford", "Carrie Fisher"],
        director: "George Lucas"
      },
      {
        title: "Blade Runner",
        genre: "Science Fiction / Neo-noir",
        description: "In a dystopian future, a blade runner is tasked with hunting down bioengineered beings known as replicants.",
        releaseDate: "1982-06-25",
        rating: 8.1,
        mainActors: ["Harrison Ford", "Rutger Hauer", "Sean Young"],
        director: "Ridley Scott"
      },
      {
        title: "The Thing",
        genre: "Science Fiction / Horror",
        description: "A research team in Antarctica encounters a shape-shifting alien that can perfectly mimic any organism.",
        releaseDate: "1982-06-25",
        rating: 8.2,
        mainActors: ["Kurt Russell", "Wilford Brimley", "Keith David"],
        director: "John Carpenter"
      },
      {
        title: "The Matrix",
        genre: "Science Fiction / Action",
        description: "A computer hacker discovers the world he lives in is a simulated reality and joins a rebellion to free humanity.",
        releaseDate: "1999-03-31",
        rating: 8.7,
        mainActors: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"],
        director: "Lana and Lilly Wachowski"
      },
    ];

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
app.post('/users', (req, res) => {
    res.send(`POST request: User Created`)

    /* let newUSer = req.body;

    const requireFields = ['name', 'surname', 'email', 'city'];
    const missingFields = requireFields.filter(field => !newUSer[field]);

    if (missingFields.length > 0) {
        return res.status(400).send(`The following infos are missing: ${missingFields}`);
    } else {
        newUSer.id = uuid.v4();
        users.push(newUser);
        res.status(201).send('Your profile has been created');
    } */
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


