const mongoose  = require('mongoose');
const bcrypt = require('bcrypt');

let movieSchema = mongoose.Schema ({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Genre: {
        Name: String,
        Description: String
    },
    Release: {type: String},
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
    Rating: {type: String},
    ImagePath: String

});

let userSchema = mongoose.Schema ({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: {type: Date, required: true},
    City: {type: String},
    FavoriteMovies: [{ type:mongoose.Schema.Types.ObjectId, ref: 'Movie'}],
    ToWatch: [{ type:mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function(password) {
  return bcrypt.compareSync(password, this.Password);
};

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
