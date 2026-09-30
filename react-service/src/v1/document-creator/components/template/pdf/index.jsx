import React from 'react';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { CONSTANTS } from 'clink-components';
import Viewer from './Viewer';
import DocumentBuilder from './DocumentBuilder';

const { white } = CONSTANTS.colors.general;

const ClinkPDF = ({
  vat,
  shortcodes = {},
  inputFocused = '',
  config = [],
  handleConfigChange = () => null,
  handleUpdateAttendance = () => null,
  handleLocalMiniBoq = () => null,
  handleUpdateVat = () => null,
  pdfViewerRef = null,
  inputRef = null,
  loadingSOA = false,
  heightDocument = 950,
  formValues = {},
  formFields = [],
}) => (
  <Viewer pdfViewerRef={pdfViewerRef} heightDocument={heightDocument}>
    <div>
      <Backdrop
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          color: white,
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={loadingSOA}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
    <DocumentBuilder
      vat={vat}
      inputFocused={inputFocused}
      inputRef={inputRef}
      shortcodes={shortcodes}
      config={config}
      handleConfigChange={handleConfigChange}
      handleUpdateAttendance={handleUpdateAttendance}
      handleLocalMiniBoq={handleLocalMiniBoq}
      handleUpdateVat={handleUpdateVat}
      formValues={formValues}
      formFields={formFields}
    />
  </Viewer>
);

export default ClinkPDF;
export { DocumentBuilder };
