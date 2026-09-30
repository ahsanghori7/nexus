const DEFAULT_FOLDER_URL = 'folder';
const DEFAULT_TENDER_URL = 'tender';

const getDataFromUrl = (data, id, label, type) => {
  if (
    id &&
    label &&
    label === type &&
    data.filter((item) => item.id === id).length
  ) {
    return id;
  }
  return 0;
};

const getFolderFromUrl = (folders, params) => {
  // eslint-disable-next-line no-unused-vars
  const [_tenderLabel, _tid, folderLabel, cid] = params.split('-');
  return getDataFromUrl(folders, Number(cid), folderLabel, DEFAULT_FOLDER_URL);
};

const getTenderFromUrl = (tenders, params) => {
  const [tenderLabel, tid] = params.split('-');
  return getDataFromUrl(tenders, Number(tid), tenderLabel, DEFAULT_TENDER_URL);
};

export { getFolderFromUrl, getTenderFromUrl };
