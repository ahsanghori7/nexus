import React from 'react';
import { Chart } from 'clink-components';
import {
  MuiChartsContainer,
  MuiChartsList,
} from 'v2/apps/admin/pages/prosper/dashboard/charts/Mui.styled';
import pie from './pie-chart.json';

const options = {
  responsive: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Supply Chain Activation',
    },
  },
};

const DoughnutComponent = ({ data = pie }) => {
  return (
    <MuiChartsContainer>
      <MuiChartsList doughnut>
        <Chart type="doughnut" data={data} options={options} height={400} />
      </MuiChartsList>
    </MuiChartsContainer>
  );
};

export default DoughnutComponent;
