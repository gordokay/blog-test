const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");
const { userExtractor } = require("../utils/middleware");

blogsRouter.get("/", async (req, res) => {
  const blogs = await Blog.find({}).populate("user", { name: 1, username: 1 });
  res.json(blogs);
});

blogsRouter.get("/:id", async (req, res) => {
  const id = req.params.id;
  const blog = await Blog.findById(id).populate("user", {
    name: 1,
    username: 1,
  });
  if (!blog) {
    return res.status(404).json({ error: "Blog not found" });
  }
  res.json(blog);
});

blogsRouter.post("/", userExtractor, async (req, res) => {
  const body = req.body;
  const user = await User.findById(req.user);
  if (!user) {
    return res.status(401).json({ error: "Invalid user" });
  }
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id,
  });

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();
  res.status(201).json(savedBlog);
});

blogsRouter.delete("/:id", userExtractor, async (req, res) => {
  const id = req.params.id;
  const blog = await Blog.findById(id);
  if (blog.user.toString() !== req.user) {
    return res.status(404).json({ error: "Unauthorized command" });
  }
  await Blog.findByIdAndDelete(id);
  res.status(204).end();
});

blogsRouter.patch("/:id", userExtractor, async (req, res) => {
  const id = req.params.id;
  const blog = await Blog.findById(id);
  if (!blog) {
    return res.status(404).json({ error: "Blog not found" });
  }
  if (blog.user.toString() !== req.user) {
    return res.status(404).json({ error: "Unauthorized command" });
  }
  const newLikes = {
    likes: req.body.likes,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(id, newLikes, {
    new: true,
    runValidators: true,
  });
  res.json(updatedBlog);
});

module.exports = blogsRouter;
