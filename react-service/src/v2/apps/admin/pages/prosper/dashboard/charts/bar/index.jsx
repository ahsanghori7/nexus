import React from 'react';
import {
  MuiChartsContainer,
  MuiChartsList,
} from 'v2/apps/admin/pages/prosper/dashboard/charts/Mui.styled';
import { Chart } from 'clink-components';
import bar from './bar.json';

const footer = (tooltipItems) => {
  let sum = 0;
  tooltipItems.forEach((tooltipItem) => {
    sum += tooltipItem.parsed.y;
  });
  return `Tokens: ${sum}`;
};

const options = {
  plugins: {
    title: {
      display: false,
      text: 'Tokens',
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
};

const BarComponent = ({ data = bar }) => {
  return (
    <MuiChartsContainer>
      <MuiChartsList>
        <Chart
          type="bar"
          data={data}
          options={{ maintainAspectRatio: false, responsive: true, ...options }}
          width={100}
          height={100}
        />
      </MuiChartsList>
    </MuiChartsContainer>
  );
};

export default BarComponent;
