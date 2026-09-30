import React from 'react';
import i18next from 'v2/helpers/i18n';
import isNaN from 'lodash/isNaN';
import isNil from 'lodash/isNil';
import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import moment from 'moment';
import Button from '@mui/material/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { components } from 'react-select';
import GlobalService from 'v1/global/services/clink';
import { getDateValuesV1 } from 'v2/helpers/date';
import Relay from 'v1/global/services/Relay';
import { dateSubstract, getTextFromHTML } from 'v1/global/helpers/data';
import Config from 'v1/document-creator/helpers/config';
import {
  DATE_FORMAT,
  DATE_FORMAT_PLACEHOLDER,
} from 'v1/global/helpers/constants';
import defaultConfig from './config';
import asyncCallMapping, {
  sow as sowConfig,
  nd as ndConfig,
} from './asyncCallMapping';

const WHITE_BG = 'white-bg';
const GRAY_BG = 'gray-bg';

const CustomContentDatePicker = ({ name, onChange, message = '' }) => (
  <Button onClick={() => onChange(name, message)}>{message}</Button>
);

class Template extends GlobalService {
  constructor(
    params = {},
    handleFormValuesUpdate = () => null,
    handleInputFocused = () => null,
    handleUpdateMeta = () => null,
    handleUpdateNumberDocument = () => null,
    handleUpdateTableTotal = () => null,
    openWitnessModal = () => null,
    openErrorModal = () => null,
    config = defaultConfig,
  ) {
    super(config);
    this.buildForm = this.buildForm.bind(this);
    this.getInput = this.getInput.bind(this);
    this.checkChangeGroup = this.checkChangeGroup.bind(this);
    this.getInputWrapper = this.getInputWrapper.bind(this);
    this.saveData = this.saveData.bind(this);
    this.saveMultipleData = this.saveMultipleData.bind(this);
    this.initAsyncValue = this.initAsyncValue.bind(this);
    this.getFormPercentage = this.getFormPercentage.bind(this);
    this.formatValues = this.formatValues.bind(this);
    this.formatBlurValues = this.formatBlurValues.bind(this);
    this._slug = '';
    this._mapping = {};
    this._moneyInputs = [];
    this._params = params;
    this._asyncInputs = {};
    this._observerInputs = [];
    this._sourceData = [];
    this._handleFormValuesUpdate = handleFormValuesUpdate;
    this._handleInputFocused = handleInputFocused;
    this._handleUpdateMeta = handleUpdateMeta;
    this._handleUpdateNumberDocument = handleUpdateNumberDocument;
    this._handleUpdateTableTotal = handleUpdateTableTotal;
    this._openWitnessModal = openWitnessModal;
    this._openErrorModal = openErrorModal;
    this._handlePostSave = () => null;
    this._signatureFields = {};
    this._mainSubcontractor = false;
  }

  set mainSubcontractor(mainSubcontractor) {
    this._mainSubcontractor = mainSubcontractor;
  }

  get mainSubcontractor() {
    return this._mainSubcontractor;
  }

  set signatureFields(signatureFields) {
    this._signatureFields = signatureFields;
  }

  get signatureFields() {
    return this._signatureFields;
  }

  get validationSchema() {
    return this._validationSchema;
  }

  get slug() {
    return this._slug;
  }

  set slug(slug) {
    this._slug = slug;
  }

  get mapping() {
    return this._mapping;
  }

  set mapping(mapping) {
    this._mapping = mapping;
  }

  get moneyInputs() {
    return this._moneyInputs;
  }

  set moneyInputs(moneyInputs) {
    this._moneyInputs = moneyInputs;
  }

  get params() {
    return this._params;
  }

  set params(params) {
    this._params = params;
  }

  get asyncInputs() {
    return this._asyncInputs;
  }

  set asyncInputs(asyncInputs) {
    this._asyncInputs = asyncInputs;
  }

