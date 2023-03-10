const User = require("../models/user");
const bcrypt = require("bcrypt");

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((user) => user.toJSON());
};

const nonexistentId = async () => {
  const passwordHash = await bcrypt.hash("c", 10);
  const user = new User({
    name: "a",
    username: "b",
    passwordHash,
  });

  await user.save();
  await User.deleteOne({ username: "b" });

  return user._id.toString();
};

module.exports = { usersInDb, nonexistentId };
