const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2; // Example for Cloudinary integration

const HttpError = require('../models/http-error');
const User = require('../models/user');

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError(
      'Fetching users failed, please try again later.',
      500
    );
    return next(error);
  }
  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};


// Configure Cloudinary (assuming you have set up Cloudinary environment variables)
cloudinary.config({
  cloud_name: "dkkvohlfa",
  api_key: "337213324555484",
  api_secret: "D8grGtcqVhgrDrc_VxrJjf-Lfbc",
});

const signup = async (req, res, next) => {
  console.log("Hello");
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { name, email, password } = req.body;

 



  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists already, please login instead.',
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      'Could not create user, please try again.',
      500
    );
    return next(error);
  }


   
    // Check if file is uploaded
  if (!req.file) {
    console.error("No file uploaded");
    const error = new HttpError('No image uploaded, please try again.', 400);
    return next(error);
  }

  // Upload image to Cloudinary (using upload_stream for buffer)
  let imageUrl;
  try {
    // Use a stream to upload the buffer data
    const cloudinaryResponse = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' }, // Auto-detect file type (e.g., image, video)
        (error, result) => {
          if (error) {
            reject(new Error('Image upload failed'));
          }
          resolve(result);
        }
      );
      // Pipe the file buffer to the Cloudinary stream
      stream.end(req.file.buffer);
    });

    imageUrl = cloudinaryResponse.secure_url; // Cloudinary provides a URL after the upload
    console.log("Image uploaded to Cloudinary:", imageUrl);
  } catch (err) {
    console.error("Error uploading image to Cloudinary:", err);
    const error = new HttpError('Image upload failed, please try again later.', 500);
    return next(error);
  }
  
  const createdUser = new User({
    name,
    email,
    // image: req.file.path,
    image: imageUrl, // Store the image URL in your database
    password: hashedPassword,
    places: []
  });

console.log(createdUser,"createdUser");

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      // `${process.env.JWT_KEY}`,
      "supersecret_dont_share",
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  console.log(email,password);
  

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
    console.log(existingUser);
    
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      'Could not log you in, please check your credentials and try again.',
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      'supersecret_dont_share',
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
