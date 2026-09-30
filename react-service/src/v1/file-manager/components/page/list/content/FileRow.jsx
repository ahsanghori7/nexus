import React from 'react';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import MuiEllipsisTooltip from 'v2/apps/shared/components/boq/MuiEllipsisTooltip';
import SubMenuSvg from '../../../../../global/public/images/svg/submenu-dropdown.svg';
import Modal from '../../../../../global/components/modal';
import BinIconSvg from '../../../../../global/public/images/svg/bin-icon.svg';
import i18n from 'v2/helpers/i18n';

const Files = ({
  item,
  deleteFile,
  selectItem,
  showAllTenders,
  className = '',
}) => {
  const handleDeleteConfirm = (setShow) => {
    const { tid, cid } = item;
    deleteFile(item, tid, cid);
    setShow(false);
  };
  const handleDownloadClick = () => {
    const { id } = item;
    const zip = `${BASE_URLS.CLINK_APP_HOST}/download/asset/${id}`;
    window.open(zip, '_blank');
  };

  return (
    <div className={`${className} files-rows files-rows__header`}>
      <div className="cell cell--first">
        {selectItem && (
          <label
            className="input-container"
            htmlFor="select-file"
            aria-label="select-file"
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
              name={`select-file-${item.id}`}
            />
            <span className="checkmark" />
          </label>
        )}
        <MuiEllipsisTooltip tooltipContent={item?.name} time={1500} />
      </div>
      <div className="cell cell--second">{item.type}</div>
      {!showAllTenders && (
        <div className="actions-column-list cell">
          <Dropdown drop="left">
            <Dropdown.Toggle
              data-testid={`file-menu-toggle-${item.id}`}
              className="file-item-action"
              aria-label="File Options"
              type="button"
              size="sm"
            >
              <SubMenuSvg />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item data-testid={`download-file-btn-${item.id}`} onClick={handleDownloadClick}>
                Download file
              </Dropdown.Item>
              <Modal
                title={i18n.t('file-manager-delete-file-title')}
                subtitle={i18n.t('file-manager-delete-subtitle')}
                ShowButton={({ handleClick }) => (
                  <Dropdown.Item onClick={handleClick} className="delete-btn">
                    {i18n.t('file-manager-delete-file-title')}
                  </Dropdown.Item>
                )}
                render={({ setShow }) => (
                  <div className="text-center">
                    <div className="delete-confirm-icon">
                      <BinIconSvg />
                    </div>
                    <p>
                      {i18n.t('file-manager-delete-confirm-prefix')} <strong>{item.name}</strong>
                      {i18n.t('file-manager-delete-file-confirm-suffix')}
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

export default Files;
