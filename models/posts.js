const mongoose = require('mongoose');
const { categorySchema } = require('../models/catergory')

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    imagesUrl: {
        type:[String],
        required:true
    },
    body: {
        type: String,
        required: true
    },
    auth: {
        type:new mongoose.Schema({
            name: {
                type: String,
                require: true,
                minlength: 5,
                maxlength: 50
            }
        }),
        required:true
    },
    category: {
        type:categorySchema,
        required:true
    },
    postedAt: {
        type: String,
        required: true
    }
});

const Posts = mongoose.model('posts', postSchema);

exports.Posts = Posts;