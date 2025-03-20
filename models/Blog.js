const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  readMinute: {
    type: Number,
    required: [true, 'Read time is required']
  },
  postDate: {
    type: Date,
    default: Date.now
  },
  image: {
    type: String,
    required: [true, 'Image is required']
  }
});

module.exports = mongoose.model('Blog', blogSchema);