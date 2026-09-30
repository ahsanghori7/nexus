import React, { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { CONSTANTS } from 'clink-components';
import DocumentsListing from './DocumentsListing';
import i18next from 'i18next';
import { getAccountLogo } from 'v2/helpers/user';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, CircularProgress } from '@mui/material';
import RescindedPage from './RescindedPage';
import InvalidPage from './InvalidPage';
import AccessStateWrapper from './AccessStateWrapper';
import { PHPAppClinkGloblals } from 'v2/helpers/php-globals';
import { useParams, useNavigate } from 'react-router';
import { getDocumentSnapshot } from 'v2/store/reducers/clink/download-manager/asyncThunk';
import Cookies from 'js-cookie';
import { useSnackbar } from 'v2/hooks/useSnackbar';
import CustomDocQueueUI from './CustomDocQueueUI';
import DocumentsListingPreview from './DocumentsListingPreview';
import AddendumDocumentsListing from './AddendumDocumentsListing';
import TenderRecommendationDocumentsListing from './TenderRecDocumentsListing';
import { httpHelperV2 } from 'v2/services/httpHelper';
import { handleUnauthorized } from 'v2/helpers/session';
import { useSearchParams } from 'react-router-dom';

const { white, clinkLightPurple } =
  CONSTANTS.colors.general;

const groupAddendumByNd = (docs) => {
  if (!docs || docs.length === 0) return [];
  const map = {};
  docs.forEach((doc) => {
    const nd = doc.nd || 'Other';
    if (!map[nd]) map[nd] = { name: nd, files: [] };
    map[nd].files.push({
      id: doc.id,
      download_id: doc.download_id,
      download_uri: doc.download_uri,
      name: doc.name,
      downloadable: doc.downloadable,
      rev_no: doc.rev_no,
      doc_ref: doc.doc_ref,
      source_type: doc.source_type,
    });
  });
  return Object.values(map);
};

const formatAddendumDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return value;
};

const ISSUED_AT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/;

