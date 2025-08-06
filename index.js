/**
 *  Main application setup and configuration
 *  Sets up Express server with MongoDB connection, middleware, CORS, authentication, and validation schemas
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Models = require("./models.js");

const Movies = Models.Movie;
const Users = Models.User;

// mongoose.connect('mongodb://localhost:27017/myFlixVintageDB', { useNewUrlParser: true, useUnifiedTopology: true });

/**
 * Connect to MongoDB using environment variable CONNECTION_URI
 */

mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const express = require("express"),
  morgan = require("morgan"),
  uuid = require("uuid"),
  joi = require("joi");
bodyParser = require("body-parser");
const { forEach, eq } = require("lodash");
const passport = require("passport");
require("./passport.js");

const app = express();

app.use(bodyParser.json());
app.use(morgan("common"));
app.use(express.static("public"));

const cors = require("cors");
app.use(cors());

// let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

/**
 * CORS configuration with origin validation
 * Currently allows all origins - uncomment allowedOrigins array to restrict
 */

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        // If a specific origin isn’t found on the list of allowed origins
        let message =
          "The CORS policy for this application doesn’t allow access from origin " +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  })
);

let auth = require("./auth")(app);

/**
 * @description Joi validation schema for user registration
 * @typedef {Object} CreateUserSchema
 * @property {string} Username - Alphanumeric username, 3-30 characters (required)
 * @property {string} Password - Alphanumeric password, 3-30 characters (required)
 * @property {string} Email - Valid email address with minimum 2 domain segments (required)
 * @property {Date} Birthday - Birth date between 1920-2025 in ISO format (required)
 * @property {string} City - Alphanumeric city name, 3-30 characters (optional)
 */

const createUserSchema = joi.object({
  Username: joi.string().alphanum().min(3).max(30).required(),

  Password: joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),

  Email: joi.string().email({ minDomainSegments: 2 }).required(),

  Birthday: joi
    .date()
    .min(new Date("1920-01-01"))
    .max(new Date("2025-01-01"))
    .iso()
    .required(),

  City: joi.string().alphanum().min(3).max(30).optional(),
});

/**
 * @description Joi validation schema for user profile updates
 * @typedef {Object} UpdateUserSchema
 * @property {string} Username - Alphanumeric username, 3-30 characters (optional)
 * @property {string} Password - Password string (optional)
 * @property {string} Email - Valid email address with minimum 2 domain segments (optional)
 * @property {Date} Birthday - Birth date between 1920-2025 in ISO format (optional)
 * @property {string} City - Alphanumeric city name, 3-30 characters (optional)
 */

const updateUserSchema = joi.object({
  Username: joi.string().alphanum().min(3).max(30).optional(),

  Password: joi.string().optional(),

  Email: joi.string().email({ minDomainSegments: 2 }),

  Birthday: joi
    .date()
    .min(new Date("1920-01-01"))
    .max(new Date("2025-01-01"))
    .iso()
    .optional(),

  City: joi.string().alphanum().min(3).max(30).optional(),
});

// === MOVIE ROUTES ===

/**
 * @description Returns a list of all movies.
 * @returns {Array<Object>} 200 - An array of movie objects
 * @returns {string} 500 - Server error
 */
app.get("/", (req, res) => res.send("Docker is here"));

app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const movie = await Movies.find();
      const orderMovies = movie.map(movie => ({
        Title: movie.Title,
        Description: movie.Description,
        Genre: movie.Genre,
        Release: movie.Release,
        Director: movie.Director,
        Actors: movie.Actors,
        Rating: movie.Rating,
        ImagePath: movie.ImagePath,
        id: movie._id,
      }));
      res.status(200).json(orderMovies);
    } catch (err) {
      res.status(500).send("Error" + err);
    }
  }
);

