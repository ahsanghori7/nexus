import { createSlice } from '@reduxjs/toolkit';
import extraReducers, {
  fetchOrders,
  deleteOrder,
  withdrawSentOrder,
  markAsSignOrder,
  sendApprovalReminder,
  assignOrderApprovers,
  withdrawOrderApproval,
  assignedOrderApprovers,
  rejectionAcknowledge,
  approveOrRejectOrder,
  assignedApproversforDocument,
  fetchOrderLogs,
} from './extraReducers';

const initialState = {
  list: [],
  loading: false,
  loadingOrders: false,
  loadingApprovers: false,
  error: false,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    restartOrders: (state) => {
      state.list = [];
      state.loading = false;
      state.loadingOrders = false;
      state.loadingApprovers = false;
      state.error = false;
    },
  },
  extraReducers,
});

export const { restartOrders } = orderSlice.actions;
export {
  fetchOrders,
  deleteOrder,
  withdrawSentOrder,
  markAsSignOrder,
  sendApprovalReminder,
  assignOrderApprovers,
  withdrawOrderApproval,
  assignedOrderApprovers,
  rejectionAcknowledge,
  approveOrRejectOrder,
  assignedApproversforDocument,
  fetchOrderLogs,
};
export default orderSlice.reducer;
