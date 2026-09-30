import React, { useState } from 'react';
import isArray from 'lodash/isArray';
import MenuItem from '@mui/material/MenuItem';
import Button from 'react-bootstrap/Button';
import GlobalModal from 'v1/global/components/modal';
import Relay from 'v1/global/services/Relay';
import Loading from 'v1/global/components/Loading';
import TenderLogTable from './table';

const defaultOptions = {
  search: false,
  download: false,
  print: false,
  viewColumns: false,
  filter: false,
  sort: false,
  pagination: false,
  selectableRows: 'none',
  textLabels: {
    body: {
      noMatch: 'There is no Tender log.',
    },
  },
  responsive: 'simple',
};

const ID_STATUS_ADDED = 10;

const ShowButtonComponent = ({
  handleClick,
  tid,
  sid,
  setData = () => null,
  setLoading = () => null,
}) => (
  <MenuItem
    onClick={() => {
      handleClick();
      const relay = new Relay('project', 'getTenderLog');
      relay
        .getJson({ tid, sid })
        .then((response) => {
          if (response && isArray(response)) {
            setData(
              response.filter((i) => Number(i.status_id) !== ID_STATUS_ADDED)
            );
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }}
  >
    View Tender Log
  </MenuItem>
);

const TenderLogModal = ({
  tid,
  subId,
  subName = '',
  showClose = false,
  handleMenuClose = () => null,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  // eslint-disable-next-line react/no-unstable-nested-components
  const ShowButton = ({ handleClick }) => (
    <ShowButtonComponent
      handleClick={handleClick}
      tid={tid}
      sid={subId}
      setData={setData}
      setLoading={setLoading}
    />
  );

  return (
    <GlobalModal
      title={subName}
      subtitle="Tender Log"
      className="tender-log-modal"
      dialogClassName="tender-log-modal-dialog"
      ShowButton={ShowButton}
      showClose={showClose}
      backdrop="static"
      render={(props) => {
        const { setShow } = props;
        const closeModal = () => {
          handleMenuClose();
          setShow(false);
        };
        const CloseButton = () => (
          <Button
            type="buton"
            className="modal-go-back-button"
            onClick={closeModal}
            variant="outline-dark"
          >
            Go Back
          </Button>
        );
        return loading ? (
          <Loading />
        ) : (
          <>
            <TenderLogTable sid={subId} data={data} options={defaultOptions} />
            <CloseButton />
          </>
        );
      }}
    />
  );
};

export default TenderLogModal;
