const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const bcrypt = require("bcrypt");
const Blog = require("../models/blog");
const User = require("../models/user");
const helper = require("./blogs-test-helper");
const api = supertest(app);

beforeEach(async () => {
  await Blog.deleteMany({});
  const initialBlogs = helper.initialBlogs.map((blog) => new Blog(blog));
  await Promise.all(initialBlogs.map((blog) => blog.save()));
});

let token;
beforeAll(async () => {
  await User.deleteMany({});
  const passwordHash = await bcrypt.hash("password", 10);
  const user = new User({
    name: "user",
    username: "username",
    passwordHash,
  });

  await user.save();
  const res = await api
    .post("/api/login")
    .send({ username: "username", password: "password" });
  token = res.body.token;
});

describe("initial database state", () => {
  test("blogs are returned as json", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("all blogs are returned", async () => {
    const res = await api.get("/api/blogs");
    expect(res.body).toHaveLength(helper.initialBlogs.length);
  });

  test("blogs are returned with an id property instead of _id", async () => {
    const res = await api.get("/api/blogs");
    const blog = res.body[0];
    expect(blog.id).toBeDefined();
    expect(blog._id).not.toBeDefined();
  });

  test("a blog is titled React patterns", async () => {
    const res = await api.get("/api/blogs");
    const titles = res.body.map((blog) => blog.title);
    expect(titles).toContain("React patterns");
  });
});

describe("getting individual blog", () => {
  test("an individual blog can be returned", async () => {
    const blogs = await helper.blogsInDb();
    const blog = blogs[0];

    const returnedBlog = await api
      .get(`/api/blogs/${blog.id}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(returnedBlog.body).toEqual(blog);
  });

  test("fails with nonexistent blog", async () => {
    const nonexistentId = await helper.nonexistentId();
    await api.get(`/api/blogs/${nonexistentId}`).expect(404);
  });

  test("fails with invalid id", async () => {
    const id = "123";
    await api.get(`/api/blogs/${id}`).expect(400);
  });
});

describe("blog creation", () => {
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
      .set("Authorization", `Bearer ${token}`)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const newBlogs = await helper.blogsInDb();
    expect(newBlogs).toHaveLength(helper.initialBlogs.length + 1);

    const titles = newBlogs.map((blog) => blog.title);
    expect(titles).toContain("Canonical string reduction");
  });

  test("a valid blog without a likes field is defaulted to 0 likes", async () => {
    const newBlog = {
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .set("Authorization", `Bearer ${token}`)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const newBlogs = await helper.blogsInDb();
    const blog = newBlogs.find((blog) => blog.title === newBlog.title);
    expect(blog.likes).toBe(0);
  });

  test("invalid blogs cannot be added", async () => {
    const invalidBlog = {
      author: "Robert C. Martin",
    };

    const res = await api
      .post("/api/blogs")
      .send(invalidBlog)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    const newBlogs = await helper.blogsInDb();
    expect(newBlogs).toHaveLength(helper.initialBlogs.length);
    expect(res.body.error).toContain("Title required");
  });

  test("invalid blogs with negative likes cannot be added", async () => {
    const invalidBlog = {
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
      likes: -1000,
    };

    const res = await api
      .post("/api/blogs")
      .send(invalidBlog)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    const newBlogs = await helper.blogsInDb();
    expect(newBlogs).toHaveLength(helper.initialBlogs.length);
    expect(res.body.error).toContain("Likes must be non-negative");
  });

  test("blog cannot be added without token", async () => {
    const newBlog = {
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
      likes: 12,
    };

    await api.post("/api/blogs").send(newBlog).expect(401);
    const newBlogs = await helper.blogsInDb();
    expect(newBlogs).toHaveLength(helper.initialBlogs.length);
  });

  test("blog canot be added with invalid token", async () => {
    const newBlog = {
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
      likes: 12,
    };

    const res = await api
      .post("/api/blogs")
      .send(newBlog)
      .set("Authorization", "Bearer 1234567")
      .expect(401);

    const newBlogs = await helper.blogsInDb();
    expect(newBlogs).toHaveLength(helper.initialBlogs.length);
    expect(res.body.error).toContain("jwt malformed");
  });
});

describe("blog deletion", () => {
  test("a blog can be deleted by the user that created it", async () => {
    const blog = {
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
    };

    const res = await api
      .post("/api/blogs")
      .send(blog)
      .set("Authorization", `Bearer ${token}`);

    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = res.body;

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1);

    const titles = blogsAtEnd.map((blog) => blog.title);
    expect(titles).not.toContain(blogToDelete.title);
  });

  test("fails with unauthorized user", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    const res = await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(401);

    expect(res.body.error).toContain("Unauthorized command");
    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length);
  });

  test("deletion of a nonexistent blog does not change database state", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const nonexistentId = await helper.nonexistentId();
    await api
      .delete(`/api/blogs/${nonexistentId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);
    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length);
  });

  test("fails with invalid id", async () => {
    const id = "123";
    await api
      .delete(`/api/blogs/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
  });
});

describe("blog update", () => {
  test("a blog can be updated with a valid likes field", async () => {
    const newBlog = {
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
      likes: 12,
    };

    const res = await api
      .post("/api/blogs")
      .send(newBlog)
      .set("Authorization", `Bearer ${token}`);

    const blogToUpdate = res.body;

    await api
      .patch(`/api/blogs/${blogToUpdate.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ likes: 1000 })
      .expect(200);

    const blogsAtEnd = await helper.blogsInDb();
    const updatedBlog = blogsAtEnd.find(
      (blog) => blog.title === blogToUpdate.title
    );
    expect(updatedBlog.likes).toBe(1000);
  });

  test("a blog will not be updated with a negative likes field", async () => {
    const newBlog = {
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
      likes: 12,
    };

    const res = await api
      .post("/api/blogs")
      .send(newBlog)
      .set("Authorization", `Bearer ${token}`);

    const blogToUpdate = res.body;

    await api
      .patch(`/api/blogs/${blogToUpdate.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ likes: -1000 })
      .expect(400);

    const blogsAtEnd = await helper.blogsInDb();
    const updatedBlog = blogsAtEnd.find(
      (blog) => blog.title === blogToUpdate.title
    );
    expect(updatedBlog.likes).toBe(blogToUpdate.likes);
  });

  test("fails with nonexistent blog", async () => {
    const nonexistentId = await helper.nonexistentId();
    await api
      .patch(`/api/blogs/${nonexistentId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });

  test("fails with invalid id", async () => {
    const id = "123";
    await api
      .patch(`/api/blogs/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
  });

  test("fails with unauthorized user", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];

    const res = await api
      .patch(`/api/blogs/${blogToUpdate.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ likes: 0 })
      .expect(401);

    const blogsAtEnd = await helper.blogsInDb();
    const updatedBlog = blogsAtEnd.find(
      (blog) => blog.title === blogToUpdate.title
    );
    expect(res.body.error).toContain("Unauthorized command");
    expect(updatedBlog.likes).toBe(blogToUpdate.likes);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
