import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useContext } from 'hooks/context';
import SimpleAccordion from 'v2/apps/clink/pages/shared/Accordion';
import WorkPackageTemplates from './WorkPackageTemplates';
import TemplateModal from 'v2/apps/clink/pages/tender-templates/dialog';

const TENDER_PUBLISHED_STATE = 2;
const TENDER_DRAFT_STATE = 1;

const canShowTender = (state) =>
  [TENDER_PUBLISHED_STATE, TENDER_DRAFT_STATE].includes(state);

const EnquiryList = ({
  items,
  projectData,
  assets,
  createTemplate,
  onTemplateDelete,
  searchQuery = '',
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { showSnackbar } = useContext();
  const { actions } = useContext('clink');
  const [modalOpen, setModalOpen] = useState(false);
  const [approversData, setApproversData] = useState({});

  useEffect(() => {
    const fetchAssignedApprovers = async () => {
      try {
        const result = await dispatch(
          actions.assignedApproversTenderInquiry({
            project_id: projectData?.id,
          }),
        );
        setApproversData(result?.payload || {});
      } catch (err) {
        showSnackbar(err?.message || t('error-fetching-approvers'), 'error');
      }
    };

    if (projectData?.id) {
      fetchAssignedApprovers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, actions, projectData?.id]);

  // Convert items object to array
  const workPackagesArray = Object.entries(items || {}).map(
    ([id, workPackage]) => {
      // Extract all logs from all templates within the work package
      // Each template has its own history array
      let allLogs = [];

      if (workPackage.templates) {
        allLogs = Object.values(workPackage.templates)
          .filter(
            (template) => template.history && Array.isArray(template.history),
          )
          .flatMap((template) => template.history || []);
      }

      return {
        id,
        ...workPackage,
        logs: allLogs,
      };
    },
  );

  // Filter work packages based on search query
  const filteredWorkPackages = workPackagesArray.filter((workPackage) => {
    if (!searchQuery || searchQuery.trim() === '') return true;

    const query = searchQuery.toLowerCase().trim();

    // Check if any template in the work package has a matching company
    if (workPackage.templates) {
      return Object.values(workPackage.templates).some((template) => {
        const subcontractors = template.sent_to_subcontractors;

        // Handle array of subcontractors
        if (Array.isArray(subcontractors)) {
          return subcontractors.some((sub) =>
            sub.name?.toLowerCase().includes(query),
          );
        }

        // Handle string subcontractor
        if (typeof subcontractors === 'string' && subcontractors !== '-') {
          return subcontractors.toLowerCase().includes(query);
        }

        return false;
      });
    }

    return false;
  });

  return (
    <Box sx={{ width: '100%', p: 1 }}>
      {!filteredWorkPackages.length ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <p>
            {searchQuery ? t('no-results-found') : t('no-templates-available')}
          </p>
        </Box>
      ) : (
        filteredWorkPackages.map((workPackage) => {
          // Filter templates based on search query
          let filteredTemplates = workPackage.templates;

          if (searchQuery && searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            filteredTemplates = Object.entries(
              workPackage.templates || {},
            ).reduce((acc, [key, template]) => {
              const subcontractors = template.sent_to_subcontractors;
              let shouldInclude = false;

              // Handle array of subcontractors
              if (Array.isArray(subcontractors)) {
                shouldInclude = subcontractors.some((sub) =>
                  sub?.name?.toLowerCase().includes(query),
                );
              }
              // Handle string subcontractor
              else if (
                typeof subcontractors === 'string' &&
                subcontractors !== '-'
              ) {
                shouldInclude = subcontractors?.toLowerCase().includes(query);
              }

              if (shouldInclude) {
                acc[key] = template;
              }
              return acc;
            }, {});
          }

          return (
            <SimpleAccordion
              key={workPackage.id}
              title={workPackage.label || t('untitled-work-package')}
              id={`work-package-${workPackage.id}`}
            >
              <WorkPackageTemplates
                templates={filteredTemplates}
                pid={projectData?.id}
                tid={workPackage.id}
                onTemplateDelete={onTemplateDelete}
                templateLogs={workPackage.logs || []}
                searchQuery={searchQuery}
                approversData={approversData}
              />
            </SimpleAccordion>
          );
        })
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 2,
          mb: 2,
          position: 'relative',
        }}
      >
        <TemplateModal
          pid={projectData?.id}
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          tenders={
            projectData?.tender?.filter((x) =>
              canShowTender(Number(x.state)),
            ) || []
          }
          assets={assets}
          createTemplate={createTemplate}
          styles={{ position: 'fixed', bottom: '25px', right: '90px' }}
        />
      </Box>
    </Box>
  );
};

export default EnquiryList;
