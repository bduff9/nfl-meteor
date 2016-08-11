'use strict';

import React, { PropTypes } from 'react';

import './RightSlider.scss';

export const RightSlider = ({ type }) => {
  return (
    <div className="right-slider">
      {type}
    </div>
  );
};

RightSlider.propTypes = {
  type: PropTypes.string.isRequired
};
