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
var Gusername = "";

class ChannelWidget extends Component {
    constructor(props) {
        super(props);

        this.state = {
            messages: "No messages",
            value: "",
            current: "",
            interval: null
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.repeat = this.repeat.bind(this);
        this.rmComp = this.rmComp.bind(this);
    }

    repeat() {
        fetch(`http://localhost:8081/discord/channel?channel=${this.state.current}&username=${Gusername}`, {
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        })
        .then(response => response.text())
        .then(data => {
            this.setState({messages: data});
        })
        .catch(err => {
            this.setState({messages: "No messages"});
            console.log(err);
        });
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleSubmit(event) {
        fetch(`http://localhost:8081/discord/channel?channel=${this.state.value}&username=${Gusername}`, {
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        })
        .then(response => response.text())
        .then(data => {
            this.setState({messages: data});
            this.setState({current: this.state.value});
            if (!this.state.interval)
                this.setState({interval: setInterval(this.repeat, 10000)})
        })
        .catch(err => {
            this.setState({messages: "No messages"});
            console.log(err);
        });
        event.preventDefault();
    }

    rmComp(event) {
        clearInterval(this.state.interval);
        this.setState({interval: null});
        this.props.handleRm(event);
    }

    render() {
        var disp = this.state.messages;
        if (this.state.messages != "No messages") {
            disp = this.state.messages.split('\n').map((line, i) => <p key={i}>{line}</p>);
        }
        return(
            <div class="DiscordChannelWidget">
            <form class="deletButton" onSubmit={this.rmComp}>
                <input type="submit" value="Remove Widget" />
            </form>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Discord Channel ID:
                            <input value={this.state.value} type="text" onChange={this.handleChange} />
                    </label>
                    <input type="submit" value="Fetch messages" />
                </form>
                {disp}
            </div>
        )
    }
}

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: ""
        };
    }

    login(username, password, callback) {
        fetch(`http://localhost:8080/login?username=${username}&password=${password}`)
        .then(response => {
            if (response.status == 403)
                response.text().then(data => callback(data));
            else {
                return (response.json());
            }
        })
        .then(data => {
            Gusername = username;
            this.setState({username: username});
            callback(data.text);
        });
    }

    register(username, password, callback) {
        fetch(`http://localhost:8080/register?username=${username}&password=${password}`)
        .then(response => {
            if (response.status == 403)
                response.text().then(data => callback(data));
            else {
                return (response.text());
            }
        })
        .then(data => {
            Gusername = username;
            this.setState({username: username});
            callback(data);
        });
    }

    render() {
        let widgetList = this.state.widgetList;
        return (
            <Router>
                <div className="App">
                    <nav>
                        <ul>
                            <li>
                                <Link to="/">Home</Link>
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
                    <input type="submit" value="Register" />
                </form>
            </div>
        )
    }
}

class Register extends Component {
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
        this.props.register(this.state.userValue, this.state.passValue, this.changeOutput.bind(this));
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
