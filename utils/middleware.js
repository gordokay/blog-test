const logger = require("./logger");

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
  }
  next(error);
};

module.exports = { unknownEndpoint, errorHandler };
