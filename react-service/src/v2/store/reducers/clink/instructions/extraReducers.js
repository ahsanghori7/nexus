import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import { renderTextWithoutHtml } from 'v2/helpers/data';
import {
  fetchInstructions,
  fetchInstruction,
  fetchType,
  fetchStatus,
  fetchSubcontractors,
  deleteInstruction,
  fetchForecastList,
  createInstruction,
  updateInstruction,
} from './asyncThunk';

export default {
  [fetchInstructions.pending]: (state) => {
    state.status = 'loading';
    state.list = [];
  },
  [fetchInstructions.fulfilled]: (state, extra) => {
    const { payload } = extra;
    state.status = '';
    const list = payload && isArray(payload) ? payload : [];
    state.list = list.map((elem) => ({
      ...elem,
      description: renderTextWithoutHtml(elem.description),
      price: elem.price / 100,
    }));
  },
  [fetchInstructions.rejected]: (state) => {
    state.status = 'error';
    state.list = [];
  },
  [fetchInstruction.pending]: (state, { meta }) => {
    const { arg } = meta;
    const { hideLoading } = arg;
    state.status = hideLoading ? '' : 'loading';
  },
  [fetchInstruction.fulfilled]: (state, { payload }) => {
    const payloadCheck = payload && !isEmpty(payload) ? { ...payload } : {};
    const documents =
      payloadCheck && payloadCheck.documents ? payloadCheck.documents : [];
    state.data = {
      ...payloadCheck,
      subcontractor:
        payloadCheck && payloadCheck.subcontractor
          ? {
              id: Number(payloadCheck.subcontractor.id),
              label: payloadCheck.subcontractor.name,
              packages: Object.values(payloadCheck.subcontractor.packages),
            }
          : {},
      documents: documents.map((d) => ({
        id: Number(d.id),
        name: d.name,
      })),
      price: payloadCheck && payloadCheck.price ? payloadCheck.price / 100 : 0,
    };
    state.status = '';
  },
  [fetchInstruction.rejected]: (state) => {
    state.status = 'error';
    state.data = null;
  },
  [fetchStatus.pending]: (state) => {
    state.statusList = [];
  },
  [fetchStatus.fulfilled]: (state, { payload }) => {
    state.statusList = payload && isArray(payload) ? payload : [];
  },
  [fetchStatus.rejected]: (state) => {
    state.statusList = [];
  },
  [fetchType.pending]: (state) => {
    state.typeList = [];
  },
  [fetchType.fulfilled]: (state, { payload }) => {
    state.typeList = payload && isArray(payload) ? payload : [];
  },
  [fetchType.rejected]: (state) => {
    state.typeList = [];
  },
  [fetchSubcontractors.pending]: () => {},
  [fetchSubcontractors.fulfilled]: (state, { payload }) => {
    state.subcontractorsList = payload.map((s) => ({
      id: Number(s.id),
      label: s.name,
      packages: Object.values(s.packages),
    }));
    state.status = '';
  },
  [fetchSubcontractors.rejected]: (state) => {
    state.subcontractorsList = [];
    state.status = 'error';
  },
  [deleteInstruction.pending]: (state) => {
    state.status = 'loading';
  },
  [deleteInstruction.fulfilled]: (state, extra) => {
    const { meta } = extra;
    const { arg } = meta;

    state.status = '';
    state.list = state.list.filter((elem) => elem.id !== arg);
  },
  [deleteInstruction.rejected]: (state) => {
    state.status = 'error';
  },
  [fetchForecastList.pending]: (state) => {
    state.status = 'loading';
  },
  [fetchForecastList.fulfilled]: (state, { payload }) => {
    let forecastList = payload && payload.length ? payload : [];
    forecastList = forecastList.map((elem) => ({
      ...elem,
      budget: Number(elem.budget) / 100,
      omissions: Number(elem.omissions) / 100,
      order: Number(elem.order) / 100,
      total: Number(elem.total) / 100,
      variations: Number(elem.variations) / 100,
    }));
    const totalRow = {
      tid: 0,
      package: 'TOTALS',
      order: 0,
      variations: 0,
      omissions: 0,
      budget: 0,
      total: 0,
      end: true,
    };
    forecastList.forEach((i) => {
      totalRow.order += Number(i.order);
      totalRow.variations += Number(i.variations);
      totalRow.omissions += Number(i.omissions);
      totalRow.budget += Number(i.budget);
      totalRow.total += Number(i.total);
    });
    state.forecastList = [...forecastList, totalRow];
    state.status = '';
  },
  [fetchForecastList.rejected]: (state) => {
    state.status = 'Error loading forecast list';
  },
  [createInstruction.pending]: (state) => {
    state.status = '';
  },
  [createInstruction.fulfilled]: (state, { payload }) => {
    const { id, success } = payload;
    if (success) {
      state.data = { id };
      state.status = '';
    }
  },
  [createInstruction.rejected]: (state) => {
    state.status = '';
  },
  [updateInstruction.pending]: (state) => {
    state.status = 'loading';
  },
  [updateInstruction.fulfilled]: (state, { payload, meta }) => {
    const { success } = payload;
    if (success) {
      const { arg } = meta;
      const { instruction } = arg;
      const { description, price, status } = instruction;
      state.status = '';
      state.data = { ...state.data, description, price: price / 100 };
      state.sentSuccessfully = Number(status) === Number(1);
    } else {
      state.status = 'send-instruction-error';
    }
  },
  [updateInstruction.rejected]: (state) => {
    state.status = 'send-instruction-error';
  },
};
export {
  fetchInstructions,
  fetchInstruction,
  fetchType,
  fetchStatus,
  fetchSubcontractors,
  deleteInstruction,
  fetchForecastList,
  createInstruction,
  updateInstruction,
};
