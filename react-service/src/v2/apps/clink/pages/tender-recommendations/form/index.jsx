import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Grid2 from '@mui/material/Grid2';
import ExecutiveSummary from './sections/ExecutiveSummary';
import SubcontractorDetails from './sections/SubcontractorDetails';
import ProjectInformation from './sections/ProjectInformation';
import StyledAccordion from './components/StyledAccordion';
import TenderRecommendationHeader from './components/TenderRecommendationHeader';
import i18next from 'v2/helpers/i18n';
import PackageInformation from './sections/PackageInformation';
import PricingSummary from './sections/PricingSummary';
import SummaryAndRecommendations from './sections/SummaryAndRecommendations';
import Attachments from './sections/Attachments';
import PdfDialog from 'v2/apps/clink/pages/tender-recommendations/PdfDialog';
import { connect } from 'react-redux';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { useParams } from 'react-router-dom';
import { httpHelperV2 } from 'v2/services/httpHelper';
import { useContext } from 'hooks/context';
import LogsModal from 'v2/apps/shared/components/logs-modal';
import TrRejectionFeedbackBanner from './components/TrRejectionFeedbackBanner';

const TenderRecommendationForm = ({
  contextType = 'clink',
  project,
  dispatch,
  tenderRecommendationForm,
  tenderRecommendationById,
  tenderRecommendations,
  pricingSummary,
  tenderRecommendationLogsData,
}) => {
  const context = useContext(contextType);
  const params = useParams();
  const { actions } = context;
  const pid = project?.data?.id;
  const { recommendationId } = params;
  const tender_recommendation_id =
    recommendationId ?? tenderRecommendationForm?.id;

  const [expanded, setExpanded] = useState({
    executive: false,
    subcontractor: false,
    project: false,
    package_information: false,
    pricing_summary: false,
    summary_and_recommendations: false,
    attachments: false,
  });
  const [recommendedSubcontractorId, setRecommendedSubcontractorId] = useState(null);

  const [openPdf, setOpenPdf] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isSaving, setIsSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [approvalRequestSent, setApprovalRequestSent] = useState(false);
  const [localForecasts, setLocalForecasts] = useState(null);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const TenderData = useMemo(() => {
    if (!tenderRecommendationById) return null;

    const dataId = tenderRecommendationById?.tender_recommendation_id;
    const currentId = parseInt(tender_recommendation_id, 10);
    return dataId === currentId ? tenderRecommendationById : null;
  }, [tenderRecommendationById, tender_recommendation_id]);

  const assignedApprovers = useMemo(() => {
    const trFromList = tenderRecommendations?.find(
      (tr) =>
        String(tr.tender_recommendation_id) ===
        String(tender_recommendation_id),
    );
    return trFromList?.assigned_approvers ?? [];
  }, [tenderRecommendations, tender_recommendation_id]);

  const fetchTenderRecommendationById = useCallback(async () => {
    if (pid && tender_recommendation_id) {
      dispatch(
        await actions.getTenderRecommendationById({
          project_id: pid,
          tid: tender_recommendation_id,
        }),
      );
    }
  }, [actions, dispatch, pid, tender_recommendation_id]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
  };

  const viewLogs = useCallback(() => {
    if (pid && tender_recommendation_id) {
      dispatch(
        actions.getAuditLogsTenderRecommendationById({
          project_id: pid,
          tender_recommendation_id,
        }),
      )
        .then(() => setLogsModalOpen(true))
        .catch((error) => {
          const errorMessage = error?.response?.data?.message;
          showSnackbar(errorMessage, 'error');
        });
    }
  }, [pid, tender_recommendation_id, dispatch, actions]);

  const handleRequestApproval = useCallback(
    ({ selectedApprovers }) => {
      if (pid && tender_recommendation_id) {
        return dispatch(
          actions.assignTenderRecommendationApprover({
            project_id: pid,
            tid: tender_recommendation_id,
            data: selectedApprovers,
          }),
        )
          .unwrap()
          .then(() => {
            fetchTenderRecommendationById();
          });
      }
      return undefined;
    },
    [
      actions,
      dispatch,
      pid,
      tender_recommendation_id,
      fetchTenderRecommendationById,
    ],
  );

  useEffect(() => {
    fetchTenderRecommendationById();
  }, [fetchTenderRecommendationById]);

  useEffect(() => {
    if (pid) {
      dispatch(actions.getTenderRecommendations({ project_id: pid }));
    }
  }, [actions, dispatch, pid]);

  useEffect(() => {
    const data = TenderData;
    const subcontractorId = data?.subcontractor?.id;
    setRecommendedSubcontractorId(subcontractorId);
    if (subcontractorId) {
      dispatch(
        actions.fetchBySubcontractorId({ subcontractor_id: subcontractorId }),
      );
    }
  }, [TenderData, dispatch, actions]);

  useEffect(() => {
    const data = TenderData;
    const subcontractorId = data?.subcontractor?.id;
    if (subcontractorId) {
      dispatch(actions.fetchTeamApi(pid));
    }
  }, [TenderData, pid, dispatch, actions]);

  useEffect(() => {
    const data = TenderData;
    const packageId = data?.package_id;
    if (packageId) {
      dispatch(
        actions.getTenderRecommendationPricingSummary({
          project_id: pid,
          package_id: packageId,
        }),
      );
    }
  }, [TenderData, actions, dispatch, pid]);

  const handleAccordionChange = (section) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleOpenPdf = async () => {
    if (!project?.data?.id || !tender_recommendation_id) return;
    setLoading(true);
    httpHelperV2({
      url: `project/${project?.data?.id}/tender_recommendation/${tender_recommendation_id}/report/generate`,
      method: 'POST',
    })
      .then((result) => {
        setPdfUrl(
          result?.url ? `${result.url}#toolbar=0&navpanes=0&scrollbar=0` : '',
        );
        setOpenPdf(true);
        setLoading(false);
      })
      .catch(() => {
        showSnackbar(
          i18next.t('no-tender-recommendations-report-exists'),
          'error',
        );
        setLoading(false);
      });
  };

  const handleAcknowledge = useCallback(async () => {
    setAcknowledging(true);
    try {
      await dispatch(
        actions.updateTenderRecommendationById({
          project_id: pid,
          tid: tender_recommendation_id,
          data: { status: 'Draft' },
        }),
      ).unwrap();
      fetchTenderRecommendationById();
      showSnackbar(i18next.t('rejection-acknowledged-success'), 'success');
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          i18next.t('rejection-acknowledged-error'),
        'error',
      );
    } finally {
      setAcknowledging(false);
    }
  }, [
    dispatch,
    actions,
    pid,
    tender_recommendation_id,
    fetchTenderRecommendationById,
  ]);

  const handleSaveAsDraft = async () => {
    if (!TenderData?.tender_recommendation_id) return;
    setIsSaving(true);
    try {
      const response = await dispatch(
        actions.saveAsDraftTenderRecommendationById({
          project_id: pid,
          tid: TenderData?.tender_recommendation_id,
          data: {
            exec_summary: TenderData?.exec_summary,
            subcontractor_user_id: TenderData?.subcontractor_user_id,
            final_comment: TenderData?.final_comment,
            forecasts:
              (localForecasts ?? pricingSummary)?.map((item) => ({
                transaction_id: item?.transaction_id,
                forecast: item?.forecast,
              })) || [],
          },
        }),
      );
      const message = response?.payload?.message;
      showSnackbar(message, 'success');
    } catch (error) {
      const errorMessage = error?.response?.data?.message;
      showSnackbar(errorMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Grid2 container spacing={0} sx={{ flexDirection: 'column' }}>
      <TenderRecommendationHeader
        setOpenPdf={handleOpenPdf}
        loading={loading}
        setOpenLogModal={viewLogs}
        saveDraft={handleSaveAsDraft}
        isSaving={isSaving}
        handleRequestApproval={handleRequestApproval}
        tenderData={TenderData}
        approvalRequestSent={approvalRequestSent}
        setApprovalRequestSent={setApprovalRequestSent}
      />
      <TrRejectionFeedbackBanner
        tenderData={TenderData}
        assignedApprovers={assignedApprovers}
        countryCode={project?.data?.country?.code}
        onAcknowledge={handleAcknowledge}
        acknowledging={acknowledging}
      />
      <Grid2 sx={{ px: 3 }}>
        <StyledAccordion
          data-testid="tr-accordion-executive"
          title={'1. ' + i18next.t('executive-summary')}
          expanded={expanded.executive}
          onChange={() => handleAccordionChange('executive')}
        >
          <ExecutiveSummary
            data={TenderData}
            projectId={pid}
            dispatch={dispatch}
            actions={actions}
            approvalRequestSent={approvalRequestSent}
          />
        </StyledAccordion>

        <StyledAccordion
          data-testid="tr-accordion-subcontractor"
          title={'2. ' + i18next.t('recommended-subcontractor-details')}
          expanded={expanded.subcontractor}
          onChange={() => handleAccordionChange('subcontractor')}
        >
          <SubcontractorDetails approvalRequestSent={approvalRequestSent} />
        </StyledAccordion>

        <StyledAccordion
          data-testid="tr-accordion-project"
          title={'3. ' + i18next.t('project-information')}
          expanded={expanded.project}
          onChange={() => handleAccordionChange('project')}
        >
          <ProjectInformation project={project} />
        </StyledAccordion>

        <StyledAccordion
          data-testid="tr-accordion-package"
          title={'4. ' + i18next.t('package-information')}
          expanded={expanded.package}
          onChange={() => handleAccordionChange('package_information')}
        >
          <PackageInformation />
        </StyledAccordion>

        <StyledAccordion
          data-testid="tr-accordion-pricing"
          title={'5. ' + i18next.t('pricing-summary')}
          expanded={expanded.package}
          onChange={() => handleAccordionChange('pricing_summary')}
        >
          <PricingSummary
            approvalRequestSent={approvalRequestSent}
            onForecastsChange={setLocalForecasts}
            recommendedSubcontractorId={recommendedSubcontractorId}
          />
        </StyledAccordion>

        <StyledAccordion
          data-testid="tr-accordion-summary"
          title={'6. ' + i18next.t('summary-and-recommendations')}
          expanded={expanded.package}
          onChange={() => handleAccordionChange('summary_and_recommendations')}
        >
          <SummaryAndRecommendations
            data={TenderData}
            projectId={pid}
            dispatch={dispatch}
            actions={actions}
            approvalRequestSent={approvalRequestSent}
          />
        </StyledAccordion>

        <StyledAccordion
          data-testid="tr-accordion-attachments"
          title={'7. ' + i18next.t('attachments')}
          expanded={expanded.attachments}
          onChange={() => handleAccordionChange('attachments')}
        >
          <Attachments
            data={TenderData}
            projectId={pid}
            dispatch={dispatch}
            actions={actions}
            approvalRequestSent={approvalRequestSent}
            showSnackbar={showSnackbar}
          />
        </StyledAccordion>
      </Grid2>

      <PdfDialog
        open={openPdf}
        onClose={() => setOpenPdf(false)}
        pdfUrl={pdfUrl}
        title={i18next.t('tender-recommendations-report')}
        projectId={project?.data?.id}
        recommendationId={tender_recommendation_id}
      />

      <LogsModal
        open={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        allLogs={tenderRecommendationLogsData?.logs || []}
        headerTitle={i18next.t('tender-recommendations-logs')}
        countryCode={project?.data?.country?.code}
        entity="TR"
        entity_no={tenderRecommendationLogsData?.entity_no}
        package_name={tenderRecommendationLogsData?.package_name}
      />
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={Boolean(snackbarMessage)}
        autoHideDuration={5000}
        onClose={() => setSnackbarMessage('')}
      >
        <MuiAlert
          onClose={() => setSnackbarMessage('')}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Grid2>
  );
};
const mapStateToProps = (state) => ({
  project: state.project,
  pricingSummary: state.tenderRecommendation.pricingSummary,
  tenderRecommendationById: state.tenderRecommendation.tenderRecommendationById,
  tenderRecommendationForm: state.tenderRecommendation.tenderRecommendationForm,
  tenderRecommendations: state.tenderRecommendation.recommendations,
  tenderRecommendationLogsData:
    state.tenderRecommendation.tenderRecommendationLogs,
});
export default connect(mapStateToProps)(TenderRecommendationForm);
