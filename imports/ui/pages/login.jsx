import React, { Component } from 'react';
import { Link } from 'react-router';

export default class Login extends Component {

  constructor(props) {
    super();
    this.state = {};
  }

  _handleSubmit(ev) {
    ev.preventDefault();
console.log('form submit');
  }

  render() {
    return (
      <form name="login" onSubmit={this._handleSubmit}>
        <input type="text" />
        <input type="password" />
        <Link to="/register">Register</Link>
        <button type="submit">Submit</button>
      </form>
    );
  }
}