import React, { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import { white } from 'v2/constants/colors';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import Sidemodal from 'v1/global/components/modal/SideModal';
import FileManager from 'v1/file-manager/components/page';
import { connect, useDispatch } from 'react-redux';
import { useContext } from 'v2/hooks/context';
import DeleteAttachmentDialog from '../components/DeleteAttachmentDialog';
import { formatUKorAnzDateTime } from 'v2/helpers/date';
import ArticleIcon from '@mui/icons-material/Article';

const { lightPeriwinkle, clinkGreen } = CONSTANTS.colors.general;

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const DropzoneBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${lightPeriwinkle}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(4),
  textAlign: 'center',
  backgroundColor: theme.palette.background.paper,
  transition: 'border-color 0.3s, background-color 0.3s',
  cursor: 'pointer',
  '&:hover': {
    borderColor: clinkGreen,
    backgroundColor: theme.palette.action.hover,
  },
  '&.drag-over': {
    borderColor: clinkGreen,
    backgroundColor: theme.palette.action.selected,
  },
}));

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

const Attachments = ({
  data,
  projectId,
  project,
  showSnackbar,
  contextType = 'clink',
}) => {
  const [attachments, setAttachments] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileManagerModalRef = useRef(null);
  const dispatch = useDispatch();
  const context = useContext(contextType);
  const { actions } = context;
  const isDisabled = data?.status === 'Pending';

  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'];
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes

  const getAttachments = ()=>{
    dispatch(
        actions.getTenderRecommendationAttachments({
          project_id: projectId,
          trid: data?.tender_recommendation_id,
          tid: data?.package_id,
        }),
      )
        .unwrap()
        .then((response) => {
          if (response) {
            setAttachments(response);
          }
        })
        .catch((error) => {
          console.error('Failed to fetch attachments:', error);
        });
  }

  useEffect(() => {
    // Fetch attachments when component mounts
    if (projectId && data?.tender_recommendation_id) {
      getAttachments();
    }
  }, [projectId, data?.tender_recommendation_id, dispatch, actions]);

  // Validation helper functions
  const validateFileType = (file) => {
    const extension = `.${file.name.split('.').pop().toLowerCase()}`;
    return ALLOWED_EXTENSIONS.includes(extension);
  };

  const validateFileSize = (file) => {
    return file.size <= MAX_FILE_SIZE;
  };

  const handleFileSelect = useCallback(
    async (files) => {
      if (isDisabled || !files.length) return;

      const filesArray = Array.from(files);
      const validFiles = [];
      const invalidFiles = [];

      // Validate each file
      filesArray.forEach((file) => {
        const isValidType = validateFileType(file);
        const isValidSize = validateFileSize(file);

        if (!isValidType) {
          invalidFiles.push({ file, reason: 'format' });
        } else if (!isValidSize) {
          invalidFiles.push({ file, reason: 'size' });
        } else {
          validFiles.push(file);
        }
      });

      // Show error messages for invalid files
      if (invalidFiles.length > 0) {
        const formatErrors = invalidFiles.filter((f) => f.reason === 'format');
        const sizeErrors = invalidFiles.filter((f) => f.reason === 'size');

        if (formatErrors.length > 0) {
          const fileNames = formatErrors.map((f) => f.file.name).join(', ');
          showSnackbar(
            i18next.t('invalid-file-format', { files: fileNames }),
            'error',
          );
        }

        if (sizeErrors.length > 0) {
          const fileNames = sizeErrors.map((f) => f.file.name).join(', ');
          showSnackbar(
            i18next.t('file-size-exceeded', { files: fileNames }),
            'error',
          );
        }
      }

      // If no valid files, stop here
      if (validFiles.length === 0) return;

      setUploading(true);

      // Prepare FormData for upload
      const formData = new FormData();

      // Append files
      validFiles.forEach((file) => {
        formData.append('file[]', file);
      });

      try {
        const response = await dispatch(
          actions.uploadTenderRecommendationAttachments({
            project_id: projectId,
            tid: data?.package_id,
            trid: data?.tender_recommendation_id,
            formData,
          }),
        ).unwrap();

        // Refresh attachments list after successful upload
        getAttachments();

        showSnackbar(
          i18next.t('files-uploaded-successfully', { count: validFiles.length }),
          'success',
        );
      } catch (error) {
        showSnackbar(
          error?.message || i18next.t('failed-to-upload-files'),
          'error',
        );
      } finally {
        setUploading(false);
      }
    },
    [isDisabled, projectId, data?.tender_recommendation_id, dispatch, actions, showSnackbar],
  );

  const handleUploadClick = (event) => {
    if (event.target.files) {
      handleFileSelect(event.target.files);
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    }
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDisabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    if (!isDisabled && event.dataTransfer.files) {
      handleFileSelect(event.dataTransfer.files);
    }
  };

  const handleDeleteClick = useCallback((attachmentId) => {
    setAttachmentToDelete(attachmentId);
    setDeleteDialogOpen(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setAttachmentToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(
    async () => {
      if (!attachmentToDelete) return;

      try {
        setDeleting(true);
        await dispatch(
          actions.deleteTenderRecommendationAttachment({
            project_id: projectId,
            tid: data?.package_id,
            trid: data?.tender_recommendation_id,
            attachment_id: attachmentToDelete,
          }),
        ).unwrap();

        // Remove from local state after successful deletion
        setAttachments((prev) =>
          prev.filter((attachment) => attachment.id !== attachmentToDelete),
        );

        showSnackbar(i18next.t('attachment-deleted-successfully'), 'success');
        setDeleteDialogOpen(false);
        setAttachmentToDelete(null);
      } catch (error) {
        showSnackbar(
          error?.message || i18next.t('failed-to-delete-attachment'),
          'error',
        );
      } finally {
        setDeleting(false);
      }
    },
    [attachmentToDelete, projectId, data?.tender_recommendation_id, dispatch, actions, showSnackbar],
  );

  const handleAddFromExisting = () => {
    // Trigger the File Manager modal
    if (fileManagerModalRef.current) {
      fileManagerModalRef.current.click();
    }
  };

  return (
    <Box sx={{ px: 3, pb: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {i18next.t('attach-supporting-documents-description')}
      </Typography>

      <DropzoneBox
        data-testid="tr-attachments-dropzone"
        className={isDragOver ? 'drag-over' : ''}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isDisabled && document.getElementById('file-upload-input')?.click()}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: 'action.active', mb: 1 }} />
        <Typography variant="body1" sx={{ mb: 0.5 }}>
          {i18next.t('drag-and-drop-files')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {i18next.t('supported-file-formats')}
        </Typography>
        <VisuallyHiddenInput
          id="file-upload-input"
          type="file"
          multiple
          disabled={isDisabled}
          onChange={handleUploadClick}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        />
      </DropzoneBox>

      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button
          data-testid="tr-upload-btn"
          variant="contained"
          startIcon={<FileUploadOutlinedIcon sx={{ fontSize: 18 }} />}
          component="label"
          disabled={isDisabled || uploading}
          sx={{
            backgroundColor: clinkGreen,
            color: white,
          }}
        >
          {uploading ? i18next.t('uploading') : i18next.t('upload-document')}
          <VisuallyHiddenInput
            type="file"
            multiple
            disabled={isDisabled}
            onChange={handleUploadClick}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          />
        </Button>

        <Button
          data-testid="tr-add-from-existing-btn"
          variant="outlined"
          startIcon={<FolderOpenIcon sx={{ fontSize: 18 }} />}
          onClick={handleAddFromExisting}
          disabled={isDisabled}
          sx={{
            borderColor: clinkGreen,
            color: clinkGreen
          }}
        >
          {i18next.t('add-from-existing-files')}
        </Button>
      </Box>

      {attachments.length > 0 ? (
        <Box data-testid="tr-attachments-list" sx={{ mt: 3 , border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              px: 2,
              py: 2,
              borderBottom: '1px solid',
              borderColor: 'grey.300',
              backgroundColor: 'grey.100',
              fontWeight: 600,
            }}
          >
            {i18next.t('attached-documents-count', { count: attachments.length })}
          </Typography>


            {attachments.map((attachment) => (
              <Box
                key={attachment.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'grey.300',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                  <Box sx={{ mr: 1.5, mt: 0.25 }}>
                    {getFileIcon(attachment.name)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 0.25,
                      }}
                    >
                      {attachment.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        display: 'block',
                      }}
                    >
                      {attachment.file_type} • {attachment.file_size} •{' '}
                      {i18next.t('uploaded-by-on', {name: `${attachment.uploaded_by}`, date: formatUKorAnzDateTime(attachment.created_at)?.date})}
                    </Typography>
                  </Box>
                </Box>

                {!isDisabled && (
                  <IconButton
                    data-testid={`tr-attachment-delete-${attachment.id}`}
                    size="small"
                    onClick={() => handleDeleteClick(attachment.id)}
                    sx={{
                      ml: 2,
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'text.primary',
                      },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}

        </Box>
      ): (
        <Box sx={{ mt: 5 }} display="flex" alignItems="center" gap={1} justifyContent="center" flexDirection="column">
          <ArticleIcon sx={{ fontSize: 40, color: 'text.secondary'}} />
          <Typography variant="body1" color="text.secondary">
            {i18next.t('no-supporting-documents-attached')}
          </Typography>
        </Box>
       )}

      {/* Hidden File Manager Modal */}
      {project?.data && (
        <Sidemodal
          title="File Manager"
          subtitle={data?.package_name || ''}
          ShowButton={({ handleClick }) => (
            <button
              ref={fileManagerModalRef}
              onClick={handleClick}
              style={{ display: 'none' }}
              type="button"
              aria-label="Open File Manager"
            />
          )}
          className="file-manager-sidemodal sidemodal"
          render={(modalInstance) => {
            return (
              <FileManager
                sidemodal
                projectData={project.data}
                defaultTender={data?.package_id || 0}
                showAllFilesSidemodal={() => {}}
                callback={() => {
                  getAttachments();
                }}
                trAttachments
                trAttachmentsData={{
                  tid: data?.package_id,
                  trid: data?.tender_recommendation_id,
                }}
                closeSidemodal={() => modalInstance.setShow(false)}
                showSnackbar={showSnackbar}
              />
            );
          }}
        />
      )}

      <DeleteAttachmentDialog
        open={deleteDialogOpen}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </Box>
  );
};

const mapStateToProps = (state) => ({
  project: state.project,
});

export default connect(mapStateToProps)(Attachments);
