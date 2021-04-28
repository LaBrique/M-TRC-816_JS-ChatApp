const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const mongoose = require('./database.js');
const UserModel = require("./models/jusersModel.js");
const RoomModel = require("./models/roomModel.js")

function saveMessage(msg) {
	UserModel.findOne({_id: msg.sender}, (err, user) => {
		if (user) {
			RoomModel.findOne({_id: msg.room}, (err, room) => {
				room.messages.push({
					date: new Date,
					content: msg.msg,
					sender: user.surname,
					readby: [user._id]
				});
				room.save();
			})
		}
	})
}

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
	socket.on('join room', (msg) => {
		console.log(socket.rooms);
		socket.rooms.forEach((item) => {
			if (item == socket.id) return;
			socket.leave(item);
		});
		socket.join(msg.room);
		console.log(socket.rooms);
	})
	socket.on('chat message', (msg) => {
		console.log(msg);
		saveMessage(msg);
		io.to(msg.room).emit('chat message', msg.msg);
	});
});

app.post('/user', (req, res) => {
	const surname = req.query.surname;
	const email = req.query.email;
	const password = req.query.password;

	var create = new UserModel({
		surname: surname,
		email: email,
		password: password,
		rooms: []
	});
	create.save().then((report) => {
		res.send(200);
	})
	.catch((err) => {
		console.log(err);
		res.send(301);
	});

})

app.post('/rooms/:userId', (req, res) => {
	const userId = req.params.userId;

	const surname = req.query.surname;

	UserModel.findOne({'_id': userId}, (err, user) => {
		var create = new RoomModel({
			surname: surname,
			owner: userId,
			invited: [],
			messages:  [{
		            date: new Date,
		            content: `Room created by ${user.surname}.`,
		            sender: "System",
		            readby: []
		        }]
		});
		create.save().then((room) => {
			user.rooms.push(room._id);
			user.save();
			res.send(200);
		})
		.catch((err) => {
			console.log(err);
			res.send(301);
		});
	})
	.catch((err) => {
		console.log(err);
		res.send(301);
	})
})

app.get('/clients', (req, res) => {
	res.send(String(io.sockets.sockets.size));
})

app.get('/rooms/:userId', (req, res) => {
	const userId = req.params.userId;

	UserModel.findOne({'_id': userId}, (err, user) => {
		if (!user) {
			res.send(404);
		} else {
			res.send(user.rooms);
		}
	})
})

http.listen(3000, () => {
	console.log('listening on *:3000');
});
