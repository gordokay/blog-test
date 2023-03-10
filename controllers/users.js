const usersRouter = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");

usersRouter.post("/", async (req, res) => {
  const { name, username, password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password required" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({
    name,
    username,
    passwordHash,
  });

  const savedUser = await user.save();
  res.status(201).json(savedUser);
});

module.exports = usersRouter;
