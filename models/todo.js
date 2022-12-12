const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const Todo = mongoose.model('Todo', new mongoose.Schema({
    title: {
        type: String,
        required: true,
    }
}));

exports.Todo = Todo;