/**
 * @description Get detailed information about a movie by title
 * @param {string} req.params.title - The title of the movie to retrieve (case-insensitive)
 * @returns {Object} 200 - An object containing the movie's details
 * @returns {string} 404 - Movie not found
 * @returns {string} 500 - Internal server error
 * @example
 * // Request
 * GET /movies/Movie Name
 *
 * // Response
 * {
 *   "Title": "...",
 *   "Description": "...",
 *   "Genre": {
 *     "Name": "Sci-Fi",
 *     "Description": "Science fiction based storytelling."
 *   },
 *   "Release": 2010,
 *   "Director": {
 *     "Name": "...",
 *     "Bio": "...",
 *     "Birth": "1970-07-30T00:00:00.000Z"
 *   },
 *   "Actors": [
 *     { "Name": "Leonardo DiCaprio", "Bio": "American actor..." }
 *   ],
 *   "Raiting": 8.8,
 *   "ImagePath": "/images/inception.jpg",
 *   "id": "60c9cba2cfd8f2b2b4a12345"
 * }
 */

app.get(
  "/movies/:title",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const movieTitle = new RegExp(`^${req.params.title}$`, "i");
      const movie = await Movies.findOne({ Title: movieTitle });
      if (!movie) {
        return res.status(404).send(`Movies ${req.params.title} not found`);
      } else {
        const orderMovies = {
          Title: movie.Title,
          Description: movie.Description,
          Genre: movie.Genre,
          Release: movie.Release,
          Director: movie.Director,
          Actors: movie.Actors,
          Raiting: movie.Rating,
          ImagePath: movie.ImagePath,
          id: movie._id,
        };
        res.status(200).json(orderMovies);
      }
    } catch (err) {
      res.status(500).send("Error" + err);
    }
  }
);

/**
 * @description Get details about a genre by name, including its description and associated movies
 * @param {string} req.params.name - The name of the genre to look up
 * @returns {Object} 200 - An object containing the genre details and a list of related movies
 * @returns {string} 404 - Genre not found in any movie
 * @returns {string} 500 - Internal server error
 * @example
 * // Request
 * GET /genres/Drama
 *
 * // Response
 * {
 *   "Name": "Drama",
 *   "Description": "Crime drama focusing on power, corruption, and downfall of an anti-hero.",
 *   "Movies": [
 *     { "Title": "Pulp Fiction" },
 *     { "Title": "Scarface" }
 *   ]
 * }
 */

app.get(
  "/genres/:name",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const genreName = new RegExp(`^${req.params.name}$`, "i");
      const movies = await Movies.find({ "Genre.Name": genreName });
      if (!movies) {
        return res
          .status(404)
          .send(`Genre ${req.params.name} not found in any movie`);
      } else {
        const movie = movies[0].Genre;
        const orderGenre = {
          Name: movie.Name,
          Description: movie.Description,
          Movies: movies.map(movies => ({
            Title: movies.Title,
          })),
        };
        return res.status(200).json(orderGenre);
      }
    } catch (err) {
      res.status(500).send("Error" + err);
    }
  }
);

/**
 * @description Get detailed information about a director by name
 * @param {string} req.params.name - The name of the director to look up
 * @returns {Object} 200 - An object containing the director's biography and a list of their movies
 * @returns {string} 404 - Director not found in any movie
 * @returns {string} 500 - Internal server error
 * @example
 * // Request
 * GET /directors/Martin%20Scorsese
 *
 * // Response
 * {
 *   "Name": "Martin Scorsese",
 *   "Bio": "An American filmmaker...",
 *   "Birth": "1942-11-17T00:00:00.000Z",
 *   "Death": null,
 *   "Movies": [
 *     { "Title": "Taxi Driver", "Release": 1976 },
 *     { "Title": "Goodfellas", "Release": 1990 }
 *   ]
 * }
 */

app.get(
  "/directors/:name",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const directorName = new RegExp(`^${req.params.name}$`, "i");
      const movies = await Movies.find({ "Director.Name": directorName });
      if (!movies) {
        return res
          .status(404)
          .send(`Director ${req.params.name} not found in any movies`);
      } else {
        const director = movies[0].Director; // takes in consideration the first match
        const orderDirector = {
          Name: director.Name,
          Bio: director.Bio,
          Birth: director.Birth,
          Death: director.Death,
          Movies: movies.map(movie => ({
            // creates an array of all movies with the same director
            Title: movie.Title,
            Release: movie.Release,
          })),
        };
        res.status(200).json(orderDirector);
      }
    } catch (err) {
      res.status(500).send("Error" + err);
    }
  }
);

