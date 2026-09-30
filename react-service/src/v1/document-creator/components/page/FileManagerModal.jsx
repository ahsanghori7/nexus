import React, { useState } from 'react';
import i18next from 'v2/helpers/i18n';
import Alert from '@mui/material/Alert';
import Grid2 from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import MuiButton from '@mui/material/Button';
import Button from 'react-bootstrap/Button';
import Sidemodal from '../../../global/components/modal/SideModal';
import OrangeFolderSvg from '../../../global/public/images/svg/orange-folder-icon.svg';
import ArchivedModal from '../../../file-manager/components/page/archived-modal';
import FileManager from '../../../file-manager/components/page';
import Tenders from '../../../file-manager/helpers/Tenders';

const OpenModalButton = ({ handleClick, testIdSuffix }) => {
  return (
    <Button
      data-testid={`open-file-manager-btn-${testIdSuffix}`}
      className="open-file-manager-side-modal"
      size="sm"
      variant="outline-warning"
      onClick={handleClick}
    >
      <OrangeFolderSvg />
    </Button>
  );
};

const NewFormModalButton = ({ handleClick, testIdSuffix }) => {
  return (
    <MuiButton data-testid={`open-appendix-btn-${testIdSuffix}`} color='success' variant="contained"  onClick={handleClick}>
      Open Appendix
    </MuiButton>
  );
};

const FileManagerModal = ({
  tenderAddendum,
  projectData,
  defaultTender = 0,
  callback = () => null,
  formConfig = false,
  buttonDesign = false,
  testIdSuffix = 'default',
}) => {
  let tenders = [];
  let archived = false;
  if (projectData) {
    tenders = projectData.tender;
    archived = projectData.archived;
  }
  const tender = Tenders.getTender(tenders, defaultTender);

  const [label, setLabel] = useState(defaultTender ? tender?.label : '');
  const [archivedProject, setArchivedProject] = useState(false);

  if (!tender) {
    return null;
  }

  // eslint-disable-next-line react/no-unstable-nested-components
  const HeaderButton = ({ handleClick }) => (
    <OpenModalButton
      testIdSuffix={testIdSuffix}
      handleClick={
        archived
          ? () => {
            setArchivedProject(archived);
          }
          : handleClick
      }
    />
  );

  // eslint-disable-next-line react/no-unstable-nested-components
  const FormButton = ({ handleClick }) => (
    <Alert severity="warning" sx={{ alignItems: 'center' }}>
      <Grid2 container sx={{ alignItems: 'center' }}>
        <Grid2>
          <Typography>
            {i18next.t('file-manager-warning')}{' '}
          </Typography>
        </Grid2>
        <Grid2>
          <MuiButton data-testid={`file-manager-open-btn-${testIdSuffix}`} variant="text" onClick={handleClick}>
            click here.
          </MuiButton>
        </Grid2>
      </Grid2>
    </Alert>
  );

  // eslint-disable-next-line react/no-unstable-nested-components
  const AppendixButton = ({ handleClick }) => (
    <NewFormModalButton handleClick={handleClick} testIdSuffix={testIdSuffix} />
  );

  let OpenButton = formConfig ? FormButton : HeaderButton;

  if (buttonDesign) {
    OpenButton = AppendixButton;
  }

  const showAllFilesSidemodal = (value) => {
    setLabel(value ? 'All Files' : tender.label);
  };

  return (
    <>
      <Sidemodal
        testId={`file-manager-modal-${testIdSuffix}`}
        title={buttonDesign ? "Appendix" : "File Manager"}
        subtitle={label}
        ShowButton={OpenButton}
        className="file-manager-sidemodal sidemodal"
        render={() => {
          return (
            <FileManager
              sidemodal
              tenderAddendum={tenderAddendum}
              projectData={projectData}
              defaultTender={defaultTender}
              showAllFilesSidemodal={showAllFilesSidemodal}
              callback={callback}
            />
          );
        }}
      />
      {archivedProject && (
        <ArchivedModal
          project={projectData}
          onHide={() => setArchivedProject(false)}
          sidemodal
        />
      )}
    </>
  );
};
export default FileManagerModal;
