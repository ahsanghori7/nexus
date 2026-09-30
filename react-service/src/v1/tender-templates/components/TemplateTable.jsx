import React from 'react';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import isUndefined from 'lodash/isUndefined';
import moment from 'moment';
import { getQueryStringVars, resetUrl } from 'v2/helpers/url';
import SimpleTable from '../../global/components/table/Simple';
import TemplateActions from './TemplateActions';
import TemplateModal from './modal';

const TENDER_PUBLISHED_STATE = 2;
const TENDER_DRAFT_STATE = 1;

/**
 * @param state
 * @returns {boolean}
 */
const canShowTender = (state) => {
  return [TENDER_PUBLISHED_STATE, TENDER_DRAFT_STATE].includes(state);
};

const tableHeader = {
  tender: {
    label: 'Tender',
  },
  name: {
    label: 'Document type',
    render: (x) => {
      return (
        <>
          <span>{x}</span>
          <span className="tender-type-tooltip">{x}</span>
        </>
      );
    },
  },
  status: {
    label: 'Status',
    render: (v) => {
      return {
        0: 'Draft',
        1: 'Published',
        3: 'Archived',
      }[v];
    },
  },
  created_at: {
    label: 'Created',
    render: (c) => {
      return moment(c, 'YYYY-MM-DD HH:mm').format('DD/MM/YYYY HH:mm');
    },
  },
  actions: {
    label: 'Actions',
  },
};

const itemUpdater = () => {
  return '';
};

const parseRows = (data, pid, loadTemplates) => {
  const rows = [];

  Object.keys(data).forEach((i) => {
    const item = data[i];
    item.actions = (
      <TemplateActions
        item={item}
        pid={pid}
        tid={item.tid}
        id={item.id}
        loadTemplates={loadTemplates}
      />
    );
    rows.push(item);
  });

  return rows
    .sort((rowA, rowB) => new Date(rowB.created_at) - new Date(rowA.created_at))
    .sort((rowA, rowB) =>
      rowA.tender.toLowerCase().localeCompare(rowB.tender.toLowerCase()),
    );
};

const TemplateTable = (props) => {
  const { data, projectData, assets, createTemplate, loadTemplates } = props;
  const { id, tender } = projectData;
  const rows = parseRows(data, id, loadTemplates);

  const { tid, tender_addendum: ta } = getQueryStringVars();
  const openModal = isUndefined(tid) === false;
  if (openModal) {
    // Remove any url params to stop infinite modal open loop
    resetUrl();
  }

  return (
    <>
      {ta && (
        <>
          <LinearProgress />
          {/* Added inline styles due to bootstrap conflicts */}
          <Alert severity="success">
            You are creating a Tender Addendum. Please wait...
          </Alert>
        </>
      )}
      {data && data.length > 0 && (
        <div
          style={{ marginTop: '15px', width: '100%' }}
          className="item-container"
        >
          <div className="table-wrapper">
            <div className="table-container-order table-container">
              <SimpleTable
                data={rows}
                headers={tableHeader}
                rowUpdater={itemUpdater}
                classes="table-enquiry"
              />
            </div>
          </div>
          <div className="add-templates-wrapper">
            <TemplateModal
              pid={id}
              selectedTid={tid}
              modalOpen={openModal}
              tenderAddendum={ta}
              tenders={tender.filter((t) => {
                return canShowTender(Number(t.state));
              })}
              assets={assets}
              createTemplate={createTemplate}
            />
          </div>
        </div>
      )}
      {(!data || data.length < 1) && (
        <div className="item-container no-tender">
          <div className="no-tender-templates">
            <div className="no-tender-templates-content">
              <h4>No Tender Templates available</h4>
              <p>
                Create your first Tender Template by clicking the button below
              </p>
              <TemplateModal
                pid={id}
                selectedTid={tid}
                modalOpen={openModal}
                tenderAddendum={ta}
                tenders={tender.filter((t) => {
                  return canShowTender(Number(t.state));
                })}
                assets={assets}
                createTemplate={createTemplate}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplateTable;
