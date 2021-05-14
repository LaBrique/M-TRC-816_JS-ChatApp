const app = require('express')();
var express = require('express');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const nodemailer = require('nodemailer');
const mongoose = require('./database.js');
const juserModel = require("./models/jusersModel.js");
const RoomModel = require("./models/roomModel.js")

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function saveMessage(msg) {
	juserModel.findOne({_id: msg.sender}, (err, user) => {
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

function sendmail(user) {
	var transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: "vrghost.eip@gmail.com",
			pass: "grossevache1"
		}
	});

	var mailOptions = {
		from: 'VRghost.project@gmail.com',
		to: user._id,
		subject: 'Activation de votre compte Vchat',
		text: `Cliquez sur le lien pour activer votre compte:\nhttp://localhost:8080/api/users-creates/${user._id}/validation`,
		html: `
			<div style="text-align:center; background-color:#4d4d4d; padding-bottom:30px; color:#ffffff;margin-top: -4px;height: 123px;width: 816px;margin-left: 2px;border-top-width: 2px;border-top-style: solid; border-color: black">
				${user.surname}, bienvenue chez Vchat!
				<br/>
				<br/>
				Afin de finaliser la création de votre compte, cliquez sur le bouton "Activer", ou utilisez ce lien:
				<a href="http://localhost:8080/api/users-creates/${user._id}/validation" style="color: #a4a4a4">
					http://localhost:8080/api/users-creates/${user._id}/validation
				</a>
				<br/>
				<br/>
				<br/>
				<br/>
				<a href="http://localhost:8080/api/users-creates/${user._id}/validation" style="background-color: #38d39f; padding: 10px 15px; border: 2px; border-color: #ffffff; border-style: solid; color: #4d4d4d; font-size: 22px; text-decoration: none">
					Activer
				</a>
			</div>
		`
	}

	transporter.sendMail(mailOptions, (err, info) => {
		if (err)
			console.log(err);
		else
			console.log(info.response);
	});
	transporter.close();
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

app.post('/users', (req, res) => {
	console.log(req.body)
	const surname = req.query.surname;
	const email = req.query.email;
	const password = req.query.password;

	var create = new juserModel({
		surname: surname,
		email: email,
		password: password,
		rooms: [],
		confirmed: false,
		login: false
	});
	create.save().then((report) => {
		res.sendStatus(200);
	})
	.catch((err) => {
		console.log(err);
		res.send(301);
	});

})

app.get('/users', (req, res) => {
	juserModel.find({}, (err, users) => {
		res.send({'users': users});
	}).catch((err) => {
		console.log(err);
		res.send(301);
	})
})

app.get('/users/:id/confirmation', (req, res) => {
	const userId = req.params.id;
	juserModel.findOne({'_id': userId}, (err, user) => {
		user.confirmed = true;
		user.save().then((user) => {
			res.redirect('');
		}).catch((err) => {
			console.log(err);
			res.send(301);
		});
	}).catch((err) => {
		console.log(err);
		res.send(301);
	})
})


app.get('/users/:id/logout', (req, res) => {
	const userId = req.params.id;
	juserModel.findOne({'_id': userId}, (err, user) => {
		user.login = false;
		user.save().then((user) => {
			res.send(204);
		}).catch((err) => {
			console.log(err);
			res.send(301);
		});
	}).catch((err) => {
		console.log(err);
		res.send(301);
	})
})

app.get('/users/:id/rooms', (req, res) => {
	const userId = req.params.id;
	juserModel.findOne({'_id': userId}, (err, user) => {
		res.send({'room': user.rooms});
;	}).catch((err) => {
		console.log(err);
		res.send(301);
	})
})

app.post('/users/:id/password', (req, res) => {
	const userId = req.params.id;
	const password = req.query.password
	juserModel.findOne({'_id': userId}, (err, user) => {
		user.password = password;
		user.save().then((user) => {
			res.send(204);
		}).catch((err) => {
			console.log(err);
			res.send(301);
		});
	}).catch((err) => {
		console.log(err);
		res.send(301);
	})
})

app.post('/login', (req, res) => {
	const email = req.query.email;
	const password = req.query.password;
	juserModel.findOne({'email': email, 'password': password}, (err, user) => {
		if (user.confirmed) {
			user.login = true;
			user.save().then((user) => {
				res.send(user._id);
			}).catch((err) => {
				console.log(err);
				res.send(301);
			});
		} else {
			res.send(301);
		}
	}).catch((err) => {
		console.log(err);
		res.send(301);
	})
})

app.get('/rooms/:roomId/messages', (req, res) => {
	const roomId = req.params.roomId;

	RoomModel.findOne({'_id': roomId}, (err, room) => {
		res.send({'messages': room.messages});
	}).catch((err) => {
		console.log(err);
		res.send(301);
	})
})

app.post('/rooms/:userId', (req, res) => {
	const userId = req.params.userId;

	const surname = req.query.surname;

	juserModel.findOne({'_id': userId}, (err, user) => {
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

	juserModel.findOne({'_id': userId}, (err, user) => {
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
