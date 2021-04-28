const mongoose = require('mongoose');

var juserSchema = new mongoose.Schema({
    surname: String,
    email: String,
    password: String,
    rooms: [String]
});

var juserModel = mongoose.model('juser', juserSchema);

module.exports = juserModel;
