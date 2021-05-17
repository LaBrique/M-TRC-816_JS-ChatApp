import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import fetch from 'node-fetch';
import {
	BrowserRouter as Router,
	Switch,
	Route,
	Link
} from "react-router-dom";
import { socket } from "./ws.js";
import { Alert } from 'react-bootstrap'


const ENDPOINT = "http://localhost:8080";
var Gusername = "";
var Gid = "";



class ChatRoom extends Component {
	constructor(props) {
		super(props);

		this.state = {
			messages: [{
				date: new Date,
				content: "Welcome!",
				sender: "System",
				readby: [Gusername]
			}],
			value: "",
			roomId: this.props.roomId
		}

		this.handleChangeMessage = this.handleChangeMessage.bind(this);
		this.handleSubmitMessage = this.handleSubmitMessage.bind(this);
		this.fetchMessages = this.fetchMessages.bind(this);
		this.fetchMessages();
	}

	componentDidMount() {
		socket.on('chat message', (msg) => {
			setTimeout(this.fetchMessages, 500);
		});
	}

	componentWillUnmount() {
		socket.off('chat message');
	}

	componentDidUpdate(prevProps) {
		if(prevProps.roomId !== this.props.roomId) {
			this.setState({roomId: this.props.roomId}, () => {
				this.fetchMessages();
			});
		}
	}

	fetchMessages() {
		console.log("room:", this.state.roomId)
		if (!this.state.roomId) {return};
		fetch(`http://localhost:8080/rooms/${this.state.roomId}/messages`, {
			headers: {
				'pragma': 'no-cache',
				'cache-control': 'no-cache'
			}
		})
		.then(response => response.json())
		.then(data => {
			this.setState({messages: data.messages})
		})
		.catch(err => {
			this.setState({messages: [{
				date: new Date,
				content: "Error",
				sender: "System",
				readby: [Gusername]
			}]});
			console.log(err);
		});
	}

	handleChangeMessage(event) {
		this.setState({value: event.target.value});
	}

	handleSubmitMessage(event) {
		const message = {
			room: this.state.roomId,
			sender: Gid,
			senderName: Gusername,
			msg: this.state.value
		};
		this.setState({value: ""});
		socket.emit('chat message', message);
		event.preventDefault();
	}

	render() {
		return(
			<div class="chatRoom">
				<ul id="messages">
					{
						this.state.messages.map((msg, i) => {
							return(
								<li key={i}>
									<span class="sender">{msg.sender}:<br/></span>
									{msg.content}
									<br/>
									<br/>
								</li>
							)
						})
					}
				</ul>
				<form id="form1" onSubmit={this.handleSubmitMessage}>
					<input id="input1" value={this.state.value} type="text" onChange={this.handleChangeMessage} />
					<input id="sendButton" type="submit" value="Send" />
				</form>
			</div>
		)
	}
}

class RoomInvite extends Component {
	constructor(props) {
		super(props);
		this.state = {
			rooms: [],
			users: [],
			output: "",
			selectedUser: "",
			selectedRoom: ""
		}

		this.fetchRooms = this.fetchRooms.bind(this);
		this.fetchUsers = this.fetchUsers.bind(this);
		this.sendInvite = this.sendInvite.bind(this);
		this.changeOutput = this.changeOutput.bind(this);
		this.handleUserChange = this.handleUserChange.bind(this);
		this.handleRoomChange = this.handleRoomChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.fetchRooms();
		this.fetchUsers();
	}

	handleUserChange(event) {
		this.setState({userValue: event.target.value});
	}

	handleRoomChange(event) {
		this.setState({roomValue: event.target.value});
	}

	handleSubmit(event) {
		this.sendInvite(this.state.userValue, this.state.roomValue, this.changeOutput.bind(this));
		event.preventDefault();
	}

	changeOutput(output) {
		this.setState({output: output});
	}

	fetchUsers() {
		fetch(`http://localhost:8080/users`, {
			headers: {
				'pragma': 'no-cache',
				'cache-control': 'no-cache'
			}
		})
		.then(response => response.json())
		.then(data => {
			console.log(data.users);
			this.setState({users: data.users})
		});
	}

	fetchRooms() {
		fetch(`http://localhost:8080/rooms`, {
			headers: {
				'pragma': 'no-cache',
				'cache-control': 'no-cache'
			}
		})
		.then(response => response.json())
		.then(data => {
			console.log(data.rooms);
			this.setState({rooms: data.rooms})
		});
	}

