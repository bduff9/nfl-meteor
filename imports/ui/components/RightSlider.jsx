/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';

import './RightSlider.scss';
import { Messages } from './Messages.jsx';
import { Rules } from './Rules.jsx';
import ScoreBoard from './ScoreBoard.jsx';
import Chat from './Chat.jsx';

export const RightSlider = ({ type }) => {

  const _getSliderContent = () => {
    switch(type) {
    case 'messages':
      return <Messages />;
    case 'rules':
      return <Rules />;
    case 'scoreboard':
      return <ScoreBoard />;
    case 'chat':
      return <Chat />;
    default:
      console.error('Invalid slider type chosen', type);
      return null;
    }
  };

  return (
    <div className="col-sm-3 col-md-2 right-slider">
      {_getSliderContent()}
    </div>
  );
};

RightSlider.propTypes = {
  type: PropTypes.string.isRequired
};
