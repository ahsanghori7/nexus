import moment from 'moment';
import isEmpty from 'lodash/isEmpty';
import { getDateValuesV1 } from 'v2/helpers/date';
import GlobalService from '../clink';
import GetAddressService from './GetAddress';
import PackageCollator from './package-collator';
import DocumentsService from '../documents';

import defaultConfig, { INITIAL_VALUES } from './config';
import Relay from '../Relay';

const FIRST_PAGE = 0;

class PlanMyProject extends GlobalService {
  constructor(region, constants, initialValues = {}, config = defaultConfig) {
    const filterInitialValues = {};
    let pid = null;
    let slug = null;
    let projectData = {};
    if (!isEmpty(initialValues)) {
      const {
        pid: initialPid,
        slug: initialSlug,
        projectData: initialProjectData,
        ...restInitialValues
      } = initialValues;
      pid = initialPid;
      slug = initialSlug;
      projectData = initialProjectData;
      const keyInitialValues = Object.keys(config.initialValues);
      keyInitialValues.forEach((keyValue) => {
        if (restInitialValues[keyValue]) {
          filterInitialValues[keyValue] = restInitialValues[keyValue];
        }
      });
    }
    const stepConfig = { ...config };
    stepConfig.initialValues = {
      ...stepConfig.initialValues,
      ...filterInitialValues,
    };

    super(stepConfig);
    this._totalFormFields = [...stepConfig.formFields];
    this._region = region;
    this._constants = constants;
    this._submitUrls = stepConfig.submitUrls;
    this._totalValidationSchema = [...stepConfig.validationSchema];
    this._currentStep = FIRST_PAGE;
    this._pid = pid;
    this._slug = slug;
    this._addressService = new GetAddressService();
    this._packageCollatorService = new PackageCollator(projectData);
    this._documentsService = new DocumentsService();

    this.setStepData = this.setStepData.bind(this);
    this.initializeHandleDropzone = this.initializeHandleDropzone.bind(this);
    this.initializeSelectData = this.initializeSelectData.bind(this);
    this.initializeDates = this.initializeDates.bind(this);
    this.setImageProjectId = this.setImageProjectId.bind(this);
    this.setDropzone = this.setDropzone.bind(this);
    this.handleDeleteCategory = this.handleDeleteCategory.bind(this);
    this.searchAddresses = this.searchAddresses.bind(this);
    this.handleMultiFormSubmit = this.handleMultiFormSubmit.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);

