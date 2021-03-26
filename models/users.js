const mongoose = require("mongoose");
const Joi = require("@hapi/joi");

const userSchema = new mongoose.Schema({

  lastName: {
    type: String,
    minlength: 3,
    maxlength: 50,
  },
  username: {
    type: String,
    require: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  name: {
    type: String,
    require: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    require: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  entreprise: {
    type: String,
    minlength: 3,
    maxlength: 50,
  },
  ville: {
    type: String,
    minlength: 3,
    maxlength: 50,
  },
  postalCode: {
    type: Number,
  },
  country: {
    type: String,
    minlength: 3,
    maxlength: 50,
  },
  password: {
    type: String,
    require: true,
    minlength: 5,
    maxlength: 1024,
  },
  aboutMe: {
    type: String,
    minlength: 3,
    maxlength: 50,
  },
  imageUrl: {
    type: String,
  },
  createdAt: {
    type: String,
    required: true,
  },
  isSuperAdmin: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

const User = mongoose.model("users", userSchema);
exports.User = User;
