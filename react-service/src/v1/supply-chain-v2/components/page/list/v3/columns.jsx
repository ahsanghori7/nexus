import React from 'react';
import Tooltip from '@mui/material/Tooltip';

const StatusesDescription = () => (
  <>
    <div>PQQ Status Descriptions</div>
    <br />
    <div>Red - Not started</div>
    <br />
    <div>Yellow - Partially completed</div>
    <br />
    <div>Green - Completed</div>
  </>
);

const ActivationDescription = () => (
  <>
    <div>Activation Descriptions</div>
    <br />
    <div>Checked - Activated</div>
    <br />
    <div>Unchecked - Not Activated</div>
  </>
);

const columns = [
  {
    field: 'activated',
    headerName: 'Activation Status',
    flex: 1,
    maxWidth: 150,
    disableColumnMenu: true,
    renderCell: (params) => params.value,
    renderHeader: (params) => {
      const { colDef } = params;
      const { headerName = '' } = colDef;
      return (
        <Tooltip disableInteractive title={<ActivationDescription />}>
          <span
            style={{
              cursor: 'help',
              opacity: 0.7,
              marginBottom: '4px',
            }}
          >
            {headerName}
          </span>
        </Tooltip>
      );
    },
    sortable: false,
  },
  {
    field: 'status',
    headerName: 'PQQ Status',
    flex: 1,
    minWidth: 90,
    maxWidth: 100,
    disableColumnMenu: true,
    renderCell: (params) => params.value,
    renderHeader: (params) => {
      const { colDef } = params;
      const { headerName = '' } = colDef;
      return (
        <Tooltip disableInteractive title={<StatusesDescription />}>
          <span
            style={{
              cursor: 'help',
              opacity: 0.7,
              marginBottom: '4px',
            }}
          >
            {headerName}
          </span>
        </Tooltip>
      );
    },
    sortable: false,
  },
  {
    field: 'company',
    headerName: 'Company',
    flex: 1,
    minWidth: 150,
    renderCell: (params) => params.value,
    disableColumnMenu: true,
    sortable: false,
  },
  {
    field: 'contact-name',
    headerName: 'Contact Name',
    flex: 1,
    minWidth: 150,
    disableColumnMenu: true,
    sortable: false,
  },
  {
    field: 'email',
    headerName: 'Email',
    flex: 1,
    minWidth: 150,
    disableColumnMenu: true,
    sortable: false,
  },
  {
    field: 'contact-number',
    headerName: 'Contact Number',
    flex: 1,
    minWidth: 150,
    disableColumnMenu: true,
    sortable: false,
  },
  {
    field: 'created_at',
    headerName: 'Created At',
    flex: 1,
    minWidth: 150,
    disableColumnMenu: true,
    sortable: false,
  },
  {
    field: 'tradesCollapse',
    headerName: 'Trades',
    renderCell: (params) => params.value,
    flex: 1,
    minWidth: 150,
    disableColumnMenu: true,
    sortable: false,
  },
  {
    field: 'locationsCollapse',
    headerName: 'Locations',
    renderCell: (params) => params.value,
    flex: 1,
    minWidth: 150,
    disableColumnMenu: true,
    sortable: false,
  },
  {
    field: 'actions',
    headerName: 'Actions',
    renderCell: (params) => params.value,
    flex: 1,
    disableColumnMenu: true,
    minWidth: 90,
    sortable: false,
  },
];

export default columns;
export { StatusesDescription, ActivationDescription };