	sendInvite(userId, roomId, callback) {
		fetch(`http://localhost:8080/rooms/${roomId}/invites?userId=${userId}`, {
			headers: {
				'pragma': 'no-cache',
				'cache-control': 'no-cache'
			}
		})
		.then(response => response.json())
		.then(data => {
			callback(data.text)
		});
	}

	render() {
		return (
			<div className="flex-container flex-row">
				<form onSubmit={this.handleSubmit}>
					<h2>Invite</h2>
					<div className="flex-child" onChange={this.handleRoomChange}>
						Room:
						{
							this.state.rooms.map((room, i) => {
								if (room.owner == Gid) {
									console.log("oui:", room.surname)
									return(
										<div key={i}>
											<input value={room._id} type="radio" name="room" />{room.surname}
										</div>
									)
								}
							})
						}
						<br/>
					</div>
					<div className="flex-child" onChange={this.handleUserChange}>
						User:
						{
							this.state.users.map((user, i) => {
								if (user._id != Gid) {
									return(
										<div key={i}>
											<input value={user._id} type="radio" name="user" />{user.username}
										</div>
									)
								}
							})
						}
						<br/>
					</div>
					<input type="submit" value="Invite" />
				</form>
			<span>
				<ul>

				</ul>

				<ul>

				</ul>
				</span>
			</div>
		)
	}

}

class RoomList extends Component {
	constructor(props) {
		super(props);

		this.state = {
			rooms: []
		};

		this.fetchRooms = this.fetchRooms.bind(this);
		this.fetchRooms();
	}

	fetchRooms() {
		fetch(`http://localhost:8080/rooms/${Gid}`, {
			headers: {
				'pragma': 'no-cache',
				'cache-control': 'no-cache'
			}
		})
		.then(response => response.json())
		.then(data => {
			console.log(data.rooms);
			this.setState({rooms: data.rooms})
		});
	}

	render() {
		return(
			<div class="roomList">
				Room List:
				<ul id="rooms">
					{
						this.state.rooms.map((room, i) => {
							return(
								<li key={i} style={{color: room.id == this.props.roomId ? "red" : "white"}} onClick={this.props.joinRoom.bind(this, room.id)}>{room.surname}<br/></li>
							)
						})
					}
				</ul>
			</div>
		)
	}
}

class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			username: "",
			roomId: ""
		};
	}

	login(username, password, callback) {
		fetch(`http://localhost:8080/login?username=${username}&password=${password}`)
		.then(response => {
			if (response.status == 403) {
				Gusername = "";
				Gid = "";
				response.json().then(data => callback(data.text));
			}
			else {
				response.json().then(data => {
					Gusername = username;
					Gid = data.id;
					this.setState({username: username});
					callback(data.text);
				})
			}
		})
	}

	register(email, username, password, callback) {
		fetch(`http://localhost:8080/register?email=${email}&username=${username}&password=${password}`)
		.then(response => {
			if (response.status == 403) {
				Gusername = "";
				Gid = "";
				response.json().then(data => callback(data.text));
			}
			else {
				response.json().then(data => {
					Gusername = username;
					Gid = data.id;
					this.setState({username: username});
					callback(data.text);
				})
			}
		})
	}

	createRoom(surname, callback) {
		fetch(`http://localhost:8080/rooms/create?surname=${surname}&userId=${Gid}`)
		.then(response => {
			if (response.status == 403) {
				response.json().then(data => callback(data.text));
			} else {
				response.json().then(data => {
					this.setState({roomId: data._id});
					callback(data.text);
				})
			}
		})
	}

	joinRoom(roomId) {
		const message = {
			room: roomId
		};
		this.setState({roomId: roomId});
		socket.emit('join room', message);
	}

	render() {
		let widgetList = this.state.widgetList;
		return (
			<Router>
				<div className="App">
					<nav>
						<ul>
							<li>
								<Link to="/">Chat</Link>
							</li>
							<li>
								<Link to="/create">CreateRoom</Link>
							</li>
							<li>
								<Link to="/invite">RoomInvite</Link>
							</li>
							<li>
								<Link to="/login">{this.state.username ? this.state.username : "LogIn"}</Link>
							</li>
							<li>
								<Link to="/register">Register</Link>
							</li>
						</ul>
					</nav>
						<Switch>
							<Route exact path="/">
								<header className="App-header">
								<div class="flex-container">
									<div class="flex-child roomListBox">
										<RoomList roomId={this.state.roomId} joinRoom={this.joinRoom.bind(this)}/>
									</div>
									<div class="flex-child chatRoomBox">
										<ChatRoom roomId={this.state.roomId}/>
									</div>
								</div>
								</header>
							</Route>
							<Route path="/create">
								<header className="App-header">
									<CreateRoom createRoom={this.createRoom.bind(this)}/>
								</header>
							</Route>
							<Route path="/invite">
								<header className="App-header">
									<RoomInvite />
								</header>
							</Route>
							<Route path="/login">
								<header className="App-header">
									<Login login={this.login.bind(this)} />
								</header>
							</Route>
							<Route path="/register">
								<header className="App-header">
									<Register register={this.register.bind(this)} />
								</header>
							</Route>
						</Switch>
				</div>
			</Router>
		);
	}
}

