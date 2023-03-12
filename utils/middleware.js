const logger = require("./logger");
const config = require("./config");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userExtractor = async (req, res, next) => {
  const auth = req.get("authorization");
  if (auth && auth.startsWith("Bearer ")) {
    const decodedToken = jwt.verify(auth.replace("Bearer ", ""), config.SECRET);
    if (!decodedToken.id) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    req.user = user.id;
  } else {
    return res.status(401).json({ error: "Authorization required" });
  }
  next();
};

const unknownEndpoint = (req, res) => {
  res.status(404).json({ error: "Unknown endpoint" });
};

const errorHandler = (error, req, res, next) => {
  logger.error(error);
  if (error.name === "CastError") {
    return res.status(400).json({ error: "Malformed id" });
  } else if (error.name === "ValidationError") {
    return res.status(400).json({
      error: error.message,
    });
  } else if (error.name === "JsonWebTokenError") {
    return res.status(401).json({ error: error.message });
  } else if (error.name === "TokenExpiredError") {
    return res.status(401).error({ error: "Token expired" });
  }
  next(error);
};

module.exports = { userExtractor, unknownEndpoint, errorHandler };