    this.initializeSelectData();
    this.initializeDates();
    this.setImageProjectId();
    this.initPackages();
  }

  setStepData(step) {
    this.currentStep = step;
    this.formFields = this.totalFormFields[step];
    this.validationSchema = this.totalValidationSchema[step];
  }

  get totalFormFields() {
    return this._totalFormFields;
  }

  set totalFormFields(totalFormFields) {
    this._totalFormFields = totalFormFields;
  }

  get totalValidationSchema() {
    return this._totalValidationSchema;
  }

  set totalValidationSchema(totalValidationSchema) {
    this._totalValidationSchema = totalValidationSchema;
  }

  get currentStep() {
    return this._currentStep;
  }

  set currentStep(currentStep) {
    this._currentStep = currentStep;
  }

  get region() {
    return this._region;
  }

  set region(region) {
    this._region = region;
  }

  get constants() {
    return this._constants;
  }

  set constants(constants) {
    this._constants = constants;
  }

  get submitUrls() {
    return this._submitUrls;
  }

  set submitUrls(submitUrls) {
    this._submitUrls = submitUrls;
  }

  get pid() {
    return this._pid;
  }

  set pid(pid) {
    this._pid = pid;
  }

  get slug() {
    return this._slug;
  }

  set slug(slug) {
    this._slug = slug;
  }

  get addressService() {
    return this._addressService;
  }

  set addressService(getAddressService) {
    this._addressService = getAddressService;
  }

  get packageCollatorService() {
    return this._packageCollatorService;
  }

  set packageCollatorService(packageCollatorService) {
    this._packageCollatorService = packageCollatorService;
  }

  get documentsService() {
    return this._documentsService;
  }

  set documentsService(documentsService) {
    this._documentsService = documentsService;
  }

  get tenderBuilderService() {
    return this._tenderBuilderService;
  }

  set tenderBuilderService(tenderBuilderService) {
    this._tenderBuilderService = tenderBuilderService;
  }

  initPackages() {
    if (!this.constants) {
      return;
    }

    const [firstPage, secondPage, thirdPage, ...restPages] =
      this.totalFormFields;
    const [packages] = thirdPage;

    const { packages: packagesConstant } = this.constants.pricing_document;
    const options = [
      { id: 'select-all', value: 'select-all', label: 'Select all' },
    ];
    packagesConstant.forEach((pack) => {
      const id = pack.toLowerCase().split(' ').join('-');
      options.push({
        id,
        value: id,
        label: pack,
      });
    });

    this.totalFormFields = [
      firstPage,
      secondPage,
      [
        {
          ...packages,
          options,
        },
      ],
      ...restPages,
    ];
  }

  async initializeHandleDropzone(categories = []) {
    const [firstPage, secondPage, thirdPage, fourthPage] = this.totalFormFields;
    const [documentFormData] = thirdPage;
    const addProjectInitialize = (documents, dropzoneValues, dropzoneData) => {
      this.initialValues = {
        ...this.initialValues,
        documents: dropzoneValues,
      };
      this.totalFormFields = [
        firstPage,
        secondPage,
        [
          {
            ...documents,
            values: dropzoneData,
            handleSetDropzone: this.setDropzone,
            handleDeleteCategory: this.handleDeleteCategory,
          },
        ],
        fourthPage,
      ];
    };
    return this.packageCollatorService.initializeHandleDropzone(
      categories,
      documentFormData,
      addProjectInitialize,
    );
  }

  async setDropzone(label, callback) {
    const setDropzoneResolve = (response, dropzoneLabel) => {
      if (response && response.success) {
        const [firstPage, secondPage, thirdPage] = this.totalFormFields;
        const [documents] = thirdPage;
        const categoryName = dropzoneLabel.toLowerCase().split(' ').join('-');
        const newCategory = {
          label: dropzoneLabel,
          name: categoryName,
          key: response.id,
        };
        this.totalFormFields = [
          firstPage,
          secondPage,
          [
            {
              ...documents,
              handleSetDropzone: this.setDropzone,
              values: [...documents.values, newCategory],
            },
          ],
        ];
        this.setStepData(this.currentStep);
      }
    };
    return this.packageCollatorService.setDropzone(
      label,
      callback,
      setDropzoneResolve,
    );
  }

  async handleDeleteCategory(categoryKey, callback) {
    const result =
      await this.packageCollatorService.deleteCategory(categoryKey);
    if (result.success) {
      const [firstPage, secondPage, thirdPage] = this.totalFormFields;
      const [documents] = thirdPage;
      this.totalFormFields = [
        firstPage,
        secondPage,
        [
          {
            ...documents,
            values: [...documents.values],
            handleSetDropzone: this.setDropzone,
            handleDeleteCategory: this.handleDeleteCategory,
          },
        ],
      ];
      this.setStepData(this.currentStep);
      if (typeof callback === 'function') callback();
    } else {
      this.packageCollatorService.alert(result);
    }
  }

  initializeSelectData() {
    if (!this.constants || !this.region) {
      return;
    }
    const [firstPage, secondPage, ...restPages] = this.totalFormFields;
    const [
      name,
      reference,
      startDate,
      completionDate,
      phase,
      region,
      type,
      ...restFirstPage
    ] = firstPage;
    const [
      manual,
      sitePostcode,
      address,
      address1,
      address2,
      city,
      postcode,
      employerLiabiltyInsurance,
      publicProductInsurance,
      ...restSecondPage
    ] = secondPage;

    const {
      phase: phaseConstant,
      type: projectTypes,
      insurances: projectInsurances,
    } = this.constants.project;
    const statusOptions = phaseConstant.map((phaseName, index) => ({
      value: index,
      label: phaseName,
    }));
    const regionOptions = this.region.map((regionObj) => ({
      ...regionObj,
      value: regionObj.id,
    }));
    const typeOptions = [];
    for (const [id, label] of Object.entries(projectTypes)) {
      typeOptions.push({ id, value: id, label });
    }
    const insurancesOptions = projectInsurances.map((insuranceName, index) => ({
      value: index,
      label: insuranceName,
    }));
    this.totalFormFields = [
      [
        name,
        reference,
        startDate,
        completionDate,
        {
          ...phase,
          options: statusOptions,
        },
        {
          ...region,
          options: regionOptions,
        },
        {
          ...type,
          options: typeOptions,
        },
        ...restFirstPage,
      ],
      [
        manual,
        sitePostcode,
        address,
        address1,
        address2,
        city,
        postcode,
        {
          ...employerLiabiltyInsurance,
          options: insurancesOptions,
        },
        {
          ...publicProductInsurance,
          options: insurancesOptions,
        },
        ...restSecondPage,
      ],
      ...restPages,
    ];
  }

  initializeDates() {
    const [firstPage, ...restPages] = this.totalFormFields;
    const { start: initialStart, end: initialEnd } = this.initialValues;
    const [name, reference, startDate, endDate, ...restFirstPage] = firstPage;

    const start = getDateValuesV1(initialStart);
    const end = getDateValuesV1(initialEnd);

    this.initialValues = { ...this.initialValues, start, end };

    this.totalFormFields = [
      [name, reference, { ...startDate }, { ...endDate }, ...restFirstPage],
      ...restPages,
    ];
  }

  setImageProjectId() {
    if (!this.pid) {
      return;
    }
    const [firstPage, ...restPages] = this.totalFormFields;
    const [
      name,
      reference,
      start,
      end,
      phase,
      region,
      type,
      description,
      projectImage,
    ] = firstPage;

    this.totalFormFields = [
      [
        name,
        reference,
        start,
        end,
        phase,
        region,
        type,
        description,
        {
          ...projectImage,
          cdn: this.pid,
        },
      ],
      ...restPages,
    ];
  }

  formatBody(activeStep, values) {
    const pageInputs = Object.keys(INITIAL_VALUES[activeStep]);
    const body = {};
    pageInputs.forEach((input) => {
      body[input] = values[input];
    });
    const { projectImage, gia, ...pageBody } = body;

    const formatStart =
      typeof pageBody.start === 'object'
        ? moment(pageBody.start).format('YYYY-MM-DD')
        : pageBody.start;

    const formatEnd =
      typeof pageBody.end === 'object'
        ? moment(pageBody.end).format('YYYY-MM-DD')
        : pageBody.end;

    let bodyToSend = {};
    switch (activeStep) {
      case 0:
        bodyToSend = {
          ...pageBody,
          description: pageBody.description.editorHtml,
          region: pageBody.region.value,
          phase: pageBody.phase.value,
          type: pageBody.type.value,
        };
        delete bodyToSend.start;
        delete bodyToSend.end;
        if (!isEmpty(formatStart)) {
          bodyToSend.start = formatStart;
        }
        if (!isEmpty(formatEnd)) {
          bodyToSend.end = formatEnd;
        }
        return {
          ...bodyToSend,
        };
      case 1: {
        let line1 = pageBody.address1;
        let line2 = pageBody.address2;
        let { city, postcode } = pageBody;
        if (!pageBody.manual) {
          line1 = pageBody.address.line_1;
          line2 = pageBody.address.line_2;
          city = pageBody.address.town_or_city;
          postcode = pageBody.sitePostcode;
        }
        bodyToSend = {
          site_address_one: line1,
          site_address_two: line2,
          site_address_city: city,
          site_address_postcode: postcode,
          employer_liabilty_insurance:
            pageBody.employer_liabilty_insurance.value,
          public_product_insurance: pageBody.public_product_insurance.value,
          gia,
        };

        return bodyToSend;
      }
      default:
        return body;
    }
  }

  validPostcode(postcode) {
    const regex = /^[A-Z]{1,2}[0-9]{1,2} ?[0-9][A-Z]{2}$/i;
    return regex.test(postcode.replace(/\s/g, ''));
  }

  async searchAddresses(event) {
    const { val } = event;
    const postcode = val.replace(/\s+/g, '');
    if (this.validPostcode(postcode)) {
      return this.addressService.asyncCall(postcode);
    }
    return [];
  }

  async handleFormSubmit(values, actions) {
    const [, update] = this.submitUrls;
    this.submitUrl = this.pid ? `${update}${this.pid}` : '';
    this.method = 'PATCH';
    const generalInfoBody = this.formatBody(0, values);
    const SiteDetailsBody = this.formatBody(1, values);
    const body = { ...generalInfoBody, ...SiteDetailsBody };

    return this.submit(body, actions).then((response) => {
      this.alert(response, null, {
        title: 'Project Updated',
        message: 'The project has been updated successfully',
        type: 'success',
      });
      if (values.projectImage) {
        const imageBody = {
          file: values.projectImage.files[0],
        };
        this.documentsService.submitFile(imageBody, null, this.pid);
      }
      return response;
    });
  }

  async handleMultiFormSubmit(
    values,
    actions,
    steps,
    activeStep,
    setActiveStep,
  ) {
    const isFirstPage = Number(activeStep) === Number(FIRST_PAGE);
    const [add, update, defaultTrades] = this.submitUrls;

    this.submitUrl = isFirstPage && !this.pid ? add : `${update}${this.pid}`;
    this.method = defaultConfig.method;
    const body = this.formatBody(activeStep, values);
    return this.submit(body, actions).then(async (response) => {
      if (
        response &&
        !response.error &&
        (response.success || response.status)
      ) {
        const nextPage = () => {
          setActiveStep(activeStep + 1);
          actions.setTouched({});
          actions.setSubmitting(false);
        };
        if (!this.pid) {
          const { name } = body;
          //  Set the initial values here if first time save of project
          //  in case users go back to site details
          Object.keys(values).forEach((k) => {
            this.initialValues[k] =
              k === 'start' || k === 'end'
                ? getDateValuesV1(values[k])
                : values[k];
          });
          this.initializeDates();
          this.initializeSelectData();

          this.pid = response.id;
          const slugService = new Relay('project', 'getSlugByName');
          return slugService
            .getJson({ name: encodeURIComponent(name) })
            .then((data) => {
              const { slug } = data;
              this._slug = slug;
            })
            .then(() => {
              this.packageCollatorService = new PackageCollator(response);
              return this.packageCollatorService
                .getCategories()
                .then(this.initializeHandleDropzone)
                .then(this.setImageProjectId);
            })
            .then(() => {
              if (isFirstPage && values.projectImage) {
                const imageBody = {
                  file: values.projectImage.files[0],
                };
                return this.documentsService.submitFile(
                  imageBody,
                  null,
                  this.pid,
                );
              }
              return true;
            })
            .then(() => {
              const params = new URLSearchParams(window.location.search);
              params.set('pid', this.pid);
              window.history.pushState(
                {},
                document.title,
                decodeURIComponent(`${window.location.pathname}?${params}`),
              );
              nextPage();
              return response;
            })
            .then(() => {
              const { type } = body;
              this.submitUrl = `${defaultTrades}${this.pid}`;
              this.method = 'POST';
              this.asyncCall({ type });
            });
          /* eslint no-else-return: "off" */
        } else {
          if (isFirstPage && values.projectImage) {
            const imageBody = {
              file: values.projectImage.files[0],
            };
            return this.documentsService
              .submitFile(imageBody, null, this.pid)
              .then(() => {
                nextPage();
                return response;
              });
          }
          nextPage();
          return response;
        }
      }

      if (!response || (response && !response.status)) {
        const optionsError = {
          title: 'Error',
          message: !response
            ? 'An error on the server occurred while submitting the project data.'
            : response.error,
          type: 'error',
        };
        this.alert({}, null, {}, optionsError);
      }
      return null;
    });
  }
}

export default PlanMyProject;