  get observerInputs() {
    return this._observerInputs;
  }

  set observerInputs(observerInputs) {
    this._observerInputs = observerInputs;
  }

  get sourceData() {
    return this._sourceData;
  }

  set sourceData(sourceData) {
    this._sourceData = sourceData;
  }

  get handleFormValuesUpdate() {
    return this._handleFormValuesUpdate;
  }

  get handleInputFocused() {
    return this._handleInputFocused;
  }

  get handleUpdateMeta() {
    return this._handleUpdateMeta;
  }

  get handleUpdateNumberDocument() {
    return this._handleUpdateNumberDocument;
  }

  get handleUpdateTableTotal() {
    return this._handleUpdateTableTotal;
  }

  get openWitnessModal() {
    return this._openWitnessModal;
  }

  get openErrorModal() {
    return this._openErrorModal;
  }

  get handlePostSave() {
    return this._handlePostSave;
  }

  set handlePostSave(handlePostSave) {
    this._handlePostSave = handlePostSave;
  }

  buildForm(formConfig = [], meta = {}, hasBoq = false, projectData = {}) {
    const newConfig = [];
    if (formConfig.length) {
      formConfig.forEach((flatFormConfig, index) => {
        for (const inputKey in flatFormConfig) {
          if (!flatFormConfig[inputKey]) {
            continue;
          }
          const { code, type, observer, source, value, options, dataref } =
            flatFormConfig[inputKey];
          if (!code || !type) {
            continue;
          }
          const inputName = this.getInputNameFromCode(code);
          this.mapping = {
            ...this.mapping,
            [inputName]: {
              inputKey,
              type,
            },
          };

          if (observer) {
            const { listeners, method, type: typeObserver } = observer;
            const listenerInputNames = listeners.map((listener) =>
              flatFormConfig[listener] && flatFormConfig[listener].code
                ? this.getInputNameFromCode(flatFormConfig[listener].code)
                : '',
            );
            this.observerInputs = [
              ...this.observerInputs,
              ...listeners.map((listener) => {
                if (flatFormConfig[listener]) {
                  const { code: codeObserver } = flatFormConfig[listener];
                  return {
                    method,
                    listeners: listenerInputNames,
                    inputName: this.getInputNameFromCode(codeObserver),
                    inputObserver: inputName,
                    type: typeObserver,
                  };
                }
                return {};
              }),
            ];
          }

          if (source) {
            this.sourceData = [
              ...this.sourceData,
              { inputKey, inputName, source, value, type, options },
            ];
            if (
              dataref &&
              (dataref === 'docusign.contractor' ||
                dataref === 'docusign.subcontractor')
            ) {
              const { disableBy } = source;
              this.signatureFields = {
                ...this.signatureFields,
                [inputName]: disableBy,
              };
              if (dataref === 'docusign.subcontractor' && type === 'select') {
                this.mainSubcontractor = inputName;
              }
            }
          }

          const className = flatFormConfig[inputKey].className || '';
          newConfig.push({
            ...flatFormConfig[inputKey],
            dbKey: inputKey,
            className: `${className} ${index % 2 === 0 ? GRAY_BG : WHITE_BG}`,
          });
        }
      });
    }
    this.formFields = newConfig.map((input, index) => {
      let newInput = { ...input };
      if (index !== 0 && index !== newConfig.length - 1) {
        newInput = {
          ...newInput,
          className: this.checkChangeGroup(newConfig, index)
            ? `${newConfig[index].className} first`
            : newConfig[index].className,
        };
      }

      return this.getInputWrapper(newInput, meta, hasBoq, projectData);
    });

    this.checkObserverValues();
  }

  checkObserverValues() {
    this.observerInputs.forEach((observer) => {
      const { inputName, inputObserver } = observer;
      if (inputObserver) {
        this.initialValues[inputObserver] = this.observerCallback(
          inputName,
          this.initialValues[inputName],
          observer,
          this.initialValues,
        )[inputObserver];
        this.saveData(inputObserver, this.initialValues[inputObserver]);
      }
    });
  }

