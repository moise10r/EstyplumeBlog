const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
    userId: {
            type:String,
        },
   
    code: { type: String, required: true }
});

const CodeConfirm = mongoose.model('codes', codeSchema);

const ramdomCode = Math.floor(1000 + Math.random() * 9000);

exports.CodeConfirm = CodeConfirm;
exports.ramdomCode = ramdomCode;
