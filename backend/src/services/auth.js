const bcrypt = require('bcrypt');
const User = require('../models/user');

const createUser = async (userData) => {
  const { name, email, password } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    name,
    email,
    password: hashedPassword,
  });
  await user.save();
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
  };
};

const loginUser = async (credentials) => {
  const { email, password } = credentials;
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
  };
};

const getUserProfile = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
  };
};

module.exports = {
  createUser,
  loginUser,
  getUserProfile,
};