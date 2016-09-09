/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

export class WhatIf extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      show: false,
      target: null
    };
    this._handleClick = this._handleClick.bind(this);
  }

  _handleClick(ev) {
    this.setState({ target: e.target, show: !this.state.show });
  }

  render() {
    const { show, target } = this.state;
    return (
      <ButtonToolbar>
        <Button className="btn btn-info what-if" onClick={this._handleClick}>
          <i className="fa fa-fw fa-question" />What If
        </Button>

        <Overlay
          show={show}
          target={target}
          placement="bottom"
          container={this}
          containerPadding={20}
        >
          <Popover id="whatIf" title="What If Analyzer">
            To see how your rank would change if a team wins,
            simply click on the team you want to see win.
            The rankings will update automatically once clicked.
          </Popover>
        </Overlay>
      </ButtonToolbar>
    );
  }
}
