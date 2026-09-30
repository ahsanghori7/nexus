import React from 'react';
import {
  MuiChartsContainer,
  MuiChartsList,
} from 'v2/apps/admin/pages/prosper/dashboard/charts/Mui.styled';
import { Chart } from 'clink-components';
import bar from './barstack.json';

const footer = (tooltipItems) => {
  let sum = 0;
  tooltipItems.forEach((tooltipItem) => {
    sum += tooltipItem.parsed.y;
  });
  return `Subscriptions: ${sum}`;
};

const options = {
  plugins: {
    title: {
      display: true,
      text: 'Subscriptions',
    },
    tooltip: {
      callbacks: {
        footer,
      },
    },
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
  responsive: true,
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
    },
  },
};

const BarStackedComponent = ({ data = bar }) => {
  return (
    <MuiChartsContainer>
      <MuiChartsList>
        <Chart type="barstack" data={data} options={options} />
      </MuiChartsList>
    </MuiChartsContainer>
  );
};

export default BarStackedComponent;