/**
 * @description Get detailed information about an actor by name
 * @param {string} req.params.name - The name of the actor to retrieve (case-insensitive)
 * @returns {Object} 200 - An object containing the actor's biography and a list of movies
 * @returns {string} 404 - Actor not found in any movie
 * @returns {string} 500 - Internal server error
 * @example
 * // Request
 * GET /actors/Al%20Pacino
 *
 * // Response
 * {
 *   "Name": "Al Pacino",
 *   "Bio": "American actor and filmmaker known for his intense performances...",
 *   "Movies": [
 *     { "Title": "Scarface", "Release": 1983 },
 *     { "Title": "The Godfather", "Release": 1972 }
 *   ]
 * }
 */

app.get(
  "/actors/:name",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const actorName = new RegExp(`^${req.params.name}$`, "i");
      const movies = await Movies.find({ "Actors.Name": actorName });
      if (!movies) {
        return res
          .status(404)
          .send(`The actor ${req.params.name} not found in any movie`);
      } else {
        const actor = movies[0].Actors.find(
          a => a.Name.toLowerCase() === req.params.name.toLowerCase()
        );
        const orderActor = {
          Name: actor.Name,
          Bio: actor.Bio,
          Movies: movies.map(movie => ({
            Title: movie.Title,
            Release: movie.Release,
          })),
        };
        return res.status(200).json(orderActor);
      }
    } catch (err) {
      res.status(500).send("Error" + err);
    }
  }
);

// === USER ROUTES ===

/**
 * @description Register a new user
 * @param {Object} req.body.required - User details
 * @param {string} req.body.Username.required - Desired username (alphanumeric, 3–30 characters)
 * @param {string} req.body.Password.required - Password (minimum 3 characters)
 * @param {string} req.body.Email.required - A valid email address
 * @param {string} req.body.Birthday.required - Date of birth in ISO format (e.g. 1990-01-01)
 * @param {string} [req.body.City] - Optional city name
 * @returns {Object} 201 - New user created successfully
 * @returns {Object} 400 - Validation error or duplicate username/email
 * @returns {string} 500 - Internal server error
 * @example
 * // Request body
 * {
 *   "Username": "JaneDoe",
 *   "Password": "securePassword",
 *   "Email": "jane@example.com",
 *   "Birthday": "1985-05-15",
 *   "City": "Berlin"
 * }
 */

