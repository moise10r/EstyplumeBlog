const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  user: {
    type: new mongoose.Schema({
      name: {
        type: String,
        require: true,
        minlength: 5,
        maxlength: 50,
      },
    }),
    required: true,
  },
  post: {
    type: new mongoose.Schema({
      title: {
        type: String,
        require: true,
        minlength: 5,
        maxlength: 50,
      },
    }),
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  commentedAt: {
    type: String,
    required: true,
  },
});

const Comments = mongoose.model("comments", commentSchema);

exports.Comments = Comments;
