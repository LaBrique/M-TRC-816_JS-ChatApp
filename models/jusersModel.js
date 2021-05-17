const mongoose = require('mongoose');

var juserSchema = new mongoose.Schema({
    username: { type: String, unique: true},
    email: { type: String, unique: true},
    password: String,
    rooms: [{
		surname: String,
		id: String
	}],
    login: Boolean,
    confirmed: Boolean
});

var juserModel = mongoose.model('juser', juserSchema);

module.exports = juserModel;