  checkChangeGroup(config, index) {
    return (
      (config[index - 1].className.includes(GRAY_BG) &&
        config[index].className.includes(WHITE_BG)) ||
      (config[index - 1].className.includes(WHITE_BG) &&
        config[index].className.includes(GRAY_BG))
    );
  }

  // We check if dataref exist so we can check if an endpoint call is needed
  getInputWrapper(input, meta, hasBoq, projectData) {
    const {
      dataref,
      dbKey,
      code,
      type,
      asyncUpdate,
      asyncUpdateBulk,
      boq,
      value: backendValue,
    } = input;
    const inputName = this.getInputNameFromCode(code);
    const asyncCall = asyncCallMapping[dbKey] || sowConfig;
    const newInput = { ...input };
    const callbackHandlerOptions = [
      'date',
      'select',
      'select_edit',
      'select_multilabel',
      'select_input',
      'reference',
      'multiselect',
      'select_witness',
      'pdf',
    ];
    const handler = callbackHandlerOptions.find((opt) => type === opt)
      ? 'callback'
      : 'handleBlur';
    // we add update async value function on blur
    newInput[handler] = (event) => {
      const value = this.formatBlurValues(event, type);
      if (type === 'select_witness' && value && value.id && value.id < 0) {
        this.openWitnessModal(dataref, value.navTitle || value.label, dbKey);
        return null;
      }
      if (
        newInput &&
        newInput.errorModal &&
        newInput.errorModal.option === value.label &&
        !hasBoq
      ) {
        this.openErrorModal(value);
        return null;
      }
      // TODO: Prepare this section for future configurations
      if (asyncUpdate) {
        if (type === 'select_multilabel' && asyncUpdate[value.label]) {
          const extraInput = asyncUpdate[value.label].input;
          const extraValue = asyncUpdate[value.label].value;
          this.saveData(extraInput, extraValue);
        }
      }
      if (asyncUpdateBulk && asyncUpdateBulk.length) {
        const newValues = {};
        asyncUpdateBulk.forEach((item) => {
          if (type === 'select_multilabel' && item[value.label]) {
            const extraInput = item[value.label].input;
            const extraValue = item[value.label].value;
            newValues[extraInput] = extraValue;
          }
        });
        if (Object.keys(newValues).length) {
          this.saveMultipleData(newValues);
        }
      }
      if (type === 'money') {
        const { sum_total: sumTotal = false } = input;
        if (sumTotal) {
          this.handleUpdateTableTotal(inputName, value);
        }
      }
      return this.saveData(inputName, value);
    };
    // We changing it for new SOW work
    const isSow = dataref && dataref === 'sow.getContent';
    const isNumberDocument = dataref && dataref === 'nd.getContent';
    if (isSow) {
      const { save, ...rest } = asyncCall;
      this.asyncInputs[dbKey] = {
        ...rest,
        dbKey,
        inputName,
        type,
      };
      // TODO: Add func parameter handler when other endpoints for different inputs are implemented
      newInput[handler] = (previousRange, _source, editor, meta = {}) => {
        const content = (editor && editor.getHTML()) || previousRange;
        const jsonValue = Config.getJSONfromHTML(content);
        const valuesToSend = {
          content: jsonValue,
          templateName: meta.templateName ?? '',
          templateId: meta.templateId ?? null,
        };
        const { did } = this.params;
        const isValid = this.handleFormValuesUpdate(inputName, {
          editorHtml: jsonValue,
          files: [],
          templateName: meta.templateName ?? '',
          templateId: meta.templateId ?? null,
        });
        if (isValid) {
          return save(did, valuesToSend);
        }
        return null;
      };
      newInput.noOptionsMessage = () => 'Loading...';
    } else if (isNumberDocument) {
      const { create, save, remove } = ndConfig;
      newInput[handler] = async (fileUploaded) => {
        const { did } = this.params;
        const response = await create(did, inputName, fileUploaded);
        const { success, data } = response;
        if (success) {
          const { id } = data;
          this.saveData(inputName, id);
          this.handleUpdateNumberDocument(data);
          this.handleFormValuesUpdate(`${inputName}_TEXT`, 'Yes');
          this.handleFormValuesUpdate(
            `${inputName}_LINK`,
            'Included In Document',
          );
        }
        return success;
      };
      newInput.handleRemove = async (id) => {
        const response = await remove(id);
        const { success } = response;
        if (success) {
          this.saveData(inputName, 0);
          this.handleUpdateNumberDocument(null, id);
          this.handleFormValuesUpdate(`${inputName}_TEXT`, 'No');
          this.handleFormValuesUpdate(
            `${inputName}_LINK`,
            'Not Included',
          );
        }
        return success;
      };
      newInput.handleUpdate = async (id, fileUploaded) => {
        const response = await save(id, fileUploaded);
        const { success, data } = response;
        if (success) {
          this.saveData(inputName, id);
          this.handleUpdateNumberDocument(data, id);
          this.handleFormValuesUpdate(`${inputName}_TEXT`, 'Yes');
          this.handleFormValuesUpdate(
            `${inputName}_LINK`,
            'Included In Document',
          );
        }
        return success;
      };
    }

    const isReference = type === 'reference';
    if (isSow || isReference) {
      newInput.handleClick = () => this.handleInputFocused(inputName);
    } else if (isNumberDocument) {
      newInput.handleClick = () => this.handleInputFocused(`${inputName}_TEXT`);
    } else if (!isSow && type === 'editor') {
      const { value } = newInput;
      newInput.value = Config.getJSONfromHTML(value);
      newInput.handleClick = () => this.handleInputFocused(inputName);
    } else {
      newInput.handleFocus = () => this.handleInputFocused(inputName);
    }
    // Add value if has BOQ and value is not set
    if (newInput && newInput.errorModal && hasBoq && boq) {
      const valueBoq =
        (isNil(backendValue) && boq.option_index && boq.option_index) ||
        backendValue;
      newInput.value = valueBoq;
      if (valueBoq) {
        this.saveData(inputName, { id: valueBoq });
      }

      // Add link to go to BOQ
      const [currentTender] =
        (projectData &&
          projectData.tender &&
          projectData.tender.filter(
            (t) => Number(t.id) === Number(this.params.tid),
          )) ||
        [];
      const tid = (currentTender && currentTender.id) || '';
      const goToBoq = `/main-contractor/project/${projectData.slug}/boq/${tid}`;
      newInput.goToBoq = goToBoq;
    }
    return this.getInput(newInput);
  }

