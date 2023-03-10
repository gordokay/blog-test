const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title required"],
  },
  author: {
    type: String,
    required: [true, "Author required"],
  },
  url: {
    type: String,
    required: [true, "Url required"],
  },
  likes: {
    type: Number,
    min: [0, "Likes must be non-negative"],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

blogSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Blog", blogSchema);
