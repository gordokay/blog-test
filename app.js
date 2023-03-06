const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

const blogsRouter = require("./controllers/blogs");
const middleware = require("./utils/middleware");
const config = require("./utils/config");
const logger = require("./utils/logger");

mongoose.set("strictQuery", false);

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((error) => logger.error(`Error connecting to MongoDB: ${error}`));

process.on("SIGINT", () => {
  mongoose.connection.close().then(() => {
    logger.info("MongoDB connection closed");
    process.exit(0);
  });
});

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

app.use("/api/blogs", blogsRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;