  saveData(inputName, value) {
    const saveTemplateConfigRelay = new Relay('template', 'values');
    const valuesToSend = this.formatValues({ [inputName]: value });
    const { did } = this.params;
    const isValid = this.handleFormValuesUpdate(inputName, value);
    if (isValid) {
      this.handleUpdateMeta(valuesToSend);
      return saveTemplateConfigRelay.patch(valuesToSend, { did }).then(() => {
        this.handlePostSave(valuesToSend);
      });
    }
    return null;
  }

  saveMultipleData(newValues = {}) {
    const saveTemplateConfigRelay = new Relay('template', 'values');
    const { did } = this.params;
    const newValuesFormatted = {};
    Object.keys(newValues).forEach((inputName) => {
      const value = newValues[inputName];
      const isValid = this.handleFormValuesUpdate(inputName, value);
      if (isValid) {
        newValuesFormatted[inputName] = value;
      }
    });
    const valuesToSend = this.formatValues(newValuesFormatted);
    if (Object.keys(newValuesFormatted).length) {
      return saveTemplateConfigRelay.patch(valuesToSend, { did }).then(() => {
        this.handleUpdateMeta(valuesToSend);
      });
    }
    return null;
  }

  initAsyncValue(key, value, type) {
    const newValue = value || '';
    switch (type) {
      case 'editor':
        this.initialValues[key] = {
          editorHtml:
            (typeof newValue === 'object' && newValue !== null
              ? newValue.content ?? newValue.editorHtml
              : newValue) || '',
          files: [],
          templateName:
            (typeof newValue === 'object' && newValue?.templateName) || '',
          templateId:
            (typeof newValue === 'object' && newValue?.templateId) || null,
        };
        break;
      default:
        this.initialValues[key] = newValue;
    }
  }

