import { createAsyncThunk } from '@reduxjs/toolkit';
import Relay from 'v2/services/relay';
import { patchData, postData } from 'services/clinkHelpers';
import { httpHelperV2 } from 'v2/services/httpHelper';
import flag from 'v2/helpers/flags';

const relay = new Relay('relay', '', '');
const fetchOrders = createAsyncThunk('order/fetchOrders', async (pid) =>
  relay
    .get('', { action: 'order', method: 'fetchAll', pid })
    .then((result) => (result.status === 200 ? result.json() : result.status))
    .catch((error) => error.status),
);

const deleteOrder = createAsyncThunk(
  'order/deleteOrder',
  async ({ qid, tid, pid, did }) =>
    relay
      .deleter('', {
        action: 'order',
        method: 'remove',
        qid,
        tid,
        pid,
        ...((flag('DELETE_DRAFT_ORDER') && { did }) || {}),
      })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status),
);

const withdrawSentOrder = createAsyncThunk(
  'order/withdrawSentOrder',
  async ({ pid, id, tid, did }) =>
    patchData(
      'transaction',
      'withdrawOrder',
      {},
      {
        pid,
        id,
        tid,
        ...((flag('DELETE_DRAFT_ORDER') && { did }) || {}),
      },
    )
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status),
);

const markAsSignOrder = createAsyncThunk(
  'order/markAsSignOrder',
  async ({ pid, id, tid }) =>
    patchData(
      'transaction',
      'markAsSigned',
      {},
      {
        pid,
        id,
        tid,
      },
    )
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status),
);

const sendApprovalReminder = createAsyncThunk(
  'order/sendApprovalReminder',
  async ({ approver_id, did }) =>
    postData(
      'order',
      'approvalReminder',
      { data: { approver_id: parseInt(approver_id, 10) } },
      {
        did,
      },
    )
      .then((result) => result.json())
      .catch((error) => error.status),
);


const assignOrderApprovers = createAsyncThunk(
  'order/assignOrderApprovers',
  async ({ did, data }) => {
    return httpHelperV2({
      url: `document/${did}/order/approvers`,
      method: 'POST',
      body: data,
    });
  },
);
const rejectionAcknowledge = createAsyncThunk(
  'order/rejectionAcknowledge',
  async ({ did, data }) => {
    return httpHelperV2({
      url: `document/${did}/order/rejection-acknowledge`,
      method: 'POST',
      body: data,
    });
  },
);

const withdrawOrderApproval = createAsyncThunk(
  'order/withdrawOrderApproval',
  async ({ did }) => {
    return httpHelperV2({
      url: `document/${did}/order/approval/withdraw`,
      method: 'POST',
    });
  },
);
const assignedOrderApprovers = createAsyncThunk(
  'order/assignedOrderApprovers',
  async (pid) => {
    return httpHelperV2({
      url: `project/${pid}/order/assigned-approvers`,
      method: 'GET',
    });
  },
);
const approveOrRejectOrder = createAsyncThunk(
  'order/approveOrRejectOrder',
  async ({ did, approver_id, status, comment = '', signature, meta }) => {
    const body = {
      approver_id,
      status,
      comment,
      ...(meta?.signatory && { signing_mechanism: signature }),
    };

    return httpHelperV2({
      url: `document/${did}/order/approval`,
      method: 'POST',
      body,
    });
  },
);

const assignedApproversforDocument = createAsyncThunk(
  'order/assignedApproversforDocument',
  async ({ pid, did }) =>
    httpHelperV2({
      url: `project/${pid}/order/assigned-approvers?did=${did}`,
      method: 'GET',
    }),
);

const fetchOrderLogs = createAsyncThunk(
  'order/fetchOrderLogs',
  async (document_id) =>
    httpHelperV2({
      url: `document/${document_id}/order/logs`,
      method: 'GET',
    }),
);

export {
  fetchOrders,
  deleteOrder,
  withdrawSentOrder,
  markAsSignOrder,
  sendApprovalReminder,
  assignOrderApprovers,
  withdrawOrderApproval,
  assignedOrderApprovers,
  assignedApproversforDocument,
  rejectionAcknowledge,
  approveOrRejectOrder,
  fetchOrderLogs,
};
