const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blog");

const api = supertest(app);

const initialBlogs = [
  {
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
  },
  {
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
  },
];

beforeEach(async () => {
  await Blog.deleteMany({});
  await new Blog(initialBlogs[0]).save();
  await new Blog(initialBlogs[1]).save();
});

test("blogs are returned as json", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("all blogs are returned", async () => {
  const res = await api.get("/api/blogs");
  expect(res.body).toHaveLength(initialBlogs.length);
});

test("a blog is titled React patterns", async () => {
  const res = await api.get("/api/blogs");
  const titles = res.body.map((blog) => blog.title);
  expect(titles).toContain("React patterns");
});

test("a valid blog can be added", async () => {
  const newBlog = {
    title: "Canonical string reduction",
    author: "Edsger W. Dijkstra",
    url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
    likes: 12,
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const res = await api.get("/api/blogs");
  const titles = res.body.map((blog) => blog.title);

  expect(res.body).toHaveLength(initialBlogs.length + 1);
  expect(titles).toContain("Canonical string reduction");
});

test("invalid blogs cannot be added", async () => {
  const invalidBlog = {
    author: "Robert C. Martin",
  };

  await api.post("/api/blogs").send(invalidBlog).expect(400);

  const res = await api.get("/api/blogs");
  expect(res.body).toHaveLength(initialBlogs.length);
});

afterAll(async () => {
  await mongoose.connection.close();
});
