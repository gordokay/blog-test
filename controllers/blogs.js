const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");

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

blogsRouter.post("/", async (req, res) => {
  const body = req.body;
  const user = await User.findById(body.userId);
  if (!user) {
    return res.status(400).json({ error: "Invalid user" });
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

blogsRouter.delete("/:id", async (req, res) => {
  const id = req.params.id;
  await Blog.findByIdAndDelete(id);
  res.status(204).end();
});

blogsRouter.patch("/:id", async (req, res) => {
  const id = req.params.id;
  const newLikes = {
    likes: req.body.likes,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(id, newLikes, {
    new: true,
    runValidators: true,
  });

  if (!updatedBlog) {
    return res.status(404).json({ error: "Blog not found" });
  }
  res.json(updatedBlog);
});

module.exports = blogsRouter;
