import React from 'react';
import Progress from './Progress';
import Section from './Section';

const PMP = ({ activeStep }) => (
  <>
    <Progress activeStep={activeStep} />
    <Section activeStep={activeStep} />
  </>
);

export default PMP;
