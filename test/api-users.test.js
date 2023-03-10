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
