import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import Grid2 from '@mui/material/Grid2';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const MainContractStructure = ({ constants, useUpdateProject = {} }) => {
  const {
    usePrincipalContractor: [principalContractor, setPrincipalContractor],
    useNoticeCommenceWorks: [noticeCommenceWorks, setNoticeCommenceWorks],
    useCommentPeriodSubcontractorDrawings: [
      commentPeriodSubcontractorDrawings,
      setCommentPeriodSubcontractorDrawings,
    ],
    useSubContractBaseDate: [subContractBaseDate, setSubContractBaseDate],
    useSectionalCompletion: [sectionalCompletion, setSectionalCompletion],
    useRetentionReleaseDate: [retentionReleaseDate, setRetentionReleaseDate],
    usePrimeCostAdditionMaterials: [
      primeCostAdditionMaterials,
      setPrimeCostAdditionMaterials,
    ],
    usePrimeCostAdditionPlant: [
      primeCostAdditionPlant,
      setPrimeCostAdditionPlant,
    ],
    useNomineeDisputes: [nomineeDisputes, setNomineeDisputes],
    useMainContractSignedDate: [
      mainContractSignedDate,
      setMainContractSignedDate,
    ],
    useRectificationDefectsPeriod: [
      rectificationDefectsPeriod,
      setRectificationDefectsPeriod,
    ],
    useRetention: [retention, setRetention],
    useEmployerAgent: [employerAgent, setEmployerAgent],
    usePrincipalDesigner: [principalDesigner, setPrincipalDesigner],
    useFormContractMain: [formContractMain, setFormContractMain],
    useEditionOfJCT: [editionOfJCT, setEditionOfJCT],
    useScheduleOfAmendments: [scheduleOfAmendments, setScheduleOfAmendments],
  } = useUpdateProject;

  const subcontractordrawingsArray = useMemo(() => {
    return Object.entries(
      constants?.project?.comment_period_subcontractor_drawings || {},
    ).map(([key, value]) => ({
      id: key,
      label: value,
    }));
  }, [constants?.project?.comment_period_subcontractor_drawings]);

  const sectionalCompletionApplyArray = useMemo(() => {
    return Object.entries(
      constants?.project?.does_sectional_completion_apply || {},
    ).map(([key, value]) => ({
      id: key,
      label: value,
    }));
  }, [constants?.project?.does_sectional_completion_apply]);

  const commenceWorkSiteArray = useMemo(() => {
    return Object.entries(
      constants?.project?.notice_period_commence_work_on_site || {},
    ).map(([key, value]) => ({
      id: key,
      label: value,
    }));
  }, [constants?.project?.notice_period_commence_work_on_site]);

  const additionMaterialsArray = useMemo(() => {
    return Object.entries(
      constants?.project?.prime_cost_addition_for_materials || {},
    ).map(([key, value]) => ({
      id: key,
      label: value,
    }));
  }, [constants?.project?.prime_cost_addition_for_materials]);

  const additionPlantArray = useMemo(() => {
    return Object.entries(
      constants?.project?.prime_cost_addition_for_plant || {},
    ).map(([key, value]) => ({
      id: key,
      label: value,
    }));
  }, [constants?.project?.prime_cost_addition_for_plant]);

  const defectsPeriodArray = useMemo(() => {
    return Object.entries(
      constants?.project?.rectification_defects_period || {},
    ).map(([key, value]) => ({
      id: key,
      label: value,
    }));
  }, [constants?.project?.rectification_defects_period]);

  const retentionReleaseDateArray = useMemo(() => {
    return Object.entries(constants?.project?.retention_release_date || {}).map(
      ([key, value]) => ({
        id: key,
        label: value,
      }),
    );
  }, [constants?.project?.retention_release_date]);

  const retentionArray = useMemo(() => {
    return Object.entries(constants?.project?.retention || {}).map(
      ([key, value]) => ({
        id: key,
        label: value,
      }),
    );
  }, [constants?.project?.retention]);

  return (
    <Grid2
      size={{ xs: 12, md: 4 }}
      sx={{ width: '100% !important' }}
      container
      flexDirection="column"
    >
      <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.75}>
        <Typography sx={{ fontWeight: 600 }}>
          {i18next.t('main-contract-structure')}
        </Typography>
      </Grid2>
      <Grid2 p={1.75} container spacing={2}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'main-contract-principal-contractor-input',
              },
            }}
            label={i18next.t('principal-contractor')}
            variant="outlined"
            fullWidth
            value={principalContractor}
            onChange={(e) => setPrincipalContractor(e.target.value)}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'main-contract-principal-designer-input',
              },
            }}
            label={i18next.t('principal-designer')}
            variant="outlined"
            fullWidth
            value={principalDesigner}
            onChange={(e) => setPrincipalDesigner(e.target.value)}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'main-contract-employer-agent-input',
              },
            }}
            label={i18next.t('employer-agent')}
            variant="outlined"
            fullWidth
            value={employerAgent}
            onChange={(e) => setEmployerAgent(e.target.value)}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'main-contract-form-contract-main-input',
              },
            }}
            label={i18next.t('form-contract-main')}
            variant="outlined"
            fullWidth
            value={formContractMain}
            onChange={(e) => setFormContractMain(e.target.value)}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              format="DD/MM/YYYY"
              label={i18next.t('main-contract-signed-date')}
              onChange={(e) =>
                setMainContractSignedDate(e.format('YYYY-MM-DD'))
              }
              value={
                mainContractSignedDate ? dayjs(mainContractSignedDate) : null
              }
              slotProps={{
                textField: {
                  inputProps: {
                    'data-testid': 'main-contract-signed-date-input',
                  },
                },
              }}
            />
          </LocalizationProvider>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              format="DD/MM/YYYY"
              label={i18next.t('subcontract-base-date')}
              onChange={(e) => setSubContractBaseDate(e.format('YYYY-MM-DD'))}
              value={subContractBaseDate ? dayjs(subContractBaseDate) : null}
              slotProps={{
                textField: {
                  inputProps: {
                    'data-testid': 'main-contract-subcontract-base-date-input',
                  },
                },
              }}
            />
          </LocalizationProvider>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'main-contract-notice-commence-works-select',
              },
              select: {
                'data-testid':
                  'main-contract-notice-commence-works-select-dropdown',
              },
            }}
            label={i18next.t('notice-period-commence-works-on-site')}
            fullWidth
            select
            variant="outlined"
            value={noticeCommenceWorks}
            onChange={(e) => setNoticeCommenceWorks(e.target.value)}
          >
            {commenceWorkSiteArray.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'main-contract-comment-period-drawings-select',
              },
              select: {
                'data-testid':
                  'main-contract-comment-period-drawings-select-dropdown',
              },
            }}
            label={i18next.t('comment-period-subcontractor-drawings')}
            fullWidth
            select
            variant="outlined"
            value={commentPeriodSubcontractorDrawings}
            onChange={(e) =>
              setCommentPeriodSubcontractorDrawings(e.target.value)
            }
          >
            {subcontractordrawingsArray.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'main-contract-sectional-completion-select',
              },
              select: {
                'data-testid':
                  'main-contract-sectional-completion-select-dropdown',
              },
            }}
            label={i18next.t('sectional-completion')}
            fullWidth
            select
            variant="outlined"
            value={sectionalCompletion}
            onChange={(e) => setSectionalCompletion(e.target.value)}
          >
            {sectionalCompletionApplyArray.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'main-contract-retention-release-date-select',
              },
              select: {
                'data-testid':
                  'main-contract-retention-release-date-select-dropdown',
              },
            }}
            label={i18next.t('retention-release-date')}
            fullWidth
            select
            variant="outlined"
            value={retentionReleaseDate}
            onChange={(e) => setRetentionReleaseDate(e.target.value)}
          >
            {retentionReleaseDateArray.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid':
                  'main-contract-rectification-defects-period-select',
              },
              select: {
                'data-testid':
                  'main-contract-rectification-defects-period-select-dropdown',
              },
            }}
            label={i18next.t('rectification-defects-period')}
            fullWidth
            select
            variant="outlined"
            value={rectificationDefectsPeriod}
            onChange={(e) => setRectificationDefectsPeriod(e.target.value)}
          >
            {defectsPeriodArray.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: { 'data-testid': 'main-contract-retention-select' },
              select: {
                'data-testid': 'main-contract-retention-select-dropdown',
              },
            }}
            label={i18next.t('retention')}
            fullWidth
            select
            variant="outlined"
            value={retention}
            onChange={(e) => setRetention(e.target.value)}
          >
            {retentionArray.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'main-contract-prime-cost-materials-select',
              },
              select: {
                'data-testid':
                  'main-contract-prime-cost-materials-select-dropdown',
              },
            }}
            label={i18next.t('prime-cost-addition-materials')}
            fullWidth
            select
            variant="outlined"
            value={primeCostAdditionMaterials}
            onChange={(e) => setPrimeCostAdditionMaterials(e.target.value)}
          >
            {additionMaterialsArray.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'main-contract-prime-cost-plant-select',
              },
              select: {
                'data-testid': 'main-contract-prime-cost-plant-select-dropdown',
              },
            }}
            label={i18next.t('prime-cost-addition-plant')}
            fullWidth
            select
            variant="outlined"
            value={primeCostAdditionPlant}
            onChange={(e) => setPrimeCostAdditionPlant(e.target.value)}
          >
            {additionPlantArray.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'main-contract-nominee-disputes-input',
              },
            }}
            label={i18next.t('nominee-disputes')}
            variant="outlined"
            fullWidth
            value={nomineeDisputes}
            onChange={(e) => setNomineeDisputes(e.target.value)}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'main-contract-edition-of-jct-input',
              },
            }}
            label={i18next.t('edition-of-jct-contract')}
            variant="outlined"
            fullWidth
            value={editionOfJCT}
            onChange={(e) => setEditionOfJCT(e.target.value)}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'main-contract-schedule-of-amendments-input',
              },
            }}
            label={i18next.t('schedule-of-amendments')}
            variant="outlined"
            fullWidth
            value={scheduleOfAmendments}
            onChange={(e) => setScheduleOfAmendments(e.target.value)}
            placeholder={i18next.t('schedule-of-amendments-eg')}
          />
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

const mapStateToProps = (state) => {
  return {
    constants: state.constants,
  };
};

export default connect(mapStateToProps)(MainContractStructure);
