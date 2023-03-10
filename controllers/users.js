const usersRouter = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");

usersRouter.get("/", async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

usersRouter.get("/:id", async (req, res) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json(user);
});

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
