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


class Auth extends Component {
    constructor(props) {
        super(props);

    }

    discordAuth() {
        this.props.discordAuth(true);
    }

    intraAuth() {
        this.props.intraAuth(true);
    }

    render() {
        return(
            <div class="auth">
                <h3>Authentication to Services:</h3>
                <DiscordAuthWidget discordAuth={this.discordAuth.bind(this)}/>
                <IntraAuthWidget intraAuth={this.intraAuth.bind(this)}/>
            </div>
        )
    }
}

class AddWidget extends Component {
    constructor(props) {
        super(props);
        this.state = {selectValue: "/weather"};

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({selectValue: event.target.value})
    }

    handleSubmit(event) {
        this.props.addChild(this.state.selectValue);
        event.preventDefault();
    }

    render() {
        return(
            <div class="widgetList">
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Add widget:
                        <select value={this.state.selectValue} onChange={this.handleChange}>
                            <option value="/weather">Weather</option>
                            <option value="/rss/feed">RSS Feed</option>
                            {
                                this.props.authed.discord ? <option value="/discord/channel">Discord Channel</option> : ''
                            }
                            {
                                this.props.authed.discord ? <option value="/discord/status">Discord Status</option> : ''
                            }
                            {
                                this.props.authed.intra ? <option value="/intra/planning">Intra Planning</option> : ''
                            }
                            {
                                this.props.authed.intra ? <option value="/intra/project">Intra Project</option> : ''
                            }
                            <option value="/joke">Jokes</option>
                            <option value="/exchange">Exchange</option>
                            <option value="/fflogs/parses"> FFlogs Parses</option>
                        </select>
                    </label>
                    <input type="submit" value="Create" />
                </form>
            </div>
        )
    }
}

