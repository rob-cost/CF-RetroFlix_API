const express = require('express'),
    morgan = require('morgan');
const app = express();

let topTen = [
    { title: 'A Clockwork Orange', director: 'Stanley Kubrick' },
    { title: '2001: A Space Odyssey', director: 'Stanley Kubrick' },
    { title: 'Star Wars: Episode IV – A New Hope', director: 'George Lucas' },
    { title: 'Close Encounters of the Third Kind', director: 'Steven Spielberg' },
    { title: 'Alien', director: 'Ridley Scott' },
    { title: 'Blade Runner', director: 'Ridley Scott' },
    { title: 'The Thing', director: 'John Carpenter' },
    { title: 'Back to the Future', director: 'Robert Zemeckis' },
    { title: 'The Matrix', director: 'The Wachowskis' },
    { title: 'Gattaca', director: 'Andrew Niccol' }
]

app.use(morgan ('common'));
app.use(express.static('public'));


app.get('/', (req, res) => {
    res.send('Welcome to myFlixVintage');
});

app.get('/movies', (req, res) => {
    res.json(topTen);
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


