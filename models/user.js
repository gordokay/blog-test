const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  username: {
    type: String,
    required: [true, "Username required"],
  },
  passwordHash: {
    type: String,
    required: [true, "Password required"],
  },
  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
    },
  ],
});

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  },
});

module.exports = mongoose.model("User", userSchema);
