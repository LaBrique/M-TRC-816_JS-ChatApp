const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

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
		io.to(msg.room).emit('chat message', msg.msg);
	});
});

app.get('/clients', (req, res) => {
	res.send(String(io.sockets.sockets.size));
})

http.listen(3000, () => {
	console.log('listening on *:3000');
});