class Login extends Component {
	constructor(props) {
		super(props);
		this.state = {
			userValue: "",
			passValue: "",
			output: ""
		}

		this.handleUserChange = this.handleUserChange.bind(this);
		this.handlePassChange = this.handlePassChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleUserChange(event) {
		this.setState({userValue: event.target.value});
	}

	handlePassChange(event) {
		this.setState({passValue: event.target.value});
	}

	handleSubmit(event) {
		this.props.login(this.state.userValue, this.state.passValue, this.changeOutput.bind(this));
		event.preventDefault();
	}

	changeOutput(output) {
		this.setState({output: output});
	}

	render() {
		return(
			<div class="login">
				<form onSubmit={this.handleSubmit}>
					<h2>Login</h2>
					<br/>
					Username:
					<input class="creds" value={this.state.userValue} type="text" onChange={this.handleUserChange} />
					<br/>
					Password:
					<input class="creds" value={this.state.passValue} type="text" onChange={this.handlePassChange} />
					<br/>
					{this.state.output}
					<br/>
					<input type="submit" value="Login" />
				</form>
			</div>
		)
	}
}

class CreateRoom extends Component {
	constructor(props) {
		super(props);
		this.state = {
			roomValue: "",
			output: ""
		}

		this.handleRoomChange = this.handleRoomChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleRoomChange(event) {
		this.setState({roomValue: event.target.value});
	}

	handleSubmit(event) {
		this.props.createRoom(this.state.roomValue, this.changeOutput.bind(this));
		event.preventDefault();
	}

	changeOutput(output) {
		this.setState({output: output});
	}

	render() {
		return(
			<div class="CreateRoom">
				<form onSubmit={this.handleSubmit}>
					<h2>Create a room</h2>
					<br/>
					Room Name:
					<input class="creds" value={this.state.roomValue} type="text" onChange={this.handleRoomChange} />
					<br/>
					{this.state.output}
					<br/>
					<input type="submit" value="Create" />
				</form>
			</div>
		)
	}
}

class Register extends Component {
	constructor(props) {
		super(props);
		this.state = {
			mailValue: "",
			userValue: "",
			passValue: "",
			output: ""
		}

		this.handleMailChange = this.handleMailChange.bind(this);
		this.handleUserChange = this.handleUserChange.bind(this);
		this.handlePassChange = this.handlePassChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleMailChange(event) {
		this.setState({mailValue: event.target.value});
	}

	handleUserChange(event) {
		this.setState({userValue: event.target.value});
	}

	handlePassChange(event) {
		this.setState({passValue: event.target.value});
	}

	handleSubmit(event) {
		this.props.register(this.state.mailValue, this.state.userValue, this.state.passValue, this.changeOutput.bind(this));
		event.preventDefault();
	}

	changeOutput(output) {
		this.setState({output: output});
	}

	render() {
		return(
			<div class="register">
				<form onSubmit={this.handleSubmit}>
					<h2>Register</h2>
					<br/>
					E-mail:
					<input class="creds" value={this.state.mailValue} type="text" onChange={this.handleMailChange} />
					<br/>
					Username:
					<input class="creds" value={this.state.userValue} type="text" onChange={this.handleUserChange} />
					<br/>
					Password:
					<input class="creds" value={this.state.passValue} type="text" onChange={this.handlePassChange} />
					<br/>
					{this.state.output}
					<br/>
					<input type="submit" value="Register" />
				</form>
			</div>
		)
	}
}

export default App;
