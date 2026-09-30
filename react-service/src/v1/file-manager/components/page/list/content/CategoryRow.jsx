import React from 'react';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import SubMenuSvg from '../../../../../global/public/images/svg/submenu-dropdown.svg';
import FolderSvg from '../../../../../global/public/images/svg/icon-folder.svg';
import Files from '../../../../helpers/Files';
import CategoryModal from '../../category-modal';
import Modal from '../../../../../global/components/modal';
import BinIconSvg from '../../../../../global/public/images/svg/bin-icon.svg';
import i18n from 'v2/helpers/i18n';
import alert from '../../../../../global/helpers/alert';

const Categories = ({
  item,
  sidemodal,
  clickItem,
  showAllTenders,
  className = '',
  renameFolder,
  addAllDocs,
  deleteFolder,
  selectItem,
  children,
  maxLimitTitle,
  maxLimitMessage,
}) => {
  const nFiles = Files.getCount(item.files);
  const { tid, pid } = item;

  const handleDeleteConfirm = (setShow) => {
    deleteFolder(item);
    setShow(false);
  };

  const handleDownloadClick = () => {
    const { id } = item;
    if (nFiles) {
      if (nFiles > Number(MAX_FILES_LIMIT)) {
        alert(
          { success: false },
          null,
          {},
          {
            title: maxLimitTitle,
            message: maxLimitMessage,
            type: 'error',
          }
        );
      } else {
        const zip = `${BASE_URLS.CLINK_APP_HOST}/download/category/${id}`;
        window.open(zip, '_blank');
      }
    }
  };

  const handleRenameClick = (
    newFolder,
    setShow,
    setError,
    setLoadingInModal
  ) => {
    renameFolder(newFolder, setShow, setError, setLoadingInModal, item.id);
  };
  const isDownloadDisabled = nFiles === 0;

  return (
    <div className={`${className} category-rows category-rows__body`}>
      <div className="cell cell--first">
        {!sidemodal && (
          <label
            className="input-container"
            htmlFor="select-category"
            aria-label="select-category"
          >
            <input
              type="checkbox"
              onChange={() => {
                if (selectItem) {
                  selectItem(item);
                }
              }}
              checked={item.checked}
              value={item.checked}
              name={`select-category-${item.id}`}
            />
            <span className="checkmark" />
          </label>
        )}
        <FolderSvg />
        {sidemodal ? (
          children
        ) : (
          <Button
            variant="link"
            className="item-name"
            onClick={() => clickItem(item)}
          >
            {item.label}
          </Button>
        )}
      </div>
      {!sidemodal && <div className="cell cell--second">{nFiles}</div>}
      {!showAllTenders && (
        <div className="cell actions-column-list">
          <Dropdown drop="left">
            <Dropdown.Toggle
              data-testid={`category-menu-toggle-${item.id}`}
              className="category-item-action"
              aria-label="Category Options"
              type="button"
              size="sm"
            >
              <SubMenuSvg />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item data-testid={`download-folder-btn-${item.id}`} disabled={isDownloadDisabled} onClick={handleDownloadClick}>
                Download folder
              </Dropdown.Item>
              <Dropdown.Divider />
              <CategoryModal
                category={item}
                sidemodal={sidemodal}
                renameFolder={handleRenameClick}
                label="Create new folder"
              />
              <Dropdown.Divider />
              {tid !== pid && (
                <>
                  <Dropdown.Item
                    onClick={() => {
                      addAllDocs(item);
                    }}
                  >
                    Add all docs
                  </Dropdown.Item>
                  <Dropdown.Divider />
                </>
              )}
              <Modal
                title={i18n.t('file-manager-delete-folder-title')}
                subtitle={i18n.t('file-manager-delete-subtitle')}
                ShowButton={({ handleClick }) => (
                  <Dropdown.Item onClick={handleClick} className="delete-btn">
                    {i18n.t('file-manager-delete-folder-title')}
                  </Dropdown.Item>
                )}
                render={({ setShow }) => (
                  <div className="text-center">
                    <div className="delete-confirm-icon">
                      <BinIconSvg />
                    </div>
                    <p>
                      {i18n.t('file-manager-delete-confirm-prefix')} <strong>{item.label}</strong>
                      {i18n.t('file-manager-delete-folder-confirm-suffix')}
                    </p>
                    <div className="button-container">
                      <Button variant="outline-secondary" onClick={() => setShow(false)}>{i18n.t('file-manager-delete-cancel-btn')}</Button>
                      <Button variant="danger" onClick={() => handleDeleteConfirm(setShow)}>{i18n.t('file-manager-delete-confirm-btn')}</Button>
                    </div>
                  </div>
                )}
              />
            </Dropdown.Menu>
          </Dropdown>
        </div>
      )}
    </div>
  );
};

export default Categories;
