const mongoose = require('mongoose');
const Joi = require('joi');

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    }
})
const Category = mongoose.model('categories',categorySchema);
exports.Category = Category
exports.categorySchema = categorySchema
