import {
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
} from './asyncThunk';

export default {
  [fetchOrders.pending]: (state) => {
    state.loading = true;
    state.loadingOrders = true;
  },
  [fetchOrders.fulfilled]: (state, { payload }) => {
    const newList = [...(payload || [])].sort((a, b) =>
      (a?.tender?.label || '').localeCompare(b?.tender?.label || ''),
    );

    const mergedList = newList.map((order) => {
      const existingOrder = state.list.find(
        (o) => o.tender?.id === order.tender?.id,
      );
      return {
        ...order,
        entries: order.entries.map((entry) => {
          const existingEntry = existingOrder?.entries.find(
            (e) => e.order_id === entry.order_id,
          );
          return {
            ...entry,
            ...(existingEntry?.assigned_approvers && {
              assigned_approvers: existingEntry.assigned_approvers,
              isLevel: existingEntry.isLevel,
            }),
          };
        }),
      };
    });

    state.list = mergedList;
    state.loading = false;
    state.loadingOrders = false;
  },
  [fetchOrders.rejected]: (state) => {
    state.loading = false;
    state.loadingOrders = false;
  },
  [deleteOrder.pending]: () => {},
  [deleteOrder.fulfilled]: (state, { payload, meta }) => {
    const { arg } = meta;
    const { success } = payload;
    const { tid, did } = arg;
    if (success) {
      state.list = state.list.map((item) => {
        const { tender, entries } = item;
        if (tender.id !== tid) {
          return item;
        }
        const filteredEntries = entries.filter(
          (entry) =>
            entry.document &&
            entry.document.id &&
            Number(entry.document.id) !== Number(did),
        );
        return {
          tender,
          entries: filteredEntries,
        };
      });
    }
  },
  [deleteOrder.rejected]: () => {},
  [withdrawSentOrder.pending]: () => {},
  [withdrawSentOrder.fulfilled]: (state, { meta }) => {
    const { arg } = meta;
    const { tid, id, did } = arg;
    state.list = state.list.map((item) => {
      const { tender, entries } = item;
      if (tender.id === tid) {
        return {
          tender,
          entries: entries.map((entry) => {
            if (
              Number(entry.order_id) === Number(id) &&
              entry.document &&
              entry.document.id &&
              Number(entry.document.id) === Number(did)
            ) {
              return {
                ...entry,
                status: 'Withdrew', // TODO: Retrieve constants from backend
              };
            }
            return entry;
          }),
        };
      }
      return item;
    });
  },
  [withdrawSentOrder.rejected]: () => {},
  [markAsSignOrder.pending]: () => {},
  [markAsSignOrder.fulfilled]: (state, { meta }) => {
    const { arg } = meta;
    const { tid, id } = arg;
    state.list = state.list.map((item) => {
      const { tender, entries } = item;
      if (tender.id === tid) {
        return {
          tender,
          entries: entries.map((entry) => {
            if (entry.order_id === id) {
              return {
                ...entry,
                status: 'Signed', // TODO: Retrieve constants from backend
              };
            }
            return entry;
          }),
        };
      }
      return item;
    });
  },
  [markAsSignOrder.rejected]: () => {},
  [sendApprovalReminder.pending]: () => {},
  [sendApprovalReminder.fulfilled]: () => {},
  [sendApprovalReminder.rejected]: () => {},
  [withdrawOrderApproval.pending]: () => {},
  [withdrawOrderApproval.fulfilled]: (state, { meta }) => {
    const { did } = meta.arg;
    state.list = state.list.map((order) => ({
      ...order,
      entries: order.entries.map((entry) => {
        if (
          entry.document &&
          entry.document.id &&
          Number(entry.document.id) === Number(did)
        ) {
          return {
            ...entry,
            status: 'Draft',
            assigned_approvers: null,
            isLevel: undefined,
          };
        }
        return entry;
      }),
    }));
  },
  [withdrawOrderApproval.rejected]: () => {},
  [assignedOrderApprovers.pending]: (state) => {
    state.loadingApprovers = true;
  },
  [assignedOrderApprovers.fulfilled]: (state, action) => {
    state.loadingApprovers = false;
    const approversMap = action.payload;

    state.list = state.list.map((order) => ({
      ...order,
      entries: order.entries.map((entry) => {
        const orderId = String(entry.order_id);
        if (approversMap[orderId]) {
          return {
            ...entry,
            assigned_approvers: approversMap[orderId].approvals,
            isLevel: approversMap[orderId].isLevel,
          };
        }
        return entry;
      }),
    }));
  },

  [assignedOrderApprovers.rejected]: (state) => {
    state.loadingApprovers = false;
    state.error = true;
  },
  [rejectionAcknowledge.pending]: () => {},
  [rejectionAcknowledge.fulfilled]: () => {},
  [rejectionAcknowledge.rejected]: () => {},
  [assignedApproversforDocument.pending]: () => {},
  [assignedApproversforDocument.fulfilled]: (state, action) => {
    const approvers = action.payload;
    state.list = state.list.map((order) => ({
      ...order,
      entries: order.entries.map((entry) => {
        const documentId = String(entry.document?.id);
        if (documentId && approvers[documentId]) {
          return {
            ...entry,
            assigned_approvers: approvers[documentId].approvals,
            isLevel: approvers[documentId].isLevel,
          };
        }
        return entry;
      }),
    }));
  },
  [assignedApproversforDocument.rejected]: () => {},
  [fetchOrderLogs.pending]: () => {},
  [fetchOrderLogs.fulfilled]: () => {},
  [fetchOrderLogs.rejected]: () => {},
};

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