class WeatherWidget extends Component {
    constructor(props) {
        super(props);

        this.state = {
            weather: "",
            value: "",
            current: "",
            interval: null
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.repeat = this.repeat.bind(this);
        this.rmComp = this.rmComp.bind(this);

        fetch("http://localhost:8081/weather")
        .then(response => response.text())
        .then(data => {
            this.setState({weather: data});
            this.setState({current: this.state.value});
            this.setState({interval: setInterval(this.repeat, 10000)});
        })
        .catch(err => {
            console.log(err);
        });
    }

    repeat() {
        fetch(`http://localhost:8081/weather?city=${this.state.current}`)
        .then(response => response.text())
        .then(data => {
            this.setState({weather: data});
        })
        .catch(err => {
            console.log(err);
        });
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleSubmit(event) {
        fetch(`http://localhost:8081/weather?city=${this.state.value}`)
        .then(response => response.text())
        .then(data => {
            this.setState({weather: data});
            this.setState({current: this.state.value})
        })
        .catch(err => {
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
        return(
            <div class="WeatherWidget">
            <form class="deletButton" onSubmit={this.rmComp}>
                <input type="submit" value="Remove Widget" />
            </form>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Météo ville:
                            <input value={this.state.value} type="text" onChange={this.handleChange} />
                    </label>
                    <input type="submit" value="Submit" />
                </form>
                {this.state.weather}
            </div>
        )
    }
}

class RSSFeedWidget extends Component {
    constructor(props) {
        super(props);

        this.state = {
            posts: "No posts",
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
        fetch(`http://localhost:8081/rss/feed?url=${this.state.current}`)
        .then(response => response.text())
        .then(data => {
            this.setState({posts: data});
        })
        .catch(err => {
            this.setState({posts: "No posts"})
            console.log(err);
        });
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleSubmit(event) {
        fetch(`http://localhost:8081/rss/feed?url=${this.state.value}`)
        .then(response => response.text())
        .then(data => {
            this.setState({posts: data});
            this.setState({current: this.state.value});
            if (!this.state.interval)
                this.setState({interval: setInterval(this.repeat, 10000)});
        })
        .catch(err => {
            this.setState({posts: "No posts"})
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
        var disp = this.state.posts;
        if (this.state.posts != "No posts") {
            disp = this.state.posts.split('\n\n\n').map((line, i) => <p key={i}>{line}</p>);
        }
        return(
            <div class="RSSFeedWidget">
            <form class="deletButton" onSubmit={this.rmComp}>
                <input type="submit" value="Remove Widget" />
            </form>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        RSS Feed:
                            <input value={this.state.value} type="text" onChange={this.handleChange} />
                    </label>
                    <input type="submit" value="Subscribe" />
                </form>
                {disp}
            </div>
        )
    }
}

class DiscordAuthWidget extends Component {
    constructor(props) {
        super(props);

        this.state = {
            logged: "Not logged in",
            value: ""
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleSubmit(event) {
        fetch(`http://localhost:8081/discord/auth?token=${this.state.value}&username=${Gusername}`, {
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        })
        .then(response => response.text())
        .then(data => {
            this.setState({logged: data});
            this.setState({value: ""});
            this.props.discordAuth();
        })
        .catch(err => {
            console.log(err);
        });
        event.preventDefault();
    }

    render() {
        return(
            <div class="DiscordAuthWidget">
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Discord Auth Token:
                            <input value={this.state.value} type="text" onChange={this.handleChange} />
                    </label>
                    <input type="submit" value="Log in" />
                </form>
                {this.state.logged}
            </div>
        )
    }
}

class DiscordChannelWidget extends Component {
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

class DiscordStatusWidget extends Component {
    constructor(props) {
        super(props);

        this.state = {
            status: "Friend not found",
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
        fetch(`http://localhost:8081/discord/status?friend=${this.state.current}&username=${Gusername}`, {
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        })
        .then(response => response.text())
        .then(data => {
            this.setState({status: data});
        })
        .catch(err => {
            this.setState({status: "Friend not found"});
            console.log(err);
        });
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleSubmit(event) {
        fetch(`http://localhost:8081/discord/status?friend=${this.state.value}&username=${Gusername}`, {
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        })
        .then(response => response.text())
        .then(data => {
            this.setState({status: data});
            this.setState({current: this.state.value});
            if (!this.state.interval)
                this.setState({interval: setInterval(this.repeat, 10000)})
        })
        .catch(err => {
            this.setState({status: "Friend not found"});
            console.log(err);
        });
        event.preventDefault();
    }

    rmComp(event) {
        clearInterval(this.state.interval);
        this.setState({interval: null});
        this.props.handleRm(event)
    }

    render() {
        return(
            <div class="DiscordStatusWidget">
            <form class="deletButton" onSubmit={this.rmComp}>
                <input type="submit" value="Remove Widget" />
            </form>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Discord Friend ID:
                            <input value={this.state.value} type="text" onChange={this.handleChange} />
                    </label>
                    <input type="submit" value="Fetch status" />
                </form>
                {this.state.status}
            </div>
        )
    }
}


class IntraAuthWidget extends Component {
    constructor(props) {
        super(props);

        this.state = {
            logged: "Not logged in",
            loginValue: "example.name@epitech.eu",
            tokenValue: "auth-xxxx"
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleLoginChange = this.handleLoginChange.bind(this);
        this.handleTokenChange = this.handleTokenChange.bind(this);
    }

    handleLoginChange(event) {
        this.setState({loginValue: event.target.value});
    }
    handleTokenChange(event) {
        this.setState({tokenValue: event.target.value});
    }

    handleSubmit(event) {
        fetch(`http://localhost:8081/intra/auth?token=${this.state.tokenValue}&login=${this.state.loginValue}&username=${Gusername}`, {
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        })
        .then(response => response.text())
        .then(data => {
            this.setState({logged: data});
            this.props.intraAuth();
        })
        .catch(err => {
            console.log(err);
        });
        event.preventDefault();
    }

    render() {
        return(
            <div class="IntraAuthWidget">
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Intra credentials:
                            <input value={this.state.loginValue} type="text" onChange={this.handleLoginChange} />
                            <input value={this.state.tokenValue} type="text" onChange={this.handleTokenChange} />
                    </label>
                    <input type="submit" value="Log in" />
                </form>
                {this.state.logged}
            </div>
        )
    }
}

class IntraPlanningWidget extends Component {
    constructor(props) {
        super(props);

        this.state = {
            planning: "",
            year: "2020",
            month: "6",
            day: "21"
        }

        this.handleYearChange = this.handleYearChange.bind(this);
        this.handleMonthChange = this.handleMonthChange.bind(this);
        this.handleDayChange = this.handleDayChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleYearChange(event) {
        this.setState({year: event.target.value});
    }

    handleMonthChange(event) {
        this.setState({month: event.target.value});
    }

    handleDayChange(event) {
        this.setState({day: event.target.value});
    }

    handleSubmit(event) {
        fetch(`http://localhost:8081/intra/planning?year=${this.state.year}&month=${this.state.month}&day=${this.state.day}&username=${Gusername}`, {
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        })
        .then(response => response.text())
        .then(data => {
            this.setState({planning: data});
        })
        .catch(err => {
            this.setState({planning: "No planning"});
            console.log(err);
        });
        event.preventDefault();
    }

    render() {
        var disp = this.state.planning;
        if (this.state.planning != "No planning") {
            disp = this.state.planning.split('\n').map((line, i) => <p key={i}>{line}</p>);
        }
        return(
            <div class="IntraPlanningWidget">
            <form class="deletButton" onSubmit={this.props.handleRm}>
                <input type="submit" value="Remove Widget" />
            </form>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Date:
                        <input value={this.state.year} type="text" onChange={this.handleYearChange} />
                        <input value={this.state.month} type="text" onChange={this.handleMonthChange} />
                        <input value={this.state.day} type="text" onChange={this.handleDayChange} />
                    </label>
                    <input type="submit" value="Find Activities" />
                </form>
                {disp}
            </div>
        )
    }
}

class IntraProjectWidget extends Component {
    constructor(props) {
        super(props);

        this.state = {
            project: "Project not found",
            year: "2019",
            mod: "B-DEV-500",
            instance: "MPL-5-1",
            acti: "acti-357403"
        }

        this.handleYearChange = this.handleYearChange.bind(this);
        this.handleModChange = this.handleModChange.bind(this);
        this.handleInstanceChange = this.handleInstanceChange.bind(this);
        this.handleActiChange = this.handleActiChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleYearChange(event) {
        this.setState({year: event.target.value});
    }

    handleModChange(event) {
        this.setState({mod: event.target.value});
    }

    handleInstanceChange(event) {
        this.setState({instance: event.target.value});
    }

    handleActiChange(event) {
        this.setState({acti: event.target.value});
    }

    handleSubmit(event) {
        fetch(`http://localhost:8081/intra/project?year=${this.state.year}&mod=${this.state.mod}&instance=${this.state.instance}&acti=${this.state.acti}&username=${Gusername}`, {
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        })
        .then(response => response.text())
        .then(data => {
            this.setState({project: data});
        })
        .catch(err => {
            this.setState({project: "Project not found"});
            console.log(err);
        });
        event.preventDefault();
    }

    render() {
        var disp = this.state.project;
        if (this.state.project != "Project not found") {
            disp = this.state.project.split('\n').map((line, i) => <p key={i}>{line}</p>);
        }
        return(
            <div class="IntraProjectWidget">
            <form class="deletButton" onSubmit={this.props.handleRm}>
                <input type="submit" value="Remove Widget" />
            </form>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Project:
                            <input value={this.state.year} type="text" onChange={this.handleYearChange} />
                            <input value={this.state.mod} type="text" onChange={this.handleModChange} />
                            <input value={this.state.instance} type="text" onChange={this.handleInstanceChange} />
                            <input value={this.state.acti} type="text" onChange={this.handleActiChange} />
                    </label>
                    <input type="submit" value="Fetch project" />
                </form>
                {disp}
            </div>
        )
    }
}

class JokeWidget extends Component {
    constructor(props) {
        super(props);

        this.state = {
            category: "Any",
            blacklist: [
                {id: 0, value: "nsfw", isChecked: false},
                {id: 1, value: "religious", isChecked: false},
                {id: 2, value: "political", isChecked: false},
                {id: 3, value: "racist", isChecked: false},
                {id: 4, value: "sexist", isChecked: false}
            ],
            value: "",
            joke: ""
        }

        this.handleValueChange = this.handleValueChange.bind(this);
        this.handleCategoryChange = this.handleCategoryChange.bind(this);
        this.handleBlacklistChange = this.handleBlacklistChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleValueChange(event) {
        this.setState({value: event.target.value});
    }

    handleCategoryChange(event) {
        this.setState({category: event.target.value});
    }

    handleBlacklistChange(event) {
        let blackeds = this.state.blacklist

        blackeds.forEach(blacked => {
            console.log(blacked, event.target.value)
            if (blacked.value === event.target.value)
                blacked.isChecked = event.target.checked
        })
        this.setState({blacklist: blackeds})
    }

    handleSubmit(event) {
        var blacklistFlags = [];
        for (let flag of this.state.blacklist) {
            console.log(flag);
            if (flag.isChecked) {
                blacklistFlags.push(flag.value);
            }
        }
        console.log(blacklistFlags);
        blacklistFlags = blacklistFlags.join(',');
        fetch(`http://localhost:8081/joke?category=${this.state.category}&blacklist=${blacklistFlags}&keyword=${this.state.value}`, {
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        })
        .then(response => response.text())
        .then(data => {
            this.setState({joke: data});
        })
        .catch(err => {
            this.setState({joke: "No joke"});
            console.log(err);
        });
        event.preventDefault();
    }

    render() {
        return(
            <div class="JokeWidget">
            <form class="deletButton" onSubmit={this.props.handleRm}>
                <input type="submit" value="Remove Widget" />
            </form>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Keywords:
                        <input value={this.state.value} type="text" onChange={this.handleValueChange} />
                        <select value={this.state.category} onChange={this.handleCategoryChange}>
                            <option value="Any">Any</option>
                            <option value="Programming">Programming</option>
                            <option value="Miscellaneous">Miscellaneous</option>
                            <option value="Dark">Dark</option>
                        </select>
                        <br/>Blacklist:
                        {
                            this.state.blacklist.map((blacked) => {
                                return (
                                    <CheckBox handleBlacklistChange={this.handleBlacklistChange} isChecked={blacked.isChecked} value={blacked.value} key={blacked.id} />
                                )
                            })
                        }
                    </label>
                    <input type="submit" value="Get jokes" />
                </form>
                {this.state.joke}
            </div>
        )
    }
}

const CheckBox = props => {
    return (
        <div>
            <input key={props.id} onChange={props.handleBlacklistChange} type="checkbox" defaultChecked={props.isChecked} value={props.value} />
            {props.value}
        </div>
    )
}

class ExchangeWidget extends Component {
    constructor(props) {
        super(props);

        this.state = {
            rate: "",
            currency1: "EUR",
            currency2: "USD",
            current1: "EUR",
            current2: "USD",
            interval: null
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleCurrency1Change = this.handleCurrency1Change.bind(this);
        this.handleCurrency2Change = this.handleCurrency2Change.bind(this);
        this.repeat = this.repeat.bind(this);
        this.rmComp = this.rmComp.bind(this);
        this.state.interval = setInterval(this.repeat, 10000);
        this.repeat();
    }

    repeat() {
        fetch(`http://localhost:8081/exchange?currency1=${this.state.current1}&currency2=${this.state.current2}`, {
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        })
        .then(response => response.text())
        .then(data => {
            this.setState({rate: data});
        })
        .catch(err => {
            console.log(err);
        });
    }

    handleCurrency1Change(event) {
        this.setState({currency1: event.target.value});
    }
    handleCurrency2Change(event) {
        this.setState({currency2: event.target.value});
    }

    handleSubmit(event) {
        fetch(`http://localhost:8081/exchange?currency1=${this.state.currency1}&currency2=${this.state.currency2}`, {
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        })
        .then(response => response.text())
        .then(data => {
            this.setState({rate: data});
            this.setState({current1: this.state.currency1});
            this.setState({current2: this.state.currency2});
        })
        .catch(err => {
            console.log(err);
        });
        event.preventDefault();
    }

    rmComp(event) {
        clearInterval(this.state.interval);
        this.setState({interval: null});
        this.props.handleRm(event)
    }

    render() {
        return(
            <div class="ExchangeWidget">
            <form class="deletButton" onSubmit={this.rmComp}>
                <input type="submit" value="Remove Widget" />
            </form>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Exchange Rates:
                            <input value={this.state.currency1} type="text" onChange={this.handleCurrency1Change} />
                            <input value={this.state.currency2} type="text" onChange={this.handleCurrency2Change} />
                    </label>
                    <input type="submit" value="Get rate" />
                </form>
                1 {this.state.current1} = {this.state.rate} {this.state.current2}
            </div>
        )
    }
}

class FFlogsParsesWidget extends Component {
    constructor(props) {
        super(props);

        this.state = {
            nameValue: "Lowell O'Chan",
            worldValue: "Louisoix",
            region: "EU",
            data: "",
            nameCurrent: "Lowell O'Chan",
            worldCurrent: "Louisoix",
            interval: null
        }

        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleWorldChange = this.handleWorldChange.bind(this);
        this.handleRegionChange = this.handleRegionChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.repeat = this.repeat.bind(this);
        this.rmComp = this.rmComp.bind(this);
        this.state.interval = setInterval(this.repeat, 10000);
    }

    repeat() {
        fetch(`http://localhost:8081/fflogs/parses?character=${this.state.nameCurrent}&world=${this.state.worldCurrent}&region=${this.state.region}`, {
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        })
        .then(response => response.json())
        .then(data => {
            this.setState({data: data});
        })
        .catch(err => {
            this.setState({data: "Parses not found"});
            console.log(err);
        });
    }

    handleNameChange(event) {
        this.setState({nameValue: event.target.value});
    }

    handleWorldChange(event) {
        this.setState({worldValue: event.target.value});
    }

    handleRegionChange(event) {
        this.setState({region: event.target.value});
    }

    handleSubmit(event) {
        fetch(`http://localhost:8081/fflogs/parses?character=${this.state.nameValue}&world=${this.state.worldValue}&region=${this.state.region}`, {
            headers: {
                'pragma': 'no-cache',
                'cache-control': 'no-cache'
            }
        })
        .then(response => response.json())
        .then(data => {
            this.setState({data: data});
            this.setState({nameCurrent: this.state.nameValue});
            this.setState({worldCurrent: this.state.worldValue});
        })
        .catch(err => {
            this.setState({data: "Parses not found"});
            console.log(err);
        });
        event.preventDefault();
    }

    rmComp(event) {
        clearInterval(this.state.interval);
        this.setState({interval: null});
        this.props.handleRm(event)
    }

    render() {
        var parses = [];
        for (let parse of this.state.data) {
            if (!parse) continue;
            parses.push(parse);
        }
        return(
            <div class="FFlogsParsesWidget">
            <form class="deletButton" onSubmit={this.rmComp}>
                <input type="submit" value="Remove Widget" />
            </form>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Parses:
                            <input value={this.state.nameValue} type="text" onChange={this.handleNameChange} />
                            <input value={this.state.worldValue} type="text" onChange={this.handleWorldChange} />
                            <select value={this.state.region} onChange={this.handleRegionChange}>
                                <option value="EU">EU</option>
                                <option value="NA">NA</option>
                                <option value="JP">JP</option>
                            </select>
                    </label>
                    <input type="submit" value="Fetch parses" />
                </form>
                {parses.map((parse) => {
                    return(
                        <div>
                            {parse.encounterName}: {Math.floor(parse.percentile)}%
                        </div>
                    )
                })}
            </div>
        )
    }
}

class Widget extends Component {
    constructor(props) {
        super(props);

        this.handleRm = this.handleRm.bind(this);
        console.log(props);
    }

    handleRm(event) {
        console.log(this.props);
        this.props.rmChild(this.props.id);
        event.preventDefault();
    }

    render() {
        switch (this.props.route) {
            case "/weather":
                return(
                        <WeatherWidget handleRm={this.handleRm} {...this.props}/>
                )
            case "/rss/feed":
                return(
                        <RSSFeedWidget handleRm={this.handleRm} {...this.props}/>
                )
            case "/discord/channel":
                return(
                        <DiscordChannelWidget handleRm={this.handleRm} {...this.props}/>
                )
            case "/discord/status":
                return(
                        <DiscordStatusWidget handleRm={this.handleRm} {...this.props}/>
                )
            case "/intra/planning":
                return(
                        <IntraPlanningWidget handleRm={this.handleRm} {...this.props}/>
                )
            case "/intra/project":
                return(
                        <IntraProjectWidget handleRm={this.handleRm} {...this.props}/>
                )
            case "/joke":
                return(
                        <JokeWidget handleRm={this.handleRm} {...this.props}/>
                )
            case "/exchange":
                return(
                        <ExchangeWidget handleRm={this.handleRm} {...this.props}/>
                )
            case "/fflogs/parses":
                return(
                        <FFlogsParsesWidget handleRm={this.handleRm} {...this.props}/>
                )
        }
    }
}

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            authed: {
                discord: false,
                intra: false
            },
            widgetList: [],
            currentID: 1
        };
    }

    login(username, password, callback) {
        fetch(`http://localhost:8081/login?username=${username}&password=${password}`)
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
            this.setState({authed: {discord: data.discord, intra: data.intra}})
            callback(data.text);
        });
    }

    register(username, password, callback) {
        fetch(`http://localhost:8081/register?username=${username}&password=${password}`)
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
            this.setState({authed: {finished: false, discord: false, intra: false}})
            callback(data);
        });
    }

    discordAuth(discord) {
        this.setState({authed: {discord: discord, intra: this.state.authed.intra}});
    }

    intraAuth(intra) {
        this.setState({authed: {discord: this.state.authed.discord, intra: intra}});
    }

    addChild(type) {
        this.setState({widgetList: this.state.widgetList.concat([
            {
                key: this.state.currentID,
                widget: <Widget key={this.state.currentID} id={this.state.currentID} route={type} rmChild={this.rmChild.bind(this)}/>
            }
        ])});
        this.setState({currentID: this.state.currentID + 1})
    }

    rmChild(id) {
        console.log("aled");
        let newList = this.state.widgetList;
        console.log(newList);
        for (let widget of newList)
            if (widget.key == id)
                newList.splice(newList.indexOf(widget), 1);
        this.setState({widgetList: newList});
        console.log(newList);
    }

    render() {
        let widgetList = this.state.widgetList;
        return (
            <Router>
                <div className="App">
                    <nav>
                        <ul>
                            <li>
                                <Link to="/about.json">About.json</Link>
                            </li>
                            <li>
                                <Link to="/">Dashboard</Link>
                            </li>
                            <li>
                                <Link to="/login">{this.state.username ? this.state.username : "LogIn"}</Link>
                            </li>
                            <li>
                                <Link to="/register">Register</Link>
                            </li>
                            <li>
                                <Link to="/services">Services</Link>
                            </li>
                        </ul>
                    </nav>
                        <Switch>
                            <Route path="/services">
                                <header className="App-header">
                                    {Gusername ? <Auth discordAuth={this.discordAuth.bind(this)} intraAuth={this.intraAuth.bind(this)}/> : <h2 class="noAuth">Invalid Dashboard user. Please Log in or Register</h2>}
                                </header>
                            </Route>
                            <Route exact path="/">
                                <header className="App-header">
                                    <AddWidget addChild={this.addChild.bind(this)}  authed={this.state.authed}/>
                                    {widgetList.map(widget => widget.widget)}
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
                            <Route path='/about.json' component={() => {
                                window.location.href = 'http://localhost:8080/about.json';
                                return null;
                            }}/>
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


class About extends Component {

    constructor(props) {
        super(props);
        this.state = {
            about: {}
        }

        this.props.history.push("http://localhost:8081/about.json");

    //     fetch("http://localhost:8081/about.json")
    //     .then(response => response.json())
    //     .then(data => {
    //         fetch("https://api.ipify.org?format=json", {headers: {'Origin': "http://localhost:3000"}})
    //         .then(response => response.json())
    //         .then(ip => {
    //             let about = data;
    //             about.client.host = ip;
    //             this.setState({about: about});
    //         })
    //         .catch(err => {
    //             console.log(err);
    //         })
    //     })
    //     .catch(err => {
    //         console.log(err);
    //     });
    // }
    //
    // render() {
    //     return(
    //         <pre class="aboutJson">
    //             {JSON.stringify(this.state.about, null, "\t")}
    //         </pre>
    //     );
    }
}

export default App;
