import React from 'react';
import Box from '@mui/material/Box';
import Panel from 'v1/global/components/layout/panel';
import { TA_SLUG } from 'v1/global/helpers/constants';
import FileManagerModal from './FileManagerModal';
import Header from './header';

const Page = ({
  handleConfigSave,
  handleApprovalRequest,
  handleApproveOrRejectOrder,
  handleRejectionAcknowledge,
  handleSend,
  actionButtons = false,
  showForm = false,
  canSend = false,
  docusignSendEmail = false,
  projectData,
  formPercentage,
  defaultTender,
  slug,
  did = 0,
  children,
  errorStatus,
  docType,
  subcontractor,
  loadingConfigService,
  callback,
  signature,
  info,
  setMissingHighlight = () => null,
  approversList,
  isDocumentUpdated,
  assignedApproversRaw,
  assignedApprovers,
  status,
  initPage,
  meta,
}) => {
  const header = (
    <Header
      showForm={showForm}
      canSend={canSend}
      docusignSendEmail={docusignSendEmail}
      formPercentage={formPercentage}
      actionButtons={actionButtons}
      handleConfigSave={handleConfigSave}
      handleApprovalRequest={handleApprovalRequest}
      handleApproveOrRejectOrder={handleApproveOrRejectOrder}
      handleRejectionAcknowledge={handleRejectionAcknowledge}
      handleSend={handleSend}
      did={did}
      errorStatus={errorStatus}
      docType={docType}
      subcontractor={subcontractor}
      loadingConfigService={loadingConfigService}
      signature={signature}
      info={info}
      setMissingHighlight={setMissingHighlight}
      approversList={approversList}
      assignedApproversRaw={assignedApproversRaw}
      isDocumentUpdated={isDocumentUpdated}
      assignedApprovers={assignedApprovers}
      status={status}
      initPage={initPage}
      meta={meta}
    />
  );
  return (
    <div className="document-creator-page">
      <Box className="document-creator-header">
        <div className="header-container">
          <Panel className="breadcrumbs-panel" header={header} />
          {showForm && (
            <FileManagerModal
              tenderAddendum={slug === TA_SLUG ? did : null}
              projectData={projectData}
              defaultTender={defaultTender}
              callback={callback}
            />
          )}
        </div>
      </Box>
      {children}
    </div>
  );
};

export default Page;