app.post("/users", async (req, res) => {
  try {
    // validate user request
    const { error, value } = createUserSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errorMessage = error.details.map(details => details.message);
      return res.status(400).json({
        message: errorMessage,
      });
    }

    // ecnrypt password
    let hashedPassword = Users.hashPassword(req.body.Password);

    // validate there is no user with the same username
    const userName = new RegExp(`^${req.body.Username}$`, "i");
    const checkEmail = await Users.findOne({ Email: req.body.Email });
    const user = await Users.findOne({ Username: userName });
    if (user) {
      return res.status(400).send(req.body.Username + " already exists");
    }
    if (checkEmail) {
      return res.status(400).send("Email already exist");
    } else {
      const newUser = await Users.create({
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday,
        City: req.body.City,
      });
      return res.status(201).json({
        Message: "New user has been created",
        User: newUser,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error: " + err);
  }
});

/**
 * @description Get a user's account information
 * @description Retrieves user data based on the provided username. Only the owner of the account can access this route.
 * @param {string} req.params.username - The username of the user (case-insensitive)
 * @returns {Object} 200 - The user's account data
 * @returns {string} 401 - Unauthorized: attempting to access another user's information
 * @returns {string} 500 - Internal server error
 * @example
 * // Request
 * GET /users/JaneDoe
 *
 * // Response
 * {
 *   "_id": "64ffb72bfe2e3c001ef73c2b",
 *   "Username": "JaneDoe",
 *   "Email": "jane@example.com",
 *   "Birthday": "1985-05-15T00:00:00.000Z",
 *   "City": "Berlin",
 *   "FavoriteMovies": [],
 *   "ToWatch": []
 * }
 */

app.get(
  "/users/:username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // validate user
    if (
      req.user.Username.toLocaleLowerCase() !==
      req.params.username.toLocaleLowerCase()
    ) {
      return res.status(401).send("Permission denied");
    }

    try {
      const userName = new RegExp(`^${req.params.username}$`, "i");
      const user = await Users.findOne({ Username: userName });
      return res.status(200).json(user);
    } catch (err) {
      return res.status(500).send("Error" + err);
    }
  }
);

/**
 * @description Update user account information
 * @description Updates the details of a user account. Only the owner of the account can perform this operation.
 * @param {string} req.params.username - The current username of the user (case-insensitive)
 * @param {Object} req.body - The fields to update
 * @param {string} [req.body.Username] - New username (optional)
 * @param {string} [req.body.Password] - New password (optional, will be hashed)
 * @param {string} [req.body.Email] - New email (must be unique)
 * @param {string} [req.body.Birthday] - New birthdate in ISO format
 * @param {string} [req.body.City] - New city
 * @returns {Object} 201 - Successfully updated user data
 * @returns {Object} 400 - Validation error or duplicate username/email
 * @returns {string} 401 - Unauthorized: attempting to modify another user's account
 * @returns {string} 500 - Internal server error
 * @example
 * // Request
 * PUT /users/JaneDoe
 * {
 *   "Email": "newemail@example.com",
 *   "Password": "newSecurePassword",
 *   "City": "Hamburg"
 * }
 *
 * // Response
 * {
 *   "Message": "User updated successfully",
 *   "User": {
 *     "_id": "64ffb72bfe2e3c001ef73c2b",
 *     "Username": "JaneDoe",
 *     "Email": "newemail@example.com",
 *     "City": "Hamburg",
 *     ...
 *   }
 * }
 */

app.put(
  "/users/:username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // validate user
    if (
      req.user.Username.toLowerCase() !==
      req.params.username.toLocaleLowerCase()
    ) {
      return res.status(401).send("Permission denied");
    }

    try {
      // validate body
      const { error, value } = updateUserSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          message: error.details[0].message,
        });
      }

      let updateFields = {};
      if (req.body.Username) updateFields.Username = req.body.Username;
      if (req.body.Password) updateFields.Password = req.body.Password;
      if (req.body.Email) updateFields.Email = req.body.Email;
      if (req.body.Birthday) updateFields.Birthday = req.body.Birthday;
      if (req.body.City) updateFields.City = req.body.City;

      // encrypt new Password
      if (req.body.Password) {
        const hashedPassword = Users.hashPassword(req.body.Password);
        updateFields.Password = hashedPassword;
      }

      // perform the update
      console.log(updateFields);
      const userName = new RegExp(`^${req.params.username}$`, "i");
      const updatedUser = await Users.findOneAndUpdate(
        { Username: userName },
        { $set: updateFields },
        { new: true }
      );
      return res.status(201).json({
        Message: "User updated successfully",
        User: updatedUser,
      });
    } catch (err) {
      console.error(err);
      if (err.code == 11000) {
        const duplicatedError = Object.keys(err.keyPattern)[0];

        if (duplicatedError == "Username") {
          return res.status(400).json({
            message: "Username already exists!",
          });
        }

        if (duplicatedError == "Email") {
          return res.status(400).json({
            message: "Email already exists!",
          });
        }
      }
      res.status(500).send("Error: " + err);
    }
  }
);

/**
 * @description Delete a user account
 * @description Deletes a user's account from the system. Only the account owner can perform this operation.
 * @param {string} req.params.username - The username of the account to delete (case-sensitive)
 * @returns {string} 200 - Successfully deleted user
 * @returns {string} 401 - Unauthorized: attempting to delete another user's account
 * @returns {string} 404 - User not found
 * @returns {string} 500 - Internal server error
 * @example
 * // Request
 * DELETE /users/JaneDoe
 *
 * // Response
 * User delete
 */

app.delete(
  "/users/:username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // validate user
    if (req.user.Username !== req.params.username) {
      return res.status(401).send("Permission denied");
    }

    try {
      const userName = new RegExp(`^${req.params.username}$`, "i");
      const user = await Users.findOneAndDelete({ Username: userName });
      if (!user) {
        return res.status(404).send("User not found");
      } else {
        res.status(200).send("User delete");
      }
    } catch (err) {
      res.status(500).send("Error" + err);
    }
  }
);

