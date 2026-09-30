import React from 'react';
import { Chart } from 'clink-components';
import {
  MuiChartsContainer,
  MuiChartsList,
} from 'v2/apps/admin/pages/prosper/dashboard/charts/Mui.styled';
import area from './area.json';

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: false,
      text: 'Tokens',
    },
  },
};

const AreaComponent = ({ data = area }) => {
  return (
    <MuiChartsContainer>
      <MuiChartsList>
        <Chart type="area" data={data} options={options} />
      </MuiChartsList>
    </MuiChartsContainer>
  );
};

export default AreaComponent;
