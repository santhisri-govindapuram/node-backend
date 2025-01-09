const fs = require("fs");
const path = require("path");

const express = require("express");
const mongoose = require("mongoose");
require('dotenv').config();



const app = express();

// Routes and error model imports
const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

// MongoDB connection URL
const url =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0sjhe.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
  // `mongodb+srv://santhisrigovindapuram:D2V9jyHFUy3mHcl7@cluster0.0sjhe.mongodb.net/mern?retryWrites=true&w=majority`;


  //

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS with allowed origins
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

  next();
});

// Serve static files from the "uploads/images" directory
// app.use("/uploads/images", express.static(path.join("uploads", "images")));
app.use("public/uploads/images", express.static(path.join("public","uploads", "images")));










// Route handlers
app.use("/api/users", usersRoutes);
app.use("/api/places", placesRoutes);

// app.use('/public/uploads/images', express.static(path.join(__dirname, 'public/uploads/images')));
// app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));



// Catch-all route for unknown endpoints
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  next(error);
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      if (err) console.log("File deletion error:", err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

// Connect to MongoDB and start the server

const port = process.env.API_PORT
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
    console.log("Connected to database!");
  })
  .catch((err) => {
    console.log("Database connection error:", err);
  });



  module.exports = app;