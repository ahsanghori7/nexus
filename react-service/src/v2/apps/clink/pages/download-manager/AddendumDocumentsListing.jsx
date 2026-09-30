import React, { useState } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { CONSTANTS } from 'clink-components';
import i18next from 'i18next';
import { CircularProgress } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

const { clinkLightPurple, white } = CONSTANTS.colors.general;

const AddendumFilesTable = ({
  files = [],
  onDownload,
  downloadingFileId,
  downloadErrors,
  folderLabel,
  sectionType,
  state,
  projectName,
}) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow sx={{ backgroundColor: 'transparent !important' }}>
          <TableCell fontWeight="bold" color="text.primary" width="60%">
            {i18next.t('file-name')}
          </TableCell>
          <TableCell align="right" fontWeight="bold" color="text.primary" width="20%">
            {i18next.t('actions')}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody
        sx={{
          '& .MuiTableRow-root:nth-of-type(even)': {
            backgroundColor: white,
          },
        }}
      >
        {files.map((file, idx) => {
          const isWithdrawn = sectionType === 'withdrawn';
          const fileKey = file.id ?? file.download_id ?? idx;
          const hasError = downloadErrors?.[file.id || file.download_id];
          const showDownload = !isWithdrawn && file.downloadable !== false;
          const isDownloading =
            downloadingFileId !== null &&
            (downloadingFileId === file.id || downloadingFileId === file.download_id);

          return (
            <TableRow key={fileKey} sx={{ backgroundColor: white }}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InsertDriveFileOutlinedIcon
                    sx={{ fontSize: 18, color: isWithdrawn ? 'text.disabled' : 'inherit' }}
                  />
                  <Typography
                    variant="body2"
                    sx={isWithdrawn ? { textDecoration: 'line-through', color: 'text.disabled' } : {}}
                  >
                    {file.name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="right">
                {showDownload && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                    {hasError && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <WarningIcon fontSize="small" color="error" />
                        <Typography variant="body2" color="error">
                          {i18next.t('unable-to-download')}
                        </Typography>
                      </Box>
                    )}
                    <Tooltip title={i18next.t('download')}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onDownload?.(file, folderLabel, projectName, state)}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <FileDownloadOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

const AddendumFolderAccordion = ({
  folder,
  sectionType,
  initialExpanded = false,
  onDownload,
  downloadingFileId,
  downloadErrors,
  state,
  projectName,
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const fileCount = folder.files?.length || 0;

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded((prev) => !prev)}
      sx={{
        boxShadow: 'none',
        border: `1px solid ${clinkLightPurple}`,
        '&:before': { display: 'none' },
        '&.Mui-expanded': { margin: 0 },
        backgroundColor: 'transparent',
        marginTop: 2,
      }}
    >
      <AccordionSummary
        expandIcon={<ChevronRightIcon />}
        sx={{
          gap: 1,
          '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
            transform: 'rotate(90deg)',
          },
          '& .MuiAccordionSummary-content': {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            my: 1.5,
          },
          backgroundColor: white,
        }}
      >
        <Typography variant="body1" fontWeight="bold" color="text.primary">
          {folder.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {fileCount} {fileCount === 1 ? i18next.t('file') : i18next.t('files')}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0, borderTop: `1px solid ${clinkLightPurple}` }}>
        <AddendumFilesTable
          files={folder.files || []}
          onDownload={onDownload}
          downloadingFileId={downloadingFileId}
          downloadErrors={downloadErrors}
          folderLabel={folder.name}
          sectionType={sectionType}
          state={state}
          projectName={projectName}
        />
      </AccordionDetails>
    </Accordion>
  );
};

const AddendumDocumentsListing = ({
  projects = [],
  onDownload,
  downloadingFileId,
  downloadErrors,
  state,
}) => (
  <Box data-testid="addendum-documents-listing">
    {projects.map((project, projectIndex) => (
      <Box
        key={project.sectionType || projectIndex}
        data-testid={`addendum-section-${project.sectionType}`}
        sx={{ mb: 3 }}
      >
        <Typography variant="body1" fontWeight="bold" color="text.primary" mb={2}>
          {project.name}
        </Typography>
        <Box>
          {project.folders?.map((folder, index) => (
            <AddendumFolderAccordion
              key={folder.name || index}
              folder={folder}
              sectionType={project.sectionType}
              initialExpanded={index === 0}
              onDownload={onDownload}
              downloadingFileId={downloadingFileId}
              downloadErrors={downloadErrors}
              state={state}
              projectName={project.name}
            />
          ))}
        </Box>
      </Box>
    ))}
  </Box>
);

export default AddendumDocumentsListing;
