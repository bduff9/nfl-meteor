/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

class WhatIf extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.handleClick = e => {
      this.setState({ target: e.target, show: !this.state.show });
    };

    this.state = { show: false };
  }

  render() {
    return (
      <ButtonToolbar>
        <Button className="btn btn-info what-if" onClick={this.handleClick}>
          <i className="fa fa-fw fa-question" />What If
        </Button>

        <Overlay
          show={this.state.show}
          target={this.state.target}
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
