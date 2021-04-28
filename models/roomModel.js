const mongoose = require('mongoose');

var roomSchema = new mongoose.Schema({
    surname: String,
    owner: String,
    invited: [String],
    messages:  [{
        date: Date,
        content: String,
        sender: String,
        readby: [String]
    }]
});

var roomModel = mongoose.model('room', roomSchema);

module.exports = roomModel;