import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { getUrl } from 'v2/helpers/url';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import EnquiryList from './list';
import SendDocumentModal from 'v2/apps/shared/components/send-document-modal';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { useContext } from 'hooks/context';
import { CONSTANTS } from 'clink-components';
import { useNavigate } from 'react-router-dom';

const { clinkGreen, clinkRed, white } = CONSTANTS.colors.general;

const EnquiryIssued = ({ project, contextType = 'clink' }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const context = useContext(contextType);
  const { actions } = context;
  const {
    status,
    projectEnquiries,
    data: projectData,
  } = useSelector((state) => state.project);

  const [assets, setAssets] = useState([]);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loading = status === 'loading' || !assetsLoaded;
  const error = status === 'error';

  useEffect(() => {
    if (project?.id) {
      dispatch(actions.fetchProjectEnquiries({ pid: project.id }));
    }
  }, [dispatch, actions, project?.id]);

  useEffect(() => {
    let isActive = true;

    const fetchAssets = async () => {
      try {
        const result = await dispatch(
          actions.fetchTemplates({ type: 'tenders' }),
        );
        if (isActive && result?.payload) {
          setAssets(result.payload);
          setAssetsLoaded(true);
        }
      } catch (err) {
        console.error('Error fetching assets:', err);
      }
    };

    if (project?.id) {
      fetchAssets();
    }

    return () => {
      isActive = false;
    };
  }, [project?.id, dispatch, actions]);

  const createTenderTemplate = useCallback(
    async (pid, tid, did) => {
      try {
        const result = await dispatch(
          actions.createTenderTemplate({ pid, tid, did }),
        );

        if (result?.payload?.success && result?.payload?.docId) {
          navigate(
            `/document-creator/template/${result.payload.docId}/tender/${tid}`,
          );
          // Refresh enquiries after creating template
          dispatch(actions.fetchProjectEnquiries({ pid: project.id }));
        }
      } catch (err) {
        console.error('Error creating template:', err);
      }
    },
    [dispatch, actions, navigate, project?.id],
  );

  const handleTemplateDelete = useCallback(() => {
    // Refresh enquiries after deleting a template
    if (project?.id) {
      dispatch(actions.fetchProjectEnquiries({ pid: project.id }));
    }
  }, [dispatch, actions, project?.id]);

  const handleEnquirySent = useCallback(() => {
    // Refresh enquiries after sending
    if (project?.id) {
      dispatch(actions.fetchProjectEnquiries({ pid: project.id }));
    }
  }, [dispatch, actions, project?.id]);

  const filteredWorkPackages = useMemo(() => {
    if (!projectEnquiries?.tenders) return {};

    if (!searchQuery) {
      return projectEnquiries.tenders;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = {};

    Object.entries(projectEnquiries.tenders).forEach(([wpId, workPackage]) => {
      const filteredTemplates = Object.values(
        workPackage.templates || {},
      ).filter((template) => {
        let companyDisplay = '';
        if (
          template.sent_to_subcontractors &&
          template.sent_to_subcontractors !== '-'
        ) {
          if (Array.isArray(template.sent_to_subcontractors)) {
            companyDisplay = template.sent_to_subcontractors
              .map((sub) => sub.name)
              .join(', ');
          } else {
            companyDisplay = template.sent_to_subcontractors;
          }
        }
        return companyDisplay.toLowerCase().includes(lowerCaseQuery);
      });

      if (filteredTemplates.length > 0) {
        filtered[wpId] = {
          ...workPackage,
          templates: filteredTemplates.reduce((acc, template) => {
            acc[template.id] = template;
            return acc;
          }, {}),
        };
      }
    });
    return filtered;
  }, [projectEnquiries?.tenders, searchQuery]);

  return (
    <Box
      id="clink-container"
      sx={{
        flex: 1,
      }}
    >
      <>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: white,
            p: '1.2rem 1.4rem',
            mb: 0,
            borderTopRightRadius: '0.5rem',
            borderTopLeftRadius: '0.5rem',
            borderBottom: 'none',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <TextField
            variant="outlined"
            size="small"
            placeholder={t('search-by-company')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, minWidth: 250 }}
          />

          <Button
            component="a"
            href={getUrl('CLINK_APP_HOST', `/reports/tender/${project.id}`)}
            download
            sx={{
              cursor: 'pointer',
              backgroundColor: clinkGreen,
              color: white,
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
              fontSize: '16px',
              padding: '4px 10px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: clinkRed,
                color: white,
              },
            }}
          >
            {t('download-tender-report')}
          </Button>
        </Box>
      </>

      {loading && <CircularProgress className="loading-status" />}
      {error && <Alert severity="error">{t('error-fetching-quotes')}</Alert>}

      <Box
        sx={{
          width: '100%',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          backgroundColor: white,
        }}
      >
        <EnquiryList
          items={filteredWorkPackages}
          projectData={projectData}
          assets={assets}
          createTemplate={createTenderTemplate}
          onTemplateDelete={handleTemplateDelete}
          searchQuery={searchQuery}
        />
      </Box>

      {/* Send Document Modal - Opens when setOpenContactsModal is triggered */}
      <SendDocumentModal callback={handleEnquirySent} isUnifiedPage />
    </Box>
  );
};

export default EnquiryIssued;
