const mongoose = require("mongoose");

const TodoSchema = mongoose.Schema({
    text: {
        type: String,
        required: true,
        minlength: 2,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Number,
        default: null
    },
    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
})

const Todo = mongoose.model('Todo', TodoSchema)

module.exports = {Todo}