  getInput(input) {
    const {
      code,
      type: typeInput,
      value,
      dbKey,
      title = '',
      label: labelInput,
      className = '',
      default: defaultVal,
      options: selectOptions = [],
      minDate: isMinDate = true,
      maxDate: isMaxDate = false,
      ...restInput
    } = input;
    const inputName = this.getInputNameFromCode(code);
    let restValues = {};
    this.initialValues[inputName] = value || defaultVal || '';
    switch (typeInput) {
      case 'date':
        const configWithoutMinDate = ['esd'];
        const acceptStringValue = !!restInput.suggestion_message;
        const minDate =
          isMinDate && !configWithoutMinDate.includes(this._slug)
            ? { minDate: moment().toDate() }
            : {};

        const maxDate =
          isMaxDate && !configWithoutMinDate.includes(this._slug)
            ? { maxDate: moment().toDate() }
            : {};
        restValues = {
          type: 'text',
          calendar: true,
          className: `calendar ${className}`,
          dateFormat: DATE_FORMAT,
          placeholder: DATE_FORMAT_PLACEHOLDER,
          isClearable: true,
          message: acceptStringValue ? restInput.suggestion_message : '',
          CustomContent: acceptStringValue ? CustomContentDatePicker : null,
          ...minDate,
          ...maxDate,
        };
        this.initialValues[inputName] = value;
        break;
      case 'editor':
        restValues = {
          type: 'editor',
          attachment: false,
          bullet: false,
          ordered: false,
          modal: true,
          triggerCustomErrors: true,
          docCreator: true,
          title,
          className: `${className}`,
          placeholder: 'Click to open',
          handleChangeOptions: (name, optionValue, setFieldValue) => {
            const { id: did } = optionValue;
            const templatesRelay = new Relay('template', 'getContent');
            return templatesRelay
              .getJson({ did })
              .then((sow) => sow && sow.content && sow.content.content)
              .then((editorHtml) => {
                if (editorHtml) {
                  setFieldValue(name, {
                    editorHtml,
                    files: [],
                    templateName: optionValue.label || '',
                    templateId: optionValue.id || optionValue.value || null,
                  });
                }
                return editorHtml;
              });
          },
        };
        this.initialValues[inputName] = {
          editorHtml: value || defaultVal || '',
        };
        break;
      case 'select_edit':
      case 'select_input':
      case 'select':
      case 'select_multilabel':
      case 'select_witness':
        // BEGIN ULTRA FRONTEND HACK TO CHANGE THE CURRENCY SYMBOL
        const newSelectOptions = selectOptions.map((so) => {
          if (typeof so === 'string') {
            return so.replaceAll('£', i18next.t('currency'));
          }
          return so;
        });
        // END ULTRA FRONTEND HACK TO CHANGE THE CURRENCY SYMBOL
        const keysSignatures = Object.keys(this.signatureFields);
        restValues = {
          as: 'select',
          className: `${className}`,
          options: newSelectOptions.map((labelOpt, id) => {
            /* CLP-153: Fix to admit objects instead of strings */
            if (
              typeInput !== 'select_multilabel' &&
              typeof labelOpt === 'object'
            ) {
              return labelOpt;
            }
            /* We treat edge case for multilabelling */
            const label =
              typeInput === 'select_multilabel'
                ? labelOpt.selectLabel
                : labelOpt;
            const showLabel =
              typeInput === 'select_multilabel' ? labelOpt.showLabel : '';
            const headerLabel =
              typeInput === 'select_multilabel' ? labelOpt.headerLabel : '';
            return {
              value: id,
              id,
              label,
              showLabel,
              headerLabel,
            };
          }),
          handleEnter: typeInput === 'select_input',
          selectedOptionTooltip: keysSignatures.find(
            (opt) => opt === inputName,
          ),
        };
        if (typeInput === 'select_witness') {
          const Option = ({ children, ...props }) => {
            const icon =
              props.value === -1 ? <FontAwesomeIcon icon={faPlus} /> : null;
            return (
              <components.Option {...props}>
                {icon} {children}
              </components.Option>
            );
          };
          restValues.components = {
            Option,
          };
        }
        let valueToCheck = isNil(value) ? value : Number(value);
        valueToCheck = isNaN(valueToCheck) ? value : valueToCheck;
        const defaultValToCheck = isNil(defaultVal)
          ? defaultVal
          : Number(defaultVal);
        const filterVal = !isNil(valueToCheck)
          ? valueToCheck
          : defaultValToCheck;
        /* eslint no-case-declarations: "off" */
        const [initialValue] = restValues.options.filter(
          (opt) => Number(opt.id) === Number(filterVal),
        );

        let v = initialValue;
        if (!isNil(filterVal) && !isNumber(filterVal)) {
          const custom = { id: filterVal, value: filterVal, label: filterVal };
          v = custom;
          restValues.options.push(custom);
        }
        this.initialValues[inputName] = !isNil(v) ? v : '';
        break;
      case 'text':
        restValues = {
          className: `${className}`,
          type: 'textarea',
        };
        this.initialValues[inputName] = getTextFromHTML(
          value || defaultVal || '',
        );
        break;
      case 'input':
        restValues = {
          className: `${className}`,
          type: 'text',
        };
        break;
      case 'hidden':
        restValues = {
          className: `${className}`,
          type: 'hidden',
        };
        break;
      case 'money':
        restValues = {
          className: `${className}`,
          type: 'money',
          justNumber: restInput.just_number || false,
        };
        this.moneyInputs.push(inputName);
        break;
      case 'reference':
        restValues = { type: 'reference' };
        this.initialValues[inputName] = title || '';
        break;
      case 'pdf':
        restValues = {
          type: 'pdf',
        };
        this.initialValues[inputName] = value;
        this.initialValues[`${inputName}_TEXT`] = value ? 'Yes' : 'No';
        this.initialValues[`${inputName}_LINK`] = value
          ? 'Included In Document'
          : 'Not Included';
        break;
      case 'filemanager':
        restValues = {
          type: 'filemanager',
        };
        break;
      default:
        return {};
    }

    const toReturn = {
      ...restInput,
      key: dbKey,
      name: inputName,
      required: false,
      label: labelInput,
      testId: `document-creator-field-${String(dbKey || inputName).replaceAll('_', '-')}`,
      ...restValues,
    };
    return toReturn;
  }