/**
 * @description Add a movie to user's favorites list
 * @description Adds a movie to the specified user's favorites list.
 * @param {string} req.params.username - The username of the user (case-insensitive)
 * @param {string} req.params.movie_id - The ID of the movie to add to favorites
 * @returns {Object} 200 - Success response with updated user data
 * @returns {string} 400 - Bad request: movie already in favorites list
 * @returns {string} 401 - Unauthorized: attempting to modify another user's favorites
 * @returns {string} 404 - Not found: user or movie not found
 * @returns {string} 500 - Internal server error
 * @example
 * // Request
 * POST /users/JaneDoe/favorites/64ffb72bfe2e3c001ef73c2c
 *
 * // Response
 * {
 *   "Message": "The movie has been added",
 *   "Data": {
 *     "_id": "64ffb72bfe2e3c001ef73c2b",
 *     "Username": "JaneDoe",
 *     "Email": "jane@example.com",
 *     "Birthday": "1985-05-15T00:00:00.000Z",
 *     "City": "Berlin",
 *     "FavoriteMovies": ["64ffb72bfe2e3c001ef73c2c"],
 *     "ToWatch": []
 *   }
 * }
 */

app.post(
  "/users/:username/favorites/:movie_id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // validate user
    if (req.user.Username !== req.params.username) {
      return res.status(401).send("Permission denied");
    }

    try {
      // validate that user exist
      const userName = new RegExp(`^${req.params.username}$`, "i");
      const user = await Users.findOne({ Username: userName });
      if (!user) {
        return res.status(404).send("User not found");
      }

      // validate that movie exist and is not alerady in the list
      const movie = await Movies.findOne({ _id: req.params.movie_id });
      if (!movie) {
        return res.status(404).send("Movie not found");
      } else if (user.FavoriteMovies.includes(movie.id)) {
        return res.status(400).send("Movie already in the list");
      }

      const updatedUser = await Users.findOneAndUpdate(
        { Username: userName },
        { $push: { FavoriteMovies: movie.id } },
        { new: true }
      );
      return res.json({
        Message: "The movie has been added",
        Data: updatedUser,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: " + err);
    }
  }
);

/**
 * @description Remove a movie from user's favorites list
 * @description Removes a movie from the specified user's favorites list. Only the owner of the account can remove movies from their favorites. The movie must exist and must be in the user's favorites list.
 * @param {string} req.params.username - The username of the user (case-insensitive)
 * @param {string} req.params.movie_id - The ID of the movie to remove from favorites
 * @returns {Object} 200 - Success response with updated user data
 * @returns {string} 400 - Bad request: movie not in favorites list
 * @returns {string} 401 - Unauthorized: attempting to modify another user's favorites
 * @returns {string} 404 - Not found: user or movie not found
 * @returns {string} 500 - Internal server error
 * @example
 * // Request
 * DELETE /users/JaneDoe/favorites/64ffb72bfe2e3c001ef73c2c
 *
 * // Response
 * {
 *   "Message": "The movie has been removed",
 *   "Data": {
 *     "_id": "64ffb72bfe2e3c001ef73c2b",
 *     "Username": "JaneDoe",
 *     "Email": "jane@example.com",
 *     "Birthday": "1985-05-15T00:00:00.000Z",
 *     "City": "Berlin",
 *     "FavoriteMovies": [],
 *     "ToWatch": []
 *   }
 * }
 */

app.delete(
  "/users/:username/favorites/:movie_id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // validate user
    if (req.user.Username !== req.params.username) {
      return res.status(401).send("Permission denied");
    }

    try {
      // validate that user exist
      const userName = new RegExp(`^${req.params.username}$`, "i");
      const user = await Users.findOne({ Username: userName });
      if (!user) {
        return res.status(404).send("User not found");
      }

      // validate that movie exist and is not in the list
      const movie = await Movies.findOne({ _id: req.params.movie_id });
      if (!movie) {
        return res.status(404).send("Movie not found");
      } else if (!user.FavoriteMovies.includes(movie.id)) {
        return res.status(400).send("Movie not in the list");
      }

      const updatedUser = await Users.findOneAndUpdate(
        { Username: userName },
        { $pull: { FavoriteMovies: movie.id } },
        { new: true }
      );
      return res.json({
        Message: "The movie has been removed",
        Data: updatedUser,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: " + err);
    }
  }
);

/**
 * @description Add a movie to user's watch list
 * @description Adds a movie to the specified user's watch list.
 * @param {string} req.params.username - The username of the user (case-insensitive)
 * @param {string} req.params.movie_id - The ID of the movie to add to watch list
 * @returns {Object} 200 - Success response with updated user data
 * @returns {string} 400 - Bad request: movie already in watch list
 * @returns {string} 401 - Unauthorized: attempting to modify another user's watch list
 * @returns {string} 404 - Not found: user or movie not found
 * @returns {string} 500 - Internal server error
 * @example
 * // Request
 * POST /users/JaneDoe/towatch/64ffb72bfe2e3c001ef73c2c
 *
 * // Response
 * {
 *   "Message": "The movie has been added",
 *   "Data": {
 *     "_id": "64ffb72bfe2e3c001ef73c2b",
 *     "Username": "JaneDoe",
 *     "Email": "jane@example.com",
 *     "Birthday": "1985-05-15T00:00:00.000Z",
 *     "City": "Berlin",
 *     "FavoriteMovies": [],
 *     "ToWatch": ["64ffb72bfe2e3c001ef73c2c"]
 *   }
 * }
 */

app.post(
  "/users/:username/towatch/:movie_id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // validate user
    if (req.user.Username !== req.params.username) {
      return res.status(401).send("Permission denied");
    }

    try {
      // validate that user exist
      const userName = new RegExp(`^${req.params.username}$`, "i");
      const user = await Users.findOne({ Username: userName });
      if (!user) {
        return res.status(404).send("User not found");
      }

      // validate that movie exist and is not alerady in the list
      const movie = await Movies.findOne({ _id: req.params.movie_id });
      if (!movie) {
        return res.status(404).send("Movie not found");
      } else if (user.ToWatch.includes(movie.id)) {
        return res.status(400).send("Movie already in the list");
      }

      const updatedUser = await Users.findOneAndUpdate(
        { Username: userName },
        { $push: { ToWatch: movie.id } },
        { new: true }
      );
      return res.json({
        Message: "The movie has been added",
        Data: updatedUser,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: " + err);
    }
  }
);

/**
 * @description Add a movie to user's watch list
 * @description Removes a movie from the specified user's watch list.
 * @param {string} req.params.username - The username of the user (case-insensitive)
 * @param {string} req.params.movie_id - The ID of the movie to remove from watch list
 * @returns {Object} 200 - Success response with updated user data
 * @returns {string} 400 - Bad request: movie not in watch list
 * @returns {string} 401 - Unauthorized: attempting to modify another user's watch list
 * @returns {string} 404 - Not found: user or movie not found
 * @returns {string} 500 - Internal server error
 * @example
 * // Request
 * DELETE /users/JaneDoe/towatch/64ffb72bfe2e3c001ef73c2c
 *
 * // Response
 * {
 *   "Message": "The movie has been removed",
 *   "Data": {
 *     "_id": "64ffb72bfe2e3c001ef73c2b",
 *     "Username": "JaneDoe",
 *     "Email": "jane@example.com",
 *     "Birthday": "1985-05-15T00:00:00.000Z",
 *     "City": "Berlin",
 *     "FavoriteMovies": [],
 *     "ToWatch": []
 *   }
 * }
 */

app.delete(
  "/users/:username/towatch/:movie_id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // validate user
    if (req.user.Username !== req.params.username) {
      return res.status(401).send("Permission denied");
    }

    try {
      // validate that user exist
      const userName = new RegExp(`^${req.params.username}$`, "i");
      const user = await Users.findOne({ Username: userName });
      if (!user) {
        return res.status(404).send("User not found");
      }

      // validate that movie exist and is not in the list
      const movie = await Movies.findOne({ _id: req.params.movie_id });
      if (!movie) {
        return res.status(404).send("Movie not found");
      } else if (!user.ToWatch.includes(movie.id)) {
        return res.status(400).send("Movie not in the list");
      }

      const updatedUser = await Users.findOneAndUpdate(
        { Username: userName },
        { $pull: { ToWatch: movie.id } },
        { new: true }
      );
      return res.json({
        Message: "The movie has been removed",
        Data: updatedUser,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: " + err);
    }
  }
);

// error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(404).send("URL not found");
});

// listen for request
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});

/* app.listen(8080, () => {
    console.log('Your app is listening on ort 8080.');
}); */
