const mongoose  = require('mongoose');

let movieSchema = mongoose.Schema ({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Genre: {
        Name: String,
        Description: String
    },
    Director: {
        Name: String,
        Bio: String,
        Birth: String,
        Death: String
    },
    Actors: [{
        Name: String,
        Bio: String
    }],
    ImagePath: String
});

let userSchema = mongoose.Schema ({
    Username: {tye: String, required: true},
    Password: {type: String, required: true},
    Email: {tye: String, required: true},
    Birthdate: Date,
    City: {type: String},
    FavoriteMovies: [{ type:mongoose.Schema.Types.ObjectId, ref: 'Movie'}],
    ToWatch: [{ type:mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
