import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import pie from './pie-chart.json';

ChartJS.register(ArcElement, Tooltip, Legend);

const BarComponent = () => {
  const data = pie;
  return <Doughnut data={data} />;
};

export default BarComponent;
