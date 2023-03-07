const totalLikes = (blogs) => {
  return blogs.reduce((acc, curr) => acc + curr.likes, 0);
};

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) return null;
  return blogs.reduce(
    (prev, curr) => {
      if (curr.likes > prev.likes) {
        return {
          title: curr.title,
          author: curr.author,
          likes: curr.likes,
        };
      }
      return prev;
    },
    { likes: -1 }
  );
};

const mostBlogs = (blogs) => {
  if (blogs.length === 0) return null;
  let maxBlogs = 0;
  let maxAuthor;
  blogs.reduce((acc, curr) => {
    if (acc[curr.author]) {
      acc[curr.author] += 1;
    } else {
      acc[curr.author] = 1;
    }
    if (acc[curr.author] > maxBlogs) {
      maxBlogs = acc[curr.author];
      maxAuthor = curr.author;
    }
    return acc;
  }, {});
  return { author: maxAuthor, blogs: maxBlogs };
};

const mostLikes = (blogs) => {
  if (blogs.length === 0) return null;
  let maxLikes = 0;
  let maxAuthor;
  blogs.reduce((acc, curr) => {
    if (acc[curr.author]) {
      acc[curr.author] += curr.likes;
    } else {
      acc[curr.author] = curr.likes;
    }
    if (acc[curr.author] > maxLikes) {
      maxLikes = acc[curr.author];
      maxAuthor = curr.author;
    }
    return acc;
  }, {});
  return { author: maxAuthor, likes: maxLikes };
};

module.exports = { totalLikes, favoriteBlog, mostBlogs, mostLikes };
