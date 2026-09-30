import React, { useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useFormikContext } from 'formik';
import { getSortedSizeServices } from '../../../helpers/data';
import GlobalService, { getConfig, ValidationSchemes } from '../../clink';
import getTenderBuilderForm from '../config/tender-builder/Form';
import i18next from 'i18next';
import * as Yup from 'yup';
import TENDER_BUILDER_FORM from '../config/tender-builder/Form';

const Aux = ({
  tenderStartDate,
  accountMilestones,
  packageMilestones,
  projectVersion,
  onMilestonesChange,
  ...props
}) => {
  const [open, setOpen] = React.useState(false);
  const { values, setFieldValue } = useFormikContext();
  const showConfigureLeadTimes =
    projectVersion === 2 && accountMilestones?.length > 0;

  const handleSaveMilestones = useCallback(
    (milestonesPayload) => {
      setFieldValue('milestones', milestonesPayload);
      if (onMilestonesChange) {
        onMilestonesChange({ fieldName: 'milestones', val: milestonesPayload });
      }
    },
    [setFieldValue, onMilestonesChange],
  );

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
        <tenderStartDate.Aux {...props} />
        {showConfigureLeadTimes && (
          <Typography
            variant="body2"
            sx={{
              color: 'primary.main',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            onClick={() => setOpen(true)}
          >
            <IconButton size="small" color="primary" sx={{ p: 0, mr: 0.5 }}>
              <AccessTimeIcon fontSize="small" />
            </IconButton>
            {i18next.t('configure-lead-times')}
          </Typography>
        )}
      </Box>
      {showConfigureLeadTimes && tenderStartDate.Modal && (
        <tenderStartDate.Modal
          open={open}
          setOpen={setOpen}
          packageName={values.packageName}
          startOnSiteDate={values.tenderStartDate}
          accountMilestones={accountMilestones}
          packageMilestones={packageMilestones}
          onSave={handleSaveMilestones}
        />
      )}
    </>
  );
};

const getDefaultConfig = (project) => {
  const TENDER_BUILDER_FORM = getTenderBuilderForm(project);
  return getConfig({
    initialValues: TENDER_BUILDER_FORM.INITIAL_VALUES,
    formFields: TENDER_BUILDER_FORM.FORM_FIELDS,
    validationSchema: TENDER_BUILDER_FORM.VALIDATION_SCHEMA,
    method: 'GET',
    key: 'tender-form',
  });
};

class TenderForm extends GlobalService {
  constructor(serviceData = null, config = null) {
    const { project } = serviceData || {};
    super(config || getDefaultConfig(project));
    const {
      pid = 0,
      tid = 0,
      constants,
      formData,
      callback,
      selectedTenders,
      init,
      currentDependencies,
      milestones,
      hasAsiteFoldersFeature = false,
    } = serviceData;
    this._tid = tid;
    this._pid = pid;
    this._milestones = milestones || {};
    this._projectVersion = project?.data?.version;
    this.key = `${this.key}-${tid}`;
    this.setNewInitialValues = this.setNewInitialValues.bind(this);
    this.setFormOptions = this.setFormOptions.bind(this);

    this.setNewInitialValues(formData, constants);
    this.setFormOptions(
      constants,
      callback,
      selectedTenders,
      init,
      currentDependencies,
      hasAsiteFoldersFeature,
    );
  }

  get tid() {
    return this._tid;
  }

  set tid(tid) {
    this._tid = tid;
  }

  get pid() {
    return this._pid;
  }

  set pid(pid) {
    this._pid = pid;
  }

  setNewInitialValues(formData, constants) {
    const {
      label,
      reference_no: referenceNo,
      tender_return: tenderReturn,
      start_on_site: startDate,
      size,
      service,
      provider_folder,
    } = formData;
    const { tender } = constants;
    const { size: sizeOptionsData, service: serviceOptionsData } = tender;
    let tenderStartDate = startDate
      ? new Date(startDate.split('-').reverse().join('-'))
      : startDate;
    tenderStartDate = tenderStartDate || '';
    let tenderReturnDate = tenderReturn
      ? new Date(tenderReturn.split('-').reverse().join('-'))
      : tenderReturn;
    tenderReturnDate = tenderReturnDate || '';
    // Normalize provider_folder value so SelectField can display it.
    // Backend might return it as string; our select expects an object with `label`.
    let normalizedProviderFolder = provider_folder || null;
    if (Array.isArray(normalizedProviderFolder)) {
      normalizedProviderFolder = normalizedProviderFolder[0] || null;
    }
    if (
      normalizedProviderFolder &&
      typeof normalizedProviderFolder === 'string'
    ) {
      normalizedProviderFolder = {
        id: normalizedProviderFolder,
        value: normalizedProviderFolder,
        label: normalizedProviderFolder,
        name: normalizedProviderFolder,
      };
    } else if (normalizedProviderFolder && normalizedProviderFolder.name) {
      normalizedProviderFolder = {
        ...normalizedProviderFolder,
        label: normalizedProviderFolder.label || normalizedProviderFolder.name,
      };
    }

    this.initialValues = {
      packageName: label,
      referenceNo: referenceNo || '',
      provider_folder: normalizedProviderFolder,
      tenderReturnDate,
      tenderStartDate,
      tenderService: {
        id: service,
        value: service,
        label: serviceOptionsData[service],
      },
      tenderSize: {
        id: size,
        value: size,
        label: sizeOptionsData[size],
      },
    };
  }

  /* eslint guard-for-in: "off" */
  setFormOptions(
    constants,
    callback,
    selectedTenders,
    init,
    currentDependencies,
    hasAsiteFoldersFeature,
  ) {
    const { tender } = constants;
    const { size: sizeOptionsData, service: serviceOptionsData } = tender;
    const sizeOptions = getSortedSizeServices(sizeOptionsData);
    const serviceOptions = [];
    for (const serviceOptionsId in serviceOptionsData) {
      serviceOptions.push({
        id: serviceOptionsId,
        value: serviceOptionsId,
        label: serviceOptionsData[serviceOptionsId],
      });
    }

    const { formFields } = this;
    const packageName = formFields.find((f) => f.key === 'packageName');
    const referenceNo = formFields.find((f) => f.key === 'referenceNo');
    const providerFolder = formFields.find((f) => f.key === 'provider_folder');
    const tenderReturnDate = formFields.find(
      (f) => f.key === 'tenderReturnDate',
    );
    const tenderStartDate = formFields.find((f) => f.key === 'tenderStartDate');
    const tenderService = formFields.find((f) => f.key === 'tenderService');
    const tenderSize = formFields.find((f) => f.key === 'tenderSize');

    tenderService.options = serviceOptions;
    tenderSize.options = sizeOptions;

    const isProviderFolderFromAPI = this.initialValues.provider_folder !== null;
    const TENDER_RETURN = 1;
    const START_ON_SITE = 2;
    this.formFields = [
      { ...packageName, callback },
      ...(referenceNo ? [{ ...referenceNo, callback }] : []),
      {
        ...tenderReturnDate,
        FormModal: (props) => (
          <tenderReturnDate.FormModal
            {...props}
            pid={this.pid}
            tid={this.tid}
            selectedTenders={selectedTenders}
            date={TENDER_RETURN}
            init={init}
            currentDependencies={currentDependencies}
          />
        ),
        Aux: (props) => (
          <tenderReturnDate.Aux
            {...props}
            tid={this.tid}
            date={TENDER_RETURN}
            currentDependencies={currentDependencies}
            selectedTenders={selectedTenders}
          />
        ),
        callback,
      },
      {
        ...tenderStartDate,
        FormModal: (props) => (
          <tenderStartDate.FormModal
            {...props}
            pid={this.pid}
            tid={this.tid}
            selectedTenders={selectedTenders}
            date={START_ON_SITE}
            init={init}
            currentDependencies={currentDependencies}
          />
        ),
        Aux: (props) => (
          <Aux
            {...props}
            tenderStartDate={tenderStartDate}
            tid={this.tid}
            date={START_ON_SITE}
            currentDependencies={currentDependencies}
            selectedTenders={selectedTenders}
            accountMilestones={this._milestones?.account_milestones}
            packageMilestones={this._milestones?.package_milestones?.[this.tid]}
            projectVersion={this._projectVersion}
            onMilestonesChange={callback}
          />
        ),
        callback,
      },
      { ...tenderService, callback },
      { ...tenderSize, callback },
      ...(hasAsiteFoldersFeature
        ? [
            {
              ...providerFolder,
              callback,
              isDisabled: isProviderFolderFromAPI,
              hasAsiteFolders: true,
            },
          ]
        : []),
    ];

    const baseValidationSchema = {
      packageName: ValidationSchemes.basicText,
      tenderReturnDate: ValidationSchemes.basicDate,
      tenderStartDate: ValidationSchemes.basicDate,
      tenderService: ValidationSchemes.select,
      tenderSize: ValidationSchemes.select,
    };

    this.validationSchema = Yup.object().shape({
      ...baseValidationSchema,
      ...(hasAsiteFoldersFeature
        ? {
            provider_folder: Yup.object()
              .nullable()
              .required(`${i18next.t('select-asite-folder-error')}`)
              .test(
                'is-not-null',
                `${i18next.t('select-asite-folder-error')}`,
                (value) => value !== null && value.label,
              )
              .shape({
                label: Yup.string().required(
                  `${i18next.t('select-asite-folder-error')}`,
                ),
              }),
          }
        : {}),
    });

    this.baseValidationSchema = baseValidationSchema;
    this.hasAsiteFoldersFeature = hasAsiteFoldersFeature;
  }

  updateValidationForEmptyFolders() {
    this.validationSchema = Yup.object().shape({
      ...this.baseValidationSchema,
      ...(this.hasAsiteFoldersFeature
        ? {
            provider_folder: Yup.object().nullable(),
          }
        : {}),
    });
  }
}

export default TenderForm;
