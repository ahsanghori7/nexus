import {
  DRAFT,
  SENT,
  WITHDRAW,
  WITHDREW,
  SIGNED,
  ORDER_SIGNED,
  PENDING,
  AWAITING,
  IN_QUEUE,
  REJECTED,
  PENDING_APPROVAL,
} from 'v2/helpers/status/orders';
import flag from 'v2/helpers/flags';
import i18next from 'v2/helpers/i18n';
import { handleUnauthorized } from 'v2/helpers/session';
import {
  viewQuoteFile,
  modalAsyncAction,
  handleOpenNewTab,
  viewLogOption,
} from './common';

const useActions = (
  pid,
  entryData,
  tender,
  setOpen,
  quoteFilesForTender,
  withdrawSentOrder,
  markAsSignOrder,
  deleteOrder,
  useDisabled,
  handleLogModal,
  openWithdrawApprovalModal,
) => {
  const {
    status,
    document,
    order_id,
    subcontractor,
    signatory = {},
  } = entryData;
  const { id: tid } = tender;
  const { id: did } = document;
  const editUrl = `/document-creator/template/${did}/order/${tid}`;
  const viewDoc = `/signatory/download/${order_id}`;
  const signOrder = `/signatory/sign/${order_id}`;
  const resendOrder = `/signatory/resend/${order_id}`;
  const quotesFilesUrl =
    (order_id && quoteFilesForTender && quoteFilesForTender[order_id]) || null;
  const close = () => setOpen(false);
  const handleWithdrawAccept = () => {
    withdrawSentOrder({ id: order_id, pid, tid, did }).then(close);
  };
  const handleDelete = () => {
    deleteOrder({ qid: order_id, pid, tid, did }).then(close);
  };
  const handleMarkAsSigned = () => {
    markAsSignOrder({ id: order_id, pid, tid }).then(close);
  };
  const handleViewQuote = viewQuoteFile(quotesFilesUrl, setOpen, close);

  const { can_sign = false } = signatory;
  const handleSignOrder = can_sign
    ? [handleOpenNewTab('sign-order', signOrder)]
    : [];
  const withdrawOption = modalAsyncAction(
    setOpen,
    handleWithdrawAccept,
    `${i18next.t('withdraw-order-title')} ${subcontractor.name}?`,
  );

  let deleteOption = [];
  if (flag('DELETE_DRAFT_ORDER')) {
    deleteOption = [
      modalAsyncAction(
        setOpen,
        handleDelete,
        'delete-order-title',
        'delete-order',
      ),
    ];
  }

  const [disabled, setDisabled] = useDisabled;
  const resend = {
    name: 'resend-order',
    action: () => {
      setDisabled();
      fetch(resendOrder)
        .then((response) => {
          if (response.status === 401) {
            handleUnauthorized();
            return new Promise(() => {});
          }
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .catch((error) => {
          // Handle any errors here
          // eslint-disable-next-line no-console
          console.error(
            'There has been a problem with your fetch operation:',
            error,
          );
        });
    },
    disabled,
  };

  switch (status) {
    case IN_QUEUE:
      return [
        handleOpenNewTab('view-order', viewDoc),
        handleViewQuote,
        viewLogOption(handleLogModal, did),
      ];
    case DRAFT:
      return [
        handleOpenNewTab('edit-order', editUrl),
        ...deleteOption,
        handleViewQuote,
        viewLogOption(handleLogModal, did),
      ];
    case SENT:
      return [
        handleOpenNewTab('view-order', viewDoc),
        withdrawOption,
        modalAsyncAction(
          setOpen,
          handleMarkAsSigned,
          'are-you-sure',
          'mark-as-signed',
        ),
        handleViewQuote,
        viewLogOption(handleLogModal, did),
      ];
    case WITHDRAW: // TODO: Discuss about wet/docusign difference
    case WITHDREW:
      return [
        handleOpenNewTab('view-order', viewDoc),
        handleOpenNewTab('edit-order', editUrl),
        handleViewQuote,
      ];
    case SIGNED:
    case ORDER_SIGNED:
      return [handleOpenNewTab('view-order', viewDoc), handleViewQuote];
    case PENDING:
      return [
        handleOpenNewTab('view-order', viewDoc),
        resend,
        withdrawOption,
        handleViewQuote,
        viewLogOption(handleLogModal, did),
      ];
    case AWAITING:
      return [
        handleOpenNewTab('view-order', viewDoc),
        ...handleSignOrder,
        resend,
        withdrawOption,
        handleViewQuote,
      ];
    case REJECTED:
      return [
        handleOpenNewTab('edit-order', editUrl),
        handleViewQuote,
        viewLogOption(handleLogModal, did),
      ];
    case PENDING_APPROVAL:
      return [
        handleOpenNewTab('edit-order', editUrl),
        {
          name: 'withdraw-order-approval',
          action: () => openWithdrawApprovalModal(did),
        },
        handleViewQuote,
        viewLogOption(handleLogModal, did),
      ];
    default:
      return [];
  }
};

export default useActions;
