const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const helper = require("./users-test-helper");
const api = supertest(app);

beforeEach(async () => {
  await User.deleteMany({});
  const passwordHash = await bcrypt.hash("password", 10);
  const user = new User({
    name: "name",
    username: "username",
    passwordHash,
  });
  await user.save();
});

describe("initial database state", () => {
  test("users are returned as json", async () => {
    await api
      .get("/api/users")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("all users are returned", async () => {
    const usersInDb = await helper.usersInDb();
    const res = await api.get("/api/users");
    expect(res.body).toHaveLength(usersInDb.length);
  });

  test("user with username 'username' is returned", async () => {
    const res = await api.get("/api/users");
    const usernames = res.body.map((user) => user.username);
    expect(usernames).toContain("username");
  });

  test("users are returned without passwordHash properties", async () => {
    const res = await api.get("/api/users");
    const user = res.body[0];
    expect(user.passwordHash).not.toBeDefined();
  });
});

describe("getting individual user", () => {
  test("an individual user can be returned", async () => {
    const usersInDb = await helper.usersInDb();
    const user = usersInDb[0];
    const res = await api.get(`/api/users/${user.id}`).expect(200);
    expect(res.body).toEqual(user);
  });

  test("fails with nonexistent id", async () => {
    const nonexistentId = await helper.nonexistentId();
    await api.get(`/api/users/${nonexistentId}`).expect(404);
  });

  test("fails with invalid id", async () => {
    const id = "123";
    await api.get(`/api/users/${id}`).expect(400);
  });
});

describe("user creation", () => {
  test("valid user can be created", async () => {
    const usersAtStart = await helper.usersInDb();
    const newUser = {
      name: "newName",
      username: "newUsername",
      password: "newPassword",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    const usernames = usersAtEnd.map((user) => user.username);
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);
    expect(usernames).toContain(newUser.username);
  });

  test("user without a password cannot be created", async () => {
    const usersAtStart = await helper.usersInDb();
    const newUser = {
      name: "newName",
      username: "newUsername",
    };

    const res = await api.post("/api/users").send(newUser).expect(400);

    const usersAtEnd = await helper.usersInDb();
    const usernames = usersAtEnd.map((user) => user.username);
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
    expect(usernames).not.toContain("newUsername");
    expect(res.body.error).toContain("Password required");
  });

  test("user without a username cannot be created", async () => {
    const usersAtStart = await helper.usersInDb();
    const newUser = {
      name: "newName",
      password: "newPassword",
    };

    const res = await api.post("/api/users").send(newUser).expect(400);

    const usersAtEnd = await helper.usersInDb();
    const names = usersAtEnd.map((user) => user.name);
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
    expect(names).not.toContain("newName");
    expect(res.body.error).toContain("Username required");
  });

  test("user with duplicate username cannot be created", async () => {
    const usersAtStart = await helper.usersInDb();
    const newUser = {
      name: "newName",
      username: "username",
      password: "newPassword",
    };

    const res = await api.post("/api/users").send(newUser).expect(400);

    const usersAtEnd = await helper.usersInDb();
    const names = usersAtEnd.map((user) => user.name);
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
    expect(names).not.toContain("newName");
    expect(res.body.error).toContain("expected `username` to be unique");
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
