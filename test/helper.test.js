const helper = require("../utils/helper");
const blogs = require("../utils/blogs");

describe("total likes", () => {
  test("likes of empty list is 0", () => {
    expect(helper.totalLikes([])).toBe(0);
  });

  test("likes of single item is equal to the likes of that item", () => {
    expect(helper.totalLikes([blogs[0]])).toBe(7);
  });

  test("likes of multiple blogs are calculated accurately", () => {
    expect(helper.totalLikes(blogs)).toBe(36);
  });
});

describe("favorite blog", () => {
  test("returns null with empty list", () => {
    expect(helper.favoriteBlog([])).toBeNull();
  });

  test("returns only blog in a list of one item", () => {
    expect(helper.favoriteBlog([blogs[0]])).toEqual({
      title: "React patterns",
      author: "Michael Chan",
      likes: 7,
    });
  });

  test("returns blog with 0 likes in a list of one item", () => {
    expect(helper.favoriteBlog([blogs[4]])).toEqual({
      title: "TDD harms architecture",
      author: "Robert C. Martin",
      likes: 0,
    });
  });

  test("returns blog with most likes in a list of multiple items", () => {
    expect(helper.favoriteBlog(blogs)).toEqual({
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      likes: 12,
    });
  });
});

describe("most blogs", () => {
  test("returns null with empty list", () => {
    expect(helper.mostBlogs([])).toBeNull();
  });

  test("returns only author in a list of one item", () => {
    expect(helper.mostBlogs([blogs[0]])).toEqual({
      author: "Michael Chan",
      blogs: 1,
    });
  });

  test("returns author with most blogs in a list of multiple items", () => {
    expect(helper.mostBlogs(blogs)).toEqual({
      author: "Robert C. Martin",
      blogs: 3,
    });
  });
});

describe("most likes", () => {
  test("returns null with empty list", () => {
    expect(helper.mostLikes([])).toBeNull();
  });

  test("returns only author in a list of one item", () => {
    expect(helper.mostLikes([blogs[0]])).toEqual({
      author: "Michael Chan",
      likes: 7,
    });
  });

  test("returns author with most likes in a list of multiple items", () => {
    expect(helper.mostLikes(blogs)).toEqual({
      author: "Edsger W. Dijkstra",
      likes: 17,
    });
  });
});
