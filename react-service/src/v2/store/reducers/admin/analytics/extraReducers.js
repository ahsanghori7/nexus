import random from 'lodash/random';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchData } from 'services/helpers';

const fetchTokens = createAsyncThunk('analytics/fetchTokens', async (query) =>
  fetchData('analytics', query, 'tokens').then((result) => result.data)
);

const fetchSupplyChainAnalytics = createAsyncThunk(
  'analytics/fetchSupplyChainAnalytics',
  async (query) =>
    fetchData('analytics', query, 'actions').then((result) => result.data)
);

const weekGraphs = ['issuedpaidweek', 'usedfreeweek'];
const dayGraphs = ['usedfreeday', 'issuedpaidday'];
export default {
  [fetchTokens.pending]: (state) => {
    state.status = 'loading';
  },
  [fetchTokens.fulfilled]: (state, { meta, payload }) => {
    let dataFormat = {
      labels: [],
      datasets: [],
    };
    const { arg } = meta;
    const { type, token_type, interval } = arg;
    const dataKey = `${type}${token_type}${interval}`;
    if (weekGraphs.includes(dataKey)) {
      const datasetOptions = {
        label: 'Total tokens',
        data: [],
        backgroundColor: `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(
          0,
          255
        )}, 0.5)`,
      };
      dataFormat.datasets.push(datasetOptions);
      if (payload) {
        Object.keys(payload).forEach((elemKey) => {
          const dateElems = elemKey.split('-');
          const label = `Week ${dateElems[1]}`;
          const week = `${label} (${dateElems[0]})`;
          dataFormat.labels.push(week);
          if (payload[elemKey]) {
            const dataPayload = payload[elemKey].total;
            dataFormat.datasets[0].data.push(
              (dataPayload && dataPayload.tokens) || 0
            );
          } else {
            dataFormat.datasets[0].data.push(0);
          }
        });
      }
    } else if (dayGraphs.includes(dataKey)) {
      const filtered = {};
      dataFormat = [];
      if (payload) {
        Object.keys(payload).forEach((elemKey) => {
          if (payload[elemKey]) {
            filtered[elemKey] = payload[elemKey];
          }
        });
        const formatted = Object.values(filtered);
        dataFormat = formatted.reverse().flatMap((dateElem, index) =>
          dateElem.data.map((dataElem, subindex) => ({
            id: `${index}-${subindex}`,
            company: dataElem.subcontractor
              ? dataElem.subcontractor.name
              : null,
            projectName2: dataElem.project_name ? dataElem.project_name : null,
            projectId: dataElem.tender ? dataElem.tender.project_id : null,
            project: dataElem.tender ? dataElem.tender.name : null,
            pack: dataElem.tender ? dataElem.tender.label : null,
            date: dateElem.date
              ? `${dateElem.date.day}/${dateElem.date.month}/${dateElem.date.year}`
              : null,
            tokenAmount: dataElem.token_amount ? dataElem.token_amount : null,
            cost: dataElem.cost
              ? String(
                  (dataElem.cost && Number(dataElem.cost) / 100) || 0
                ).replace(',', '')
              : null,
          }))
        );
      }
    }
    state.status = '';
    state[dataKey] = dataFormat;
  },
  [fetchTokens.rejected]: (state) => {
    state.status = 'error';
    state.data = [];
  },
  [fetchSupplyChainAnalytics.pending]: (state) => {
    state.status = 'loading';
  },
  [fetchSupplyChainAnalytics.fulfilled]: (state, { payload }) => {
    const { supply_chain } = payload;
    if (supply_chain) {
      let percentActivated = 0;
      let percentPending = 0;
      const invite = (supply_chain.invite && supply_chain.invite.total) || 0;
      const activated =
        (supply_chain.activation && supply_chain.activation.total) || 0;
      const pending = invite - activated;
      if (invite) {
        percentActivated = Math.round((100 * activated) / invite);
        percentPending = 100 - percentActivated;
      }
      state.supplyChain = {
        labels: [
          `(${percentActivated}%) Activated`,
          `(${percentPending}%) Pending`,
        ],
        datasets: [
          {
            data: [activated, pending],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
            ],
            borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
            borderWidth: 1,
          },
        ],
      };
    } else {
      state.supplyChain = {
        labels: [],
        datasets: [],
      };
    }
  },
  [fetchSupplyChainAnalytics.rejected]: (state) => {
    state.status = 'error';
    state.data = [];
  },
};

export { fetchTokens, fetchSupplyChainAnalytics };