const formatAddendumIssuedAt = (issuedAt) => {
  if (!issuedAt) {
    return '-';
  }
  const match = ISSUED_AT_PATTERN.exec(String(issuedAt));
  if (!match) {
    return '-';
  }
  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year}, ${hour}:${minute}`;
};

const mapAdditionalDocumentFolders = (additionalDocuments, { includeDownloadable = false } = {}) => {
  if (!additionalDocuments || Object.keys(additionalDocuments).length === 0) {
    return [];
  }

  return Object.values(additionalDocuments)
    .filter((folder) => folder.documents?.length > 0)
    .map((folder) => ({
      id: folder?.id,
      name: folder?.label,
      files: folder?.documents.map((doc) => {
        const file = {
          id: doc?.id,
          name: doc?.name,
          download_uri: doc?.download_uri,
          download_id: doc?.download_id,
        };
        if (includeDownloadable) {
          file.downloadable = doc?.downloadable !== false;
        }
        return file;
      }),
    }));
};

const pushAddendumSection = (projects, docs, nameKey, sectionType) => {
  if (!docs?.length) {
    return;
  }
  projects.push({
    name: i18next.t(nameKey),
    sectionType,
    folders: groupAddendumByNd(docs),
  });
};

const transformAddendumDocumentsData = (data) => {
  const {
    updated_documents,
    new_documents,
    withdrawn_documents,
    additional_documents,
    state,
  } = data;
  const projects = [];

  pushAddendumSection(projects, updated_documents, 'updated-documents', 'updated');
  pushAddendumSection(projects, new_documents, 'new-documents', 'new');
  pushAddendumSection(projects, withdrawn_documents, 'withdrawn-documents', 'withdrawn');

  const additionalFolders = mapAdditionalDocumentFolders(additional_documents, {
    includeDownloadable: true,
  });
  if (additionalFolders.length > 0) {
    projects.push({
      name: i18next.t('additional-documents'),
      sectionType: 'additional',
      folders: additionalFolders,
    });
  }

  return {
    projects,
    state,
    isAddendum: true,
    addendum: data.addendum ?? null,
  };
};

const transformDocumentsData = (data) => {
  if (!data) return [];

  if (data.is_addendum) {
    return transformAddendumDocumentsData(data);
  }

  const projects = [];
  const { project_documents, tender_package_documents, additional_documents, state } = data;

  if (project_documents && Object.keys(project_documents).length > 0) {
    const folders = Object.values(project_documents).map((folder) => ({
      id: folder?.id,
      name: folder?.label,
      files: (folder?.documents || []).map((doc) => ({
        id: doc?.id,
        name: doc?.name,
        download_uri: doc?.download_uri,
        download_id: doc?.download_id
      })),
    }));

    projects.push({
      name: i18next.t('project-specific-documents'),
      folders,
    });
  }

  if (tender_package_documents && tender_package_documents.documents?.length > 0) {
    projects.push({
      name: i18next.t('tender-package-documents'),
      folders: [
        {
          id: tender_package_documents?.id,
          name: tender_package_documents?.label,
          files: tender_package_documents?.documents.map((doc) => ({
            id: doc?.id,
            name: doc?.name,
            download_uri: doc?.download_uri,
            download_id: doc?.download_id
          })),
        },
      ],
    });
  }

  const additionalFolders = mapAdditionalDocumentFolders(additional_documents);
  if (additionalFolders.length > 0) {
    projects.push({
      name: i18next.t('additional-documents'),
      folders: additionalFolders,
    });
  }

  return { projects, state };
};

const downloadZipFile = async (blob, filename) => {
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};


const DownloadManager = () => {
  const config = PHPAppClinkGloblals();
  const { user } = useSelector((state) => state?.clinkAccount);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState(null);
  const [state, setState] = useState(null);
  const [isAddendum, setIsAddendum] = useState(false);
  const [addendumInfo, setAddendumInfo] = useState(null);

  const [avatar, setAvatar] = useState(null);
  const { showSnackbar } = useSnackbar();
  // --- NEW: Loading states for downloads ---
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isDownloadingAllTrDocs, setIsDownloadingAllTrDocs] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState(null); // tracks which single file is downloading
  const [downloadErrors, setDownloadErrors] = useState({}); // tracks download errors for each file
  const [searchParams] = useSearchParams();
    const projectId = searchParams.get("pid");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { documentId, context } = useParams();


  const getDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await dispatch(getDocumentSnapshot({ document_id: documentId, token: config?.token })).unwrap();
      const {
        projects,
        state: documentState,
        isAddendum: addendum,
        addendum: addendumMeta,
      } = transformDocumentsData(response);
      setDocuments(projects);
      setState(documentState);
      setIsAddendum(addendum || false);
      setAddendumInfo(addendumMeta ?? null);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setMessage(error?.message || i18next.t('failed-to-download-documents'));
    }
  }, [dispatch, documentId, config?.token]);

  // API call for retrieving the account logo
  useEffect(() => {
    const accountLogo = getAccountLogo(user?.account_id);
    setAvatar(accountLogo);
  }, [user?.account_id]);

  // API call for retrieving the document listing if config status is valid
  useEffect(() => {
    if (config?.status === 'valid' && documentId && context !== 'tender_recommendation_attachment') {
      getDocuments();
    }
  }, [config?.status, documentId, getDocuments]);



  const handleDownloadAll = async () => {
    if (isDownloadingAll) return;
    const token = Cookies.get(API.TOKEN_NAME);

    try {
      setIsDownloadingAll(true);
      const response = await fetch(`${API.RELAY_URL}document/${documentId}/snapshot/download-all`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config?.token ? config?.token : token}`,
        },
      });

      if (response.status === 401) { handleUnauthorized(); return; }
      if (!response.ok) throw new Error('Download failed');

      // Now headers are accessible
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.split('filename=')?.[1]?.trim() || `${documentId}.zip`;

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      showSnackbar(error?.message || i18next.t('failed-to-download-documents'), 'error');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const isSnapshotPreview = (projectName, accessState) =>
    projectName !== 'ADDITIONAL DOCUMENTS' && accessState === 'snapshot_preview';

  const getProjectCategory = (projectName) =>
    projectName === 'PROJECT SPECIFIC DOCUMENTS' ? 'project_documents' : 'tender_package_documents';

  const getDownloadFileId = (file, projectName, accessState) =>
    isSnapshotPreview(projectName, accessState) ? file?.download_id : file?.id;

  const handleDownload = async (file, folderLabel, projectName, accessState) => {
    const fileId = getDownloadFileId(file, projectName, accessState);
    if (downloadingFileId === fileId) return;

    try {
      setDownloadingFileId(fileId);
      setDownloadErrors((prev) => ({ ...prev, [fileId]: null }));
      let url = '';
      if (isSnapshotPreview(projectName, accessState)) {
        const category = file?.source_type || getProjectCategory(projectName);
        url = `${API.RELAY_URL}document/${documentId}/preview-mode/download?category=${category}&folder=${folderLabel}&file=${file?.download_id}`;
      } else {
        url = `${API.RELAY_URL}document/download/${file?.id}`;
      }
      const token = Cookies.get(API.TOKEN_NAME);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config?.token ? config?.token : token}`,
        },
      });

      if (response.status === 401) { handleUnauthorized(); return; }
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const downloadStatus = response.headers.get('X-Download-Status');

      if (downloadStatus === 'downloaded') {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = downloadUrl;
        link.download = file?.name || `document-${file?.id || file?.download_id}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        setDownloadErrors((prev) => ({ ...prev, [fileId]: true }));
        const displayName = folderLabel ? `${folderLabel} - ${file?.name}` : file?.name;
        showSnackbar(i18next.t('unable-to-download-toast-msg', { filename: displayName }), 'error');
      }
    } catch (error) {
      setDownloadErrors((prev) => ({ ...prev, [fileId]: true }));
      const displayName = folderLabel ? `${folderLabel} - ${file?.name}` : file?.name;
      showSnackbar(i18next.t('unable-to-download-toast-msg', { filename: displayName }), 'error');
    } finally {
      setDownloadingFileId(null);
    }
  };

  const getPageHeading = () => {
    switch (context) {
      case 'order':
        return i18next.t('document-downloads-title-order');
      case 'enquiry':
        return i18next.t('document-downloads-title-enquiry');
      case 'addendum':
        return i18next.t('document-downloads-title-addendum');
      case 'tender_recommendation_attachment':
        return i18next.t('document-downloads-title-tr');
      default:
        return i18next.t('document-downloads-title');
    }
  };

  const getPageDescription = () => {
    switch (context) {
      case 'order':
        return i18next.t('document-downloads-description-order');
      case 'enquiry':
        return i18next.t('document-downloads-description-enquiry');
      case 'addendum':
        return i18next.t('document-downloads-description-addendum');
      case 'tender_recommendation_attachment':
        return i18next.t('document-downloads-description-tr');
      default:
        return i18next.t('document-downloads-description');
    }
  };

  const renderDocumentsContent = () => {
    if (isLoading) {
      return <CustomDocQueueUI />;
    }
    if (isAddendum && documents?.length > 0) {
      return (
        <AddendumDocumentsListing
          projects={documents}
          onDownload={handleDownload}
          downloadingFileId={downloadingFileId}
          downloadErrors={downloadErrors}
          state={state}
        />
      );
    }
    if ((state === 'ready' || state === 'ready_partial') && documents?.length > 0) {
      return (
        <DocumentsListing
          projects={documents}
          onDownload={handleDownload}
          downloadingFileId={downloadingFileId}
          downloadErrors={downloadErrors}
        />
      );
    }
    if (state === 'snapshot_preview' && documents?.length > 0) {
      return (
        <DocumentsListingPreview
          projects={documents}
          onDownload={handleDownload}
          downloadingFileId={downloadingFileId}
          downloadErrors={downloadErrors}
          state={state}
        />
      );
    }
    return (
      <Typography data-testid="download-manager-empty-message" variant="body1" color="text.primary" textAlign="center" mt={10}>
        {message || i18next.t('no-documents-found')}
      </Typography>
    );
  };

  const renderAddendumMetadata = () => {
    if (!isAddendum || !addendumInfo) {
      return null;
    }

    const rows = [
      { key: 'label', label: i18next.t('addendum-label'), value: formatAddendumDisplayValue(addendumInfo.label) },
      { key: 'reference', label: i18next.t('addendum-reference'), value: formatAddendumDisplayValue(addendumInfo.reference) },
      { key: 'package_name', label: i18next.t('package_name'), value: formatAddendumDisplayValue(addendumInfo.package_name) },
      { key: 'issued_at', label: i18next.t('addendum-issued-at'), value: formatAddendumIssuedAt(addendumInfo.issued_at) },
    ];

    return (
      <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {rows.map(({ key, label, value }) => (
          <Typography key={key} variant="body2" color="text.secondary">
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {label}:
            </Box>{' '}
            {value}
          </Typography>
        ))}
      </Box>
    );
  };

  const renderMainContent = () => (
    <Container data-testid="download-manager-page" maxWidth="lg" className="download-manager-container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box>
          <Typography data-testid="download-manager-page-title" variant="h5" fontWeight="bold" color="text.primary" mb={0.5}>
            {getPageHeading()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getPageDescription()}
          </Typography>
          {renderAddendumMetadata()}
        </Box>
        {(state === 'ready' || state === 'ready_partial') && (
          <Button
            data-testid="download-manager-download-all-btn"
            variant="outlined"
            color="inherit"
            startIcon={
              isDownloadingAll
                ? <CircularProgress size={16} color="inherit" />
                : <FileDownloadOutlinedIcon />
            }
            onClick={handleDownloadAll}
            disabled={isDownloadingAll}
          >
            {isDownloadingAll ? i18next.t('downloading') : i18next.t('download-all-documents')}
          </Button>
        )}
      </Box>
      {renderDocumentsContent()}
    </Container>
  );

  const renderPageBody = () => {
    if (config?.status === 'invalid') {
      return (
        <AccessStateWrapper
          component={InvalidPage}
          ownerAccountName={config?.ownerAccountName}
        />
      );
    }
    if (config?.status === 'rescinded') {
      return (
        <AccessStateWrapper
          component={RescindedPage}
          ownerAccountName={config?.ownerAccountName}
        />
      );
    }
    return renderMainContent();
  };

  return (
    <>
      <Box
        sx={{
          background: white,
          border: `1px solid ${clinkLightPurple}`,
          p: 2,
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Avatar
          alt="Company Logo"
          src={avatar || ''}
          className='company-logo-ddm'
          sx={{
            width: '150px',
            borderRadius: 0
          }}

        />
        {
          context === 'tender_recommendation_attachment' && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,

                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.7,
                },
              }}
              onClick={() => navigate(-1)}
            >
              <ArrowBackIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {i18next.t('back-to-tender-recommendation')}
              </Typography>
            </Box>
          )
        }
      </Box>
      {renderPageBody()}
    </>
  );
};

export default DownloadManager;
