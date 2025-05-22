# myFlixVintage Movie API
This API powers the back-end of myFlixVintage movie application. It allows users to access detailed information about vintage movies, genres, and directors to enhance their movie knowledge.
Users can also manage their profiles and maintain a personalized list of favorite movies. This API is useful both for movie enthusiasts who want to explore film data and for front-end developers building the client-side of the application.

---

## Table of Contents

- [Project Overview](#project-overview)  
- [Tech Stack](#tech-stack)  
- [Deployment](#deployment)  
- [Authentication](#authentication)  
- [API Endpoints](#api-endpoints)   

---

## Project Overview

The myFlix API serves movie, actor, director, genre, and user information with full CRUD support.  
Users can register, update profiles, add movies to favorites or watch lists, and retrieve movie details via the API.

---

## Tech Stack

- **Node.js** — Server-side runtime environment  
- **Express** — Web framework for routing and middleware  
- **MongoDB** — NoSQL database for storing movie and user data  
- **Mongoose** — ODM for MongoDB  
- **JWT (JSON Web Tokens)** — User authentication and authorization  
- **Passport.js** — Authentication middleware  
- **Heroku** — Cloud deployment platform  
- **MongoDB Atlas** — Cloud-hosted MongoDB service  
- **HTML & JavaScript** — API documentation and testing interface  

---

## Deployment

- The API is deployed on **Heroku** and connected to a **MongoDB Atlas** cluster for data persistence.  
- The environment variables for database connection and JWT secrets are configured securely in Heroku.  

---

## Authentication & Security

- The API uses **JWT (JSON Web Tokens)** and **HTTP** authentication.  
- Password hashing.  
- Validation of User inputs through **Joi** schemas.

---

## API Endpoints

### Movie-related Endpoints

| Endpoint                  | Method | Description                          |
|---------------------------|--------|------------------------------------|
| `/movies`                 | GET    | Get all movies                     |
| `/movies/:title`          | GET    | Get a movie by title               |
| `/genres/:name`           | GET    | Get info about a genre             |
| `/directors/:name`        | GET    | Get info about a director          |
| `/actors/:name`           | GET    | Get info about an actor            |

### User-related Endpoints

| Endpoint                                  | Method | Description                             |
|-------------------------------------------|--------|---------------------------------------|
| `/users`                                  | POST   | Register a new user                   |
| `/users/:username`                        | PUT    | Update user info                      |
| `/users/:username`                        | DELETE | Delete a user                         |
| `/users/:username/favorites/:movie`       | POST   | Add a movie to favorites              |
| `/users/:username/favorites/:movie`       | DELETE | Remove a movie from favorites         |
| `/users/:username/towatch/:movie`         | POST   | Add a movie to To Watch list          |
| `/users/:username/towatch/:movie`         | DELETE | Remove a movie from To Watch list     |

---