  getFormPercentage(values, valuesToFilter = []) {
    const newValues = values || this.initialValues;
    if (newValues) {
      let references = [];
      const formFieldsFiltered = this.formFields.filter((i) => {
        // formFields Without References
        const filterConfition = i.type !== 'reference';
        const options = i.options ?? [];
        const hideOption = 'hide';
        const hide = options.includes(hideOption);
        references =
          filterConfition && !hide ? references : [...references, i.name];
        return filterConfition;
      });
      const total = formFieldsFiltered.length - valuesToFilter.length;
      let noEmptyInput = 0;
      Object.keys(newValues).forEach((key) => {
        if (!valuesToFilter.includes(key)) {
          const value = newValues[key];
          if (typeof value === 'object' && !this.emptyObject(value)) {
            noEmptyInput++;
          }

          const regex = /^ND.*(_TEXT|_LINK)$/;
          if (
            typeof value !== 'object' &&
            value !== '' &&
            !references.includes(key) &&
            !regex.test(key)
          ) {
            noEmptyInput++;
          }
        }
      });
      let percentage = 100 * (noEmptyInput / total);
      percentage =
        total < 100
          ? Math.round(percentage)
          : parseFloat(percentage).toFixed(2);
      return percentage;
    }
    return 0;
  }

  getInputNameFromCode(code) {
    return typeof code === 'string'
      ? code.replace('{', '').replace('}', '')
      : '';
  }

