const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

/**
 * @description Mongoose schema for movie documents
 * @typedef {Object} MovieSchema
 * @property {string} Title - The title of the movie (required)
 * @property {string} Description - A description of the movie (required)
 * @property {Genre} Genre - Genre information for the movie
 * @property {string} Release - Release date of the movie
 * @property {Director} Director - Director information
 * @property {Actor[]} Actors - Array of actors in the movie
 * @property {string} Rating - Movie rating (e.g., PG, PG-13, R)
 * @property {string} ImagePath - Path to the movie's poster image
 */

/**
 * @typedef {Object} Genre
 * @property {string} Name - The name of the genre
 * @property {string} Description - Description of the genre
 */

/**
 * @typedef {Object} Director
 * @property {string} Name - The director's full name
 * @property {string} Bio - Biography of the director
 * @property {string} Birth - Birth date of the director
 * @property {string} Death - Death date of the director (if applicable)
 */

/**
 * @typedef {Object} Actor
 * @property {string} Name - The actor's full name
 * @property {string} Bio - Biography of the actor
 */

let movieSchema = mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Genre: {
    Name: String,
    Description: String,
  },
  Release: { type: String },
  Director: {
    Name: String,
    Bio: String,
    Birth: String,
    Death: String,
  },
  Actors: [
    {
      Name: String,
      Bio: String,
    },
  ],
  Rating: { type: String },
  ImagePath: String,
});

/**
 * @description Mongoose schema for user documents
 * @typedef {Object} UserSchema
 * @property {string} Username - Unique username for the user (required)
 * @property {string} Password - Hashed password for the user (required)
 * @property {string} Email - Unique email address for the user (required)
 * @property {Date} Birthday - User's birth date (required)
 * @property {string} City - User's city of residence
 * @property {mongoose.Schema.Types.ObjectId[]} FavoriteMovies - Array of movie IDs in user's favorites
 * @property {mongoose.Schema.Types.ObjectId[]} ToWatch - Array of movie IDs in user's watch list
 */

let userSchema = mongoose.Schema({
  Username: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  Email: { type: String, required: true, unique: true },
  Birthday: { type: Date, required: true },
  City: { type: String },
  FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
  ToWatch: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
});

/**
 * @description Static method to hash a password using bcrypt
 * @param {string} password - Plain text password to hash
 * @returns {string} Hashed password
 * @example
 * const hashedPassword = User.hashPassword('mySecretPassword');
 */

userSchema.statics.hashPassword = password => {
  return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.Password);
};

let Movie = mongoose.model("Movie", movieSchema);
let User = mongoose.model("User", userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
