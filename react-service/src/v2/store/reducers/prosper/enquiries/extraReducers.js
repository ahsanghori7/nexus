import i18next from 'v2/helpers/i18n';
import moment from 'moment';
import { createAsyncThunk } from '@reduxjs/toolkit';
import capitalize from 'lodash/capitalize';
import isArray from 'lodash/isArray';
import { fetchData, postFormData, patchData } from 'services/helpers';
import { processTenderDates } from 'v2/helpers/date';
import httpRequest from 'services/httpHelper';
import flag from 'v2/helpers/flags';

const DATE_FORMAT = 'YYYY-MM-DD';
const ITEMS_LENGTH = flag('PROSPER_ENQUIRIES_MUI_PAGINATION') || 6;
const formatCurrency = (value) =>
  String(value ?? '').replaceAll('£', i18next.t('currency'));

const fetchEnquiries = createAsyncThunk(
  'enquiries/fetchEnquiries',
  async (data = false) =>
    fetchData('enquiries', data, 'latest').then((result) => result.data)
);

const changeStatus = createAsyncThunk(
  'enquiries/changeStatus',
  async ({ status, enquiryId }) =>
    patchData('enquiries', { status_id: status.id }, enquiryId).then(() => {})
);

const createQuote = createAsyncThunk(
  'enquiries/createQuote',
  async ({ enquiryId, data }) =>
    postFormData('enquiries', data, `${enquiryId}/quotation`).then((response) =>
      response.json()
    )
);

const tenderIsDownloaded = createAsyncThunk(
  'enquiries/tenderIsDownloaded',
  async () =>
    postFormData('enquiries', null, `downloaded`).then((response) =>
      response.json()
    )
);

const fetchDocumentsHistory = createAsyncThunk(
  'enquiries/fetchDocumentsHistory',
  async () => {
    try {
      return await httpRequest({ url: `enquiries/history/document` });
    } catch (error) {
      return error;
    }
  }
);

export default {
  [fetchEnquiries.pending]: (state) => {
    state.status = 'loading';
  },
  [fetchEnquiries.fulfilled]: (state, { payload }) => {
    const latest = (
      payload && isArray(payload)
        ? processTenderDates(payload, DATE_FORMAT)
        : []
    ).map((e) => ({
      ...e,
      size: formatCurrency(e.size),
      employer_liabilty_insurance: formatCurrency(
        e.employer_liabilty_insurance
      ),
    }));
    state.latest = latest;
    state.current = latest.slice(0, ITEMS_LENGTH);
    state.total = latest.slice(ITEMS_LENGTH);
    state.status = '';
  },
  [fetchEnquiries.rejected]: (state) => {
    state.status = 'error';
    state.latest = [];
  },
  [changeStatus.pending]: (state) => {
    state.status = 'loading';
  },
  [changeStatus.fulfilled]: (state, { meta }) => {
    state.status = '';
    const { arg } = meta;
    const { enquiryId, status } = arg;
    const { id, label } = status;

    const updater = (enquiry) =>
      Number(enquiry.id) === Number(enquiryId)
        ? {
            ...enquiry,
            status_id: id,
            status: label,
          }
        : enquiry;

    state.latest = state.latest.map(updater);
    state.current = state.current.map(updater);
  },
  [changeStatus.rejected]: (state) => {
    state.status = 'error';

    state.latest = (state.latest && state.latest.length && state.latest) || [];
  },
  [createQuote.pending]: (state) => {
    state.status = 'loading';
  },
  [createQuote.fulfilled]: (state, { payload, meta }) => {
    state.status = payload.success ? '' : 'error';
    if (payload.success) {
      const { arg } = meta;
      const { enquiryId } = arg;
      const updater = (enquiry) => {
        const newStatus =
          Number(enquiry.id) === Number(enquiryId)
            ? {
                status: i18next
                  .t('text-tender-returned')
                  .split(' ')
                  .map(capitalize)
                  .join(' '),
                status_id: 9,
                updated_at: moment().format('YYYY-MM-DD HH:MM'),
              }
            : {};
        return {
          ...enquiry,
          ...newStatus,
        };
      };
      state.latest = state.latest.map(updater);
      state.current = state.current.map(updater);
    }
  },
  [createQuote.rejected]: (state) => {
    state.status = 'error';
    state.latest = (state.latest && state.latest.length && state.latest) || [];
    state.current =
      (state.current && state.current.length && state.current) || [];
  },
  [tenderIsDownloaded.pending]: () => {},
  [tenderIsDownloaded.fulfilled]: () => {},
  [tenderIsDownloaded.rejected]: () => {},
  [fetchDocumentsHistory.pending]: (state) => {
    state.status = 'loading';
  },
  [fetchDocumentsHistory.fulfilled]: (state, { payload }) => {
    const documents = [];
    if (payload && payload.data) {
      const enquiry = (payload.data && payload.data.enquiry) || [];
      const order = (payload.data && payload.data.order) || [];
      const tender_addendum =
        (payload.data && payload.data.tender_addendum) || [];
      enquiry.forEach((enquiryDocument) => {
        const {
          tender_id,
          document_name,
          download_link,
          received_date,
          version,
        } = enquiryDocument;
        documents.push({
          tender_id,
          document_name,
          download_link,
          received_date,
          version,
        });
      });
      tender_addendum.forEach((tender) => {
        const {
          tender_id,
          document_name,
          download_link,
          received_date,
          version,
        } = tender;
        documents.push({
          tender_id,
          document_name,
          download_link,
          received_date,
          version,
        });
      });
      order.forEach((orderDocument) => {
        const {
          tender_id,
          document_name,
          download_link,
          received_date,
          version,
        } = orderDocument;
        documents.push({
          tender_id,
          document_name,
          download_link,
          received_date,
          version,
        });
      });
    }
    state.documents = [...documents].sort(
      (rowA, rowB) =>
        new Date(rowB.received_date) - new Date(rowA.received_date)
    );
  },
  [fetchDocumentsHistory.rejected]: (state) => {
    state.status = 'error';
    state.documents = [];
  },
};

export {
  fetchEnquiries,
  createQuote,
  changeStatus,
  tenderIsDownloaded,
  fetchDocumentsHistory,
};
