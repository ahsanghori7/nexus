import React, { useEffect, useState } from 'react';
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
import Grid from '@mui/material/Grid';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import WarningIcon from '@mui/icons-material/Warning';
import i18next from 'i18next';
import { CircularProgress } from '@mui/material';
import { useDispatch } from 'react-redux';
import { getTrDocuments } from 'v2/store/reducers/clink/download-manager/asyncThunk';
import { useSnackbar } from 'v2/hooks/useSnackbar';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import ImageIcon from '@mui/icons-material/Image';
import { formatUKorAnzDateTime } from 'v2/helpers/date';
import { httpHelperV2 } from 'v2/services/httpHelper';

const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconProps = { fontSize: 'medium' };

    switch (extension) {
        case 'pdf':
            return <PictureAsPdfIcon {...iconProps} sx={{ color: 'error.main' }} />;
        case 'doc':
        case 'docx':
            return <DescriptionIcon {...iconProps} sx={{ color: 'primary.main' }} />;
        case 'xls':
        case 'xlsx':
            return <TableChartIcon {...iconProps} sx={{ color: 'success.main' }} />;
        case 'png':
        case 'jpg':
        case 'jpeg':
            return <ImageIcon {...iconProps} sx={{ color: 'warning.main' }} />;
        default:
            return <InsertDriveFileOutlinedIcon {...iconProps} />;
    }
};

const FilesTable = ({ files = [], onDownload, downloadingFileId, downloadErrors }) => (
    <Box>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{marginBottom: '15px'}}>
            {i18next.t('supporting-documents')}
        </Typography>
        <TableContainer>
            <Table size="small" sx={{ border: '1px solid grey.300' }}>
                <TableHead>
                    <TableRow sx={{
                        backgroundColor: 'grey.100 !important',
                        borderColor: 'grey.300',
                        '&.MuiTableRow-head': {
                            backgroundColor: 'grey.100 !important',
                            border: 1,
                            borderColor: 'grey.300',
                            overflow: 'hidden',
                            '& .MuiTableCell-root': {
                                borderColor: 'grey.300',
                                overflow: 'hidden',
                            }
                        }
                    }}>
                        <TableCell fontWeight="bold" color="text.secondary" width="60%" sx={{padding: '12px', backgroundColor: 'grey.100',border:0, borderRight: 'none'}}>
                            {i18next.t('file-name')}
                        </TableCell>
                        <TableCell
                            align="right"
                            fontWeight="bold"
                            color="text.secondary"
                            width="20%"
                            sx={{padding: '12px', backgroundColor: 'grey.100', border:0}}
                        >
                            {i18next.t('actions')}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody
                >
                    {files.map((file) => {
                        const hasError = downloadErrors?.[file.id];
                        return (
                            <TableRow key={file.id} sx={{ backgroundColor: 'white !important', borderBottom: '1px solid grey.200' }}>
                                <TableCell sx={{padding: '15px'}}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {getFileIcon(file?.name)}
                                        <Typography variant="body1" sx={{marginLeft: '15px'}}>{file?.name}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="right" sx={{padding: '15px'}}>
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
                                                    onClick={() => onDownload?.(file)}
                                                    disabled={downloadingFileId === file.id}
                                                >
                                                    {downloadingFileId === file.id ? <CircularProgress size={16} color="inherit" /> : <FileDownloadOutlinedIcon fontSize="small" />}
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    </Box>
);

const ProjectDetailsBox = ({ projectDetails }) => {
  if (!projectDetails) return null;

  const formattedDate = projectDetails.submission_date
    ? formatUKorAnzDateTime(projectDetails.submission_date)?.date
    : 'N/A';

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'grey.300',
        borderRadius: 1,
        p: 2,
        mb: 3,
        backgroundColor: 'grey.100',
      }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            {i18next.t('project')}:
          </Typography>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {projectDetails.project || 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            {i18next.t('package')}:
          </Typography>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {projectDetails.package || 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            {i18next.t('submitted-by')}:
          </Typography>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {projectDetails.submitted_by || 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            {i18next.t('submission-date')}:
          </Typography>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {formattedDate}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

const TenderRecommendationDocumentsListing = ({ trId, projectId, downloadZipFile}) => {
    const dispatch = useDispatch();
    const { showSnackbar } = useSnackbar();
    const [documents, setDocuments] = useState([]);
    const [projectDetails, setProjectDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [downloadingFileId, setDownloadingFileId] = useState(null);
    const [downloadErrors, setDownloadErrors] = useState({});

    const getTrDocumentsListing = async () => {
        try {
            const response = await dispatch(
                getTrDocuments({
                    project_id: projectId,
                    tr_id: trId,
                })
            ).unwrap();
            setDocuments(response?.documents || []);
            setProjectDetails(response?.project_details || null);
        } catch (error) {
            showSnackbar(error?.message || i18next.t('failed-to-load-documents'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (trId && projectId) {
            getTrDocumentsListing();
        }
    }, [trId, projectId]);

    const handleDownload = async (file) => {
        if (downloadingFileId === file?.id) return;

        try {
            setDownloadingFileId(file?.id);
            setDownloadErrors((prev) => ({ ...prev, [file?.id]: null }));

            const blob = await httpHelperV2({
                url: `project/${projectId}/tender_recommendation_attachment/download/${file?.id}`,
                method: 'GET',
                responseType: 'blob',
            });

            downloadZipFile(blob, file?.name);

            showSnackbar(i18next.t('file-downloaded-successfully', { filename: file?.name }), 'success');
        } catch (error) {
            setDownloadErrors((prev) => ({ ...prev, [file?.id]: true }));
            showSnackbar(i18next.t('unable-to-download-toast-msg', { filename: file?.name }), 'error');
        } finally {
            setDownloadingFileId(null);
        }
    };


    return (
        <Box>
            {
                isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <ProjectDetailsBox projectDetails={projectDetails} />
                        <FilesTable
                            files={documents}
                            onDownload={handleDownload}
                            downloadingFileId={downloadingFileId}
                            downloadErrors={downloadErrors}
                        />
                    </>
                )
            }
            {
                !isLoading && !documents?.length && (
                    <Typography variant="body1" color="text.primary" textAlign="center" mt={10}>
                        {i18next.t('no-documents-found')}
                    </Typography>
                )
            }
        </Box>
    );
};

export default TenderRecommendationDocumentsListing;