  observerCallback(name, currentValue, observer, values) {
    const { method, listeners, inputObserver, type } = observer;
    switch (method) {
      case 'dateSubstract': {
        const dateValues = listeners.map((listener) =>
          this.formatValues({
            [listener]: listener === name ? currentValue : values[listener],
          }),
        );
        const [date1, date2] = dateValues;
        const [dateValue1] = Object.values(date1);
        const [dateValue2] = Object.values(date2);
        const newValue = dateSubstract(dateValue1, dateValue2, type);
        if (newValue !== '') {
          return { [inputObserver]: newValue };
        }

        return { [inputObserver]: values[inputObserver] };
      }
      default:
        return null;
    }
  }

  emptyObject(value) {
    return (
      value === '' ||
      isNil(value) ||
      value.editorHtml === '' ||
      value.editorHtml === '<p><br></p>'
    );
  }

  formatValues(values) {
    let valuesToSend = {};
    /* eslint guard-for-in: "off" */
    for (const valueKey in values) {
      const inputMapped = this.mapping[valueKey];
      let type;
      try {
        type = inputMapped.type;
      } catch (error) {
        // Code to handle the error
        // eslint-disable-next-line no-console
        console.error(
          `The key "${valueKey}" is missing. An error occurred:`,
          error,
        );
        type = null;
      }
      switch (type) {
        case 'date':
          valuesToSend[inputMapped.inputKey] = getDateValuesV1(
            values[valueKey],
            true,
          );
          break;
        case 'text':
          valuesToSend[inputMapped.inputKey] = getTextFromHTML(
            values[valueKey],
          );
          break;
        case 'select':
        case 'select_edit':
        case 'select_input':
        case 'select_witness':
        case 'select_multilabel':
          valuesToSend[inputMapped.inputKey] = values[valueKey].id;
          break;
        case 'money':
          valuesToSend[inputMapped.inputKey] =
            values[valueKey] > 0
              ? (valuesToSend[inputMapped.inputKey] = values[valueKey])
              : 0;
          break;
        default:
          try {
            valuesToSend[inputMapped.inputKey] = values[valueKey];
          } catch (error) {
            // Code to handle the error
            // eslint-disable-next-line no-console
            console.error(
              `The key value you're trying to send is missing. An error occurred:`,
              error,
            );
            // eslint-disable-next-line no-console
            console.error(`inputMapped -> `, inputMapped);
            // eslint-disable-next-line no-console
            console.error(`values ->`, values);
            // eslint-disable-next-line no-console
            console.error(`valueKey ->`, valueKey);
            valuesToSend = {};
          }
      }
    }
    return valuesToSend;
  }

  formatBlurValues(event, type) {
    let newValue;
    switch (type) {
      case 'date': {
        newValue = event.val;
        break;
      }
      case 'editor': {
        newValue = isString(event) ? event : event.target.value;
        break;
      }
      case 'select_multilabel':
      case 'select_edit':
      case 'select_input':
      case 'select_witness':
      case 'select': {
        const { val: option } = event;
        newValue = option;
        break;
      }
      default:
        newValue = event.target.value;
    }
    return newValue;
  }
}

export default Template;
