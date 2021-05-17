const app = require('express')();
var express = require('express');
const http = require('http').Server(app);
const io = require('socket.io')(http, {cors: {origin: '*'}});
const port = process.env.PORT || 3000;
const nodemailer = require('nodemailer');
const mongoose = require('./database.js');
const juserModel = require("./models/jusersModel.js");
const RoomModel = require("./models/roomModel.js")
const cors = require("cors");

var corsOptions = {
	"origin": "*",
	"methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
	"preflightContinue": false,
	"optionsSuccessStatus": 204
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

const headers = (req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', "*")
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
	res.setHeader('Access-Control-Allow-Credentials', true)
	next()
}

function saveMessage(msg) {
	juserModel.findOne({_id: msg.sender}, (err, user) => {
		if (user) {
			RoomModel.findOne({_id: msg.room}, (err, room) => {
				room.messages.push({
					date: new Date,
					content: msg.msg,
					sender: user.username,
					readby: [user._id]
				});
				room.save();
			})
		}
	})
}

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

function sendMail(user) {
	var transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: "chatappepi2022@gmail.com",
			pass: "wololo2022420"
		}
	});

	var mailOptions = {
		from: "chatappepi2022@gmail.com",
		to: user.email,
		subject: 'Activation de votre compte Vchat',
		text: `Cliquez sur le lien pour activer votre compte:\nhttp://localhost:8080/users/${user._id}/confirmation`,
		html: `
			<div style="text-align:center; background-color:#4d4d4d; padding-bottom:30px; color:#ffffff;margin-top: -4px;height: 123px;width: 816px;margin-left: 2px;border-top-width: 2px;border-top-style: solid; border-color: black">
				${user.username}, bienvenue chez Vchat!
				<br/>
				<br/>
				Afin de finaliser la création de votre compte, cliquez sur le bouton "Activer", ou utilisez ce lien:
				<a href="http://localhost:8080/users/${user._id}/confirmation" style="color: #a4a4a4">
					http://localhost:8080/users/${user._id}/confirmation
				</a>
				<br/>
				<br/>
				<br/>
				<br/>
				<a href="http://localhost:8080/users/${user._id}/confirmation" style="background-color: #38d39f; padding: 10px 15px; border: 2px; border-color: #ffffff; border-style: solid; color: #4d4d4d; font-size: 22px; text-decoration: none">
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

app.get('/', cors(), headers, (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

app.get('/login', cors(), headers, (req, res) => {
	const username = req.query.username;
	const password = req.query.password;
	juserModel.findOne({'username': username, 'password': password}, (err, user) => {
		if (user.confirmed) {
			user.login = true;
			user.save().then((user) => {
				res.json({ 'text': `logged in as ${user.username}`, 'id': user._id });
			}).catch((err) => {
				console.log(err);
				res.send(301);
			});
		} else {
			console.log("helo")
			res.status(403).json({ 'text': `Please confirm your account before logging in`})
		}
	}).catch((err) => {
		console.log(err);
		res.send(301);
	})
})

app.get('/register', cors(), headers, (req, res) => {
	console.log(req.body)
	const email = req.query.email;
	const username = req.query.username;
	const password = req.query.password;

	var create = new juserModel({
		email: email,
		username: username,
		password: password,
		rooms: [],
		confirmed: false,
		login: false
	});
	create.save().then((user) => {
		sendMail(user);
		res.json({ 'text': `registered as ${user.username}.  \n\nCheck your mailbox to confirm your account.`, 'id': user._id });
	})
	.catch((err) => {
		console.log(err);
		res.send(301);
	});
})

app.get('/users', cors(), headers, (req, res) => {
	juserModel.find({}, (err, users) => {
		res.json({'users': users});
	}).catch((err) => {
		console.log(err);
		res.send(301);
	})
})

app.get('/rooms', cors(), headers, (req, res) => {
	RoomModel.find({}, (err, rooms) => {
		res.json({'rooms': rooms});
	}).catch((err) => {
		console.log(err);
		res.send(301);
	})
})

app.get('/users/:id/confirmation', cors(), headers, (req, res) => {
	const userId = req.params.id;
	juserModel.findOne({'_id': userId}, (err, user) => {
		user.confirmed = true;
		user.save().then((user) => {
			res.send("Compte confirmé, vous pouvez fermer cette page.");
		}).catch((err) => {
			console.log(err);
			res.send(301);
		});
	}).catch((err) => {
		console.log(err);
		res.send(301);
	})
})


app.get('/users/:id/logout', cors(), headers, (req, res) => {
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

app.get('/users/:id/rooms', cors(), headers, (req, res) => {
	const userId = req.params.id;
	juserModel.findOne({'_id': userId}, (err, user) => {
		res.send({'room': user.rooms});
;	}).catch((err) => {
		console.log(err);
		res.send(301);
	})
})

app.post('/users/:id/password', cors(), headers, (req, res) => {
	const userId = req.params.id;
	const password = req.query.password;
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

app.get('/rooms/:roomId/messages', cors(), headers, (req, res) => {
	const roomId = req.params.roomId;

	RoomModel.findOne({'_id': roomId}, (err, room) => {
		res.json({'messages': room.messages});
	}).catch((err) => {
		console.log(err);
		res.send(301);
	})
})


function sendInvite(user, room) {
	var transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: "chatappepi2022@gmail.com",
			pass: "wololo2022420"
		}
	});

	var mailOptions = {
		from: "chatappepi2022@gmail.com",
		to: user.email,
		subject: 'Invitation pour rejoindre une room',
		text: `Cliquez sur le lien pour activer rejoindre la room ${room.surname}:\nhttp://localhost:8080/rooms/${room._id}/invited?invitedId=${user._id}`,
		html: `
			<div style="text-align:center; background-color:#4d4d4d; padding-bottom:30px; color:#ffffff;margin-top: -4px;height: 123px;width: 816px;margin-left: 2px;border-top-width: 2px;border-top-style: solid; border-color: black">
				${user.username}, bienvenue chez Vchat!
				<br/>
				<br/>
				Afin de  rejoindre la room ${room.surname}, cliquez sur le bouton "Activer", ou utilisez ce lien:
				<a href="http://localhost:8080/rooms/${room._id}/invited?invitedId=${user._id}" style="color: #a4a4a4">
					http://localhost:8080/rooms/${room._id}/invited?invitedId=${user._id}
				</a>
				<br/>
				<br/>
				<br/>
				<br/>
				<a href="http://localhost:8080/rooms/${room._id}/invited?invitedId=${user._id}" style="background-color: #38d39f; padding: 10px 15px; border: 2px; border-color: #ffffff; border-style: solid; color: #4d4d4d; font-size: 22px; text-decoration: none">
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

app.get('/rooms/:roomId/invites', cors(), headers, (req, res) => {
	const roomId = req.params.roomId;
	const invId = req.query.userId;

	RoomModel.findOne({'_id': roomId}, (err, room) => {
		juserModel.findOne({'_id': invId}, (err, user) => {
			sendInvite(user, room);
			res.json({ 'text': `Invitation sent` });
			});
		}).catch((err) => {
			console.log(err);
			res.send(301);
		})
		.catch((err) => {
			console.log(err);
			res.send(301);
	})
})


app.get('/rooms/:roomId/invited', cors(), headers, (req, res) => {
	const roomId = req.params.roomId;
	const invId = req.query.invitedId

	RoomModel.findOne({'_id': roomId}, (err, room) => {
		room.invited.push(invId);
		room.save().then((room) => {
			juserModel.findOne({'_id': invId}, (err, user) => {
				user.rooms.push({surname: room.surname, id: room._id});
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
	}).catch((err) => {
		console.log(err);
		res.send(301);
	})
})

app.get('/rooms/create', cors(), headers, (req, res) => {

	const userId = req.query.userId;
	const surname = req.query.surname;

	juserModel.findOne({'_id': userId}, (err, user) => {
		var create = new RoomModel({
			surname: surname,
			owner: userId,
			invited: [],
			messages:  [{
		            date: new Date,
		            content: `Room created by ${user.username}.`,
		            sender: "System",
		            readby: []
		        }]
		});
		create.save().then((room) => {
			user.rooms.push({surname: room.surname, id: room._id});
			user.save()
			.then(() => {
				res.send(room._id)
			})
			.catch((err) => {
				res.send(301)
			});

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

app.get('/clients', cors(), headers, (req, res) => {
	res.send(String(io.sockets.sockets.size));
})

app.get('/rooms/:userId', cors(), headers, (req, res) => {
	const userId = req.params.userId;

	juserModel.findOne({'_id': userId}, (err, user) => {
		if (!user) {
			res.send(404);
		} else {
			res.send({rooms: user.rooms});
		}
	})
})

http.listen(8080, () => {
	console.log('listening on *:8080');
});
