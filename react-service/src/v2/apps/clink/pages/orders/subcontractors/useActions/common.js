import { goToNewTab } from 'v2/helpers/url';

const viewLogOption = (handleLogModal, logs) => ({
  name: 'View Log',
  action: () => {
    handleLogModal(logs);
  },
});

const viewQuoteFile = (quotesFilesUrl, setOpen, close) => ({
  name: 'view-quote-file',
  action: () => {
    if (quotesFilesUrl) {
      goToNewTab(quotesFilesUrl);
    } else {
      setOpen({
        id: 'view-quotes-draft-order',
        navTitle: 'warning',
        title: 'documents-not-found',
        cancel: 'cancel',
        confirm: 'confirm',
        description: 'documents-not-found-desc',
        handleAccept: close,
      });
    }
  },
});

const modalAsyncAction = (
  setOpen,
  handleAccept,
  title = 'withdraw-order-title',
  name = 'withdraw-order'
) => ({
  name,
  action: () => {
    setOpen({
      id: 'withdraw-sent-order',
      navTitle: name,
      title,
      cancel: 'cancel',
      confirm: 'confirm',
      handleAccept,
    });
  },
});


const handleOpenNewTab = (name, url) => ({
  name,
  action: () => goToNewTab(url),
});

export {
  viewQuoteFile,
  modalAsyncAction,
  handleOpenNewTab,
  viewLogOption,
};
