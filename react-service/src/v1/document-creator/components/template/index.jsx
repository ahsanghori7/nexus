/* eslint-disable jsx-a11y/no-autofocus */
import React from 'react';
import 'v1/global';
import 'v1/document-creator/public/styles/index.scss';
/* BEGIN HACK FOR GENERAL LAYOUT */
import actions from 'v2/store/reducers/actions';
import { connect } from 'react-redux';
/* END HACK FOR GENERAL LAYOUT */
import ContainerMui from '@mui/material/Container';
import Skeleton from '@mui/material/Skeleton';
import Grid2 from '@mui/material/Grid2';
import isArray from 'lodash/isArray';
import isStringFunc from 'lodash/isString';
import isObject from 'lodash/isObject';
import { useParams } from 'react-router-dom';
import isNil from 'lodash/isNil';
import isEmpty from 'lodash/isEmpty';
import includes from 'lodash/includes';
import replace from 'lodash/replace';
import Alert from 'react-bootstrap/Alert';
import Modal from 'v2/apps/clink/pages/orders/subcontractors/modal';
import { postData } from 'services/helpers';
import { goTo, getProjectUrl } from 'v2/helpers/url';
import Page from 'v1/document-creator/components/page';
import TemplateService from 'v1/document-creator/services/template/forms';
import CategoriesService from 'v1/global/services/documents/Categories';
import Config from 'v1/document-creator/helpers/config';
import Relay from 'v1/global/services/Relay';
import { getTextFromHTML } from 'v1/global/helpers/data';
import Tenders from 'v1/file-manager/helpers/Tenders';
import { getDateValuesV1 } from 'v2/helpers/date';
import alertHelper from 'v1/global/helpers/alert';
import DocController from 'v1/global/services/documents/DocumentCreatorSend';
import pennyToCurrency from 'v2/helpers/currency/v1';
import { analytics } from 'v1/global/helpers/services';
import SendDocumentModal from 'v2/apps/shared/components/send-document-modal';
import FileManagerModal from 'v1/document-creator/components/page/FileManagerModal';
import { TA_SLUG, DOMESTIC_SHORT_ORDER_SLUG } from 'v1/global/helpers/constants';
import DocHeader from './docusign/DocHeader';
import WitnessForm from './WitnessForm';
import ErrorContent from './ErrorContent';
import FormConfig from './form-config';
import ClinkPDF from './pdf';
import SignatureSection from './signature-section';
import inputsToCalculateTotal from 'v1/document-creator/helpers/calculateTotalInputs.json';

/*
  Created to mock easier the response for document content and config

  Example of the mock for response for the content:

  ```
  import contentMock from './contentMock.json';
  [...]
  const mockContentHelper = (response) => contentMock;
  ```
 */

const mockContentHelper = (response) => response?.content && response;
const mockConfigHelper = (response) => response?.data && response;

const endpointResponseError = (method) => method;
const endpointError = (method) =>
  `An error occurred while ${method} form data.`;

export const getAssignedApprovers = (rawAssigned) => {
  if (!rawAssigned?.approvals) return [];
  if (rawAssigned.isLevel) {
    const levels = Array.isArray(rawAssigned.approvals)
      ? rawAssigned.approvals
      : Object.values(rawAssigned.approvals);
    return levels.flatMap((level) =>
      (level?.approvers ?? []).map((approver) => ({
        ...approver,
        levelStatus: level?.status,
      })),
    );
  }
  if (Array.isArray(rawAssigned.approvals)) {
    return rawAssigned.approvals;
  }
  return Object.values(rawAssigned.approvals).flatMap(
    (level) => level?.approvers ?? [],
  );
};
class DocumentCreator extends React.Component {
  constructor(props) {
    super(props);
    const { tid, did, showForm } = this.props;

    this.state = {
      config: [],
      draft: [],
      formConfig: [],
      formValues: {},
      formErrors: {},
      inputFocused: null,
      missingInputFocused: null,
      error: false,
      loadingConfig: true,
      loadingConfigService: showForm,
      loadingContent: true,
      defaultTender: 0,
      projectData: null,
      subcontractor: null,
      slug: '',
      loadingSOA: false,
      meta: {},
      signature: 'docusign',
      openWitness: false,
      openError: false,
      openPolicyWarning: false,
      dataref: '',
      hasBoq: false,
      missingHighlight: false,
      miniBoqData: {},
      vat: 20,
      debouncedQueryVat: '',
      isDocumentUpdated: false,
      numberDocuments: [],
      assignedApprovers: [],
      assignedApproversRaw: null,
      approversList: [],
    };

    this.initPage = this.initPage.bind(this);
    this.handleConfigChange = this.handleConfigChange.bind(this);
    this.handleConfigSave = this.handleConfigSave.bind(this);
    this.handleRequestApproval = this.handleRequestApproval.bind(this);
    this.handleApproveOrRejectOrder =
      this.handleApproveOrRejectOrder.bind(this);
    this.handleRejectionAcknowledge =
      this.handleRejectionAcknowledge.bind(this);
    this.handleFormValuesUpdate = this.handleFormValuesUpdate.bind(this);
    this.handleApproversRefresh = this.handleApproversRefresh.bind(this);
    this.loadFileManager = this.loadFileManager.bind(this);
    this.loadContent = this.loadContent.bind(this);
    this.loadConfig = this.loadConfig.bind(this);
    this.loadLocalMiniBoq = this.loadLocalMiniBoq.bind(this);
    this.loadDocuments = this.loadDocuments.bind(this);
    this.loadHeaderFooter = this.loadHeaderFooter.bind(this);
    this.formatFormValues = this.formatFormValues.bind(this);
    this.transformMcLarenShortcodes =
      this.transformMcLarenShortcodes.bind(this);
    this.processMcLarenConfigText = this.processMcLarenConfigText.bind(this);
    this.handleInputFocused = this.handleInputFocused.bind(this);
    this.handleUpdateMeta = this.handleUpdateMeta.bind(this);
    this.handleUpdateNumberDocument =
      this.handleUpdateNumberDocument.bind(this);
    this.handleUpdateTableTotal = this.handleUpdateTableTotal.bind(this);
    this.applyObserverActions = this.applyObserverActions.bind(this);
    this.handleSend = this.handleSend.bind(this);
    this.scrollFunc = this.scrollFunc.bind(this);
    this.scrollMissingFunc = this.scrollMissingFunc.bind(this);
    this.autoFocus = this.autoFocus.bind(this);
    this.handleOrangeFocus = this.handleOrangeFocus.bind(this);
    this.refreshDocument = this.refreshDocument.bind(this);
    this.loadScheduleAttendances = this.loadScheduleAttendances.bind(this);
    this.loadMiniBoq = this.loadMiniBoq.bind(this);
    this.loadNumberDocuments = this.loadNumberDocuments.bind(this);
    this.loadTotalOfTable = this.loadTotalOfTable.bind(this);
    this.handleSignatureChange = this.handleSignatureChange.bind(this);
    this.handleUpdateVat = this.handleUpdateVat.bind(this);
    this.openWitnessModal = this.openWitnessModal.bind(this);
    this.openErrorModal = this.openErrorModal.bind(this);
    this.triggerLoading = this.triggerLoading.bind(this);
    this.setMissingHighlight = this.setMissingHighlight.bind(this);
    this.updateTemplateServiceFirst =
      this.updateTemplateServiceFirst.bind(this);
    this.updateTemplateServiceSecond =
      this.updateTemplateServiceSecond.bind(this);
    this._getValuesToFilter = this._getValuesToFilter.bind(this);

    this.templateService = new TemplateService(
      { tid, did },
      this.handleFormValuesUpdate,
      this.handleInputFocused,
      this.handleUpdateMeta,
      this.handleUpdateNumberDocument,
      this.handleUpdateTableTotal,
      this.openWitnessModal,
      this.openErrorModal,
    );
    this.templateService.handlePostSave = this.handleApproversRefresh;
    this.pdfViewerRef = React.createRef();
    this.formViewerRef = React.createRef();
    this.virtualizedInputsRef = React.createRef();
    this.inputRef = {};
    this.missingInputRef = {};
    this.formRef = React.createRef();
    this.timer = null;
  }

  componentDidMount() {
    this.initPage();
  }

  componentDidUpdate(_prevProps, prevState) {
    if (prevState.vat !== this.state.vat) {
      if (prevState.vat !== this.state.vat) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          const { did } = this.props;
          const { meta } = this.state;
          const newMeta = { ...meta, vat: this.state.vat };
          const vatMetaRelay = new Relay('template', 'meta');
          vatMetaRelay.patch(newMeta, { did });
        }, 500);
      }
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  handleConfigChange(htmlValue, elementId) {
    this.setState((prevState) => {
      const { config, draft } = prevState;
      // We check if the value is an object from the editor
      let newHtmlValue = htmlValue;
      if (typeof htmlValue === 'object' && 'editorHtml' in htmlValue) {
        newHtmlValue = htmlValue.editorHtml;
      }
      // We split the elementID into number (format: [level0, itemID, level1, itemID...])
      const numbers = elementId.split(/\D+/gm).filter((elem) => !isEmpty(elem));
      // we clean the text from undesired elements
      const cleanHtmlValue = Config.cleanHtml(newHtmlValue);
      // conver value from HTML to our JSON format
      const jsonValue = Config.getJSONfromHTML(cleanHtmlValue);
      const val = jsonValue === '{br}' ? '\u00A0' : jsonValue;
      const newConfig = Config.getNewConfig(numbers, [...config], val);
      const newDraft = Config.getNewConfig(numbers, [...draft], val, true);

      return { config: newConfig, draft: newDraft };
    });
  }

  handleConfigSave() {
    const { did, showForm } = this.props;
    this.setState({ loadingContent: true }, () => {
      this.setState(async (prevState) => {
        const { config: content } = prevState;
        // We remove the headers and footers before we send it to the backend
        const [document] = JSON.parse(JSON.stringify(content));
        const { children: pages } = document;
        const newPages = pages.map((page) => ({
          ...page,
          children: page.children.slice(1, page.children.length - 1),
        }));
        const newContent = [
          {
            ...document,
            children: newPages,
          },
        ];
        const saveContentAction = showForm ? 'document' : 'template';
        const saveTemplateContentRelay = new Relay(
          saveContentAction,
          'saveContent',
        );
        saveTemplateContentRelay
          .post(newContent, { did })
          .then(async (response) => {
            const jsonResponse = await response.json();
            const { success } = jsonResponse;
            const newState = {
              ...prevState,
              loadingContent: false,
            };
            if (success) {
              newState.draft = JSON.parse(JSON.stringify(content));
            } else {
              newState.error = endpointResponseError('saving the form data');
            }
            this.setState(newState);
          })
          .catch(() => {
            this.setState({
              loadingContent: false,
              error: endpointError('saving'),
            });
          });
        // no state change here, as we change state after async calls
        return {};
      });
    });
  }

  handleRequestApproval = async (
    selectedApprovers,
    varianceExplanation = '',
  ) => {
    const { did, dispatch, docType, tid } = this.props;
    const { projectData } = this.state;
    if (docType === 'tender') {
      return dispatch(
        actions.clink.assignTenderInquiryApprover({
          project_id: projectData?.id,
          tenderId: tid,
          did,
          data: varianceExplanation
            ? {
                approvers: selectedApprovers,
                variance_explanation: varianceExplanation,
              }
            : selectedApprovers,
        }),
      ).unwrap();
    }
    if (docType !== 'order') return null;
    return dispatch(
      actions.clink.assignOrderApprovers({
        did,
        data: varianceExplanation
          ? {
              approvers: selectedApprovers,
              variance_explanation: varianceExplanation,
            }
          : selectedApprovers,
      }),
    ).unwrap();
  };

  handleApproveOrRejectOrder = async (approver_id, status, comment = '') => {
    const { did, dispatch, docType } = this.props;
    const { signature, meta } = this.state;
    if (docType !== 'order') return null;

    return dispatch(
      actions.clink.approveOrRejectOrder({
        did,
        approver_id,
        status,
        comment,
        signature,
        meta,
      }),
    ).unwrap();
  };

  handleRejectionAcknowledge = async () => {
    const { did, dispatch, docType } = this.props;
    const { projectData } = this.state;

    if (docType === 'tender') {
      return dispatch(
        actions.clink.acknowledgeRejectionFeedback({
          project_id: projectData?.id,
          did,
        }),
      ).unwrap();
    }

    if (docType !== 'order') return null;
    return dispatch(
      actions.clink.rejectionAcknowledge({
        did,
      }),
    ).unwrap();
  };

  handleFormValuesUpdate(inputName, value) {
    this.handleOrangeFocus('remove');
    const isString = typeof value === 'string';
    const isEditorObject =
      isObject(value) && value !== null && 'editorHtml' in value;
    const isValid = isEditorObject
      ? this.isValid(value.editorHtml || '')
      : !isString || this.isValid(value);
    this.setState((prevState) => {
      const { formValues } = prevState;
      const newState = {
        isDocumentUpdated:
          this.templateService.initialValues[inputName] !== value,
        inputFocused: null,
      };
      if (isValid) {
        let nextInputValue = value;
        if (
          !isEditorObject &&
          isObject(formValues[inputName]) &&
          'editorHtml' in formValues[inputName]
        ) {
          nextInputValue = {
            ...formValues[inputName],
            editorHtml: Config.getJSONfromHTML(value),
          };
        }
        newState.formValues = {
          ...formValues,
          [inputName]: nextInputValue,
        };
        // Reset errors if valid
        newState.formErrors = {};
      } else {
        // TODO: Error handler only for SOW. Check if other inputs will break
        newState.formErrors = {
          [inputName]: 'Single brackets are not allowed',
        };
      }
      return newState;
    });
    return isValid;
  }

  handleInputFocused(inputName) {
    const { meta } = this.state;
    this.handleOrangeFocus('remove');
    this.setState({ inputFocused: inputName }, () =>
      this.scrollFunc(this.inputRef, inputName),
    );
    this.inputRef = {};
    if (meta.miniboq && inputName === 'MiniBoqReference') {
      document.getElementById('MiniBoqTemplate').style.border =
        '2px solid orange';
    } else if (meta.miniboq && inputName !== 'MiniBoqReference') {
      document.getElementById('MiniBoqTemplate').style.border = '';
    }
  }

  handleUpdateMeta(data) {
    this.setState((prevState) => {
      const { meta } = prevState;
      const newMeta = { ...meta, values: { ...meta.values, ...data } };
      return { meta: newMeta };
    });
  }

  handleApproversRefresh(data) {
    if (
      'what_remeasurable_allowance' in data ||
      'what_discount_applied_order_value' in data
    ) {
      const v = { ...this.state.meta?.values, ...data };
      const sum = this.parseOrderValuePennies(
        String(
          v.what_remeasurable_allowance ??
            this.state.formValues?.WhatRemeasurableAllowance ??
            '',
        ),
      );
      const disc = this.parseOrderValuePennies(
        String(
          v.what_discount_applied_order_value ??
            this.state.formValues?.WhatDiscountAppliedOrderValue ??
            '',
        ),
      );
      const base = sum !== null ? sum : this._initialOrderValue;
      if (base) {
        this.syncOrderValueFromWordFigures(
          `£${(
            Math.round((base * (10000 - (disc || 0))) / 10000) / 100
          ).toFixed(2)}`,
        );
      } else {
        this.handleFormValuesUpdate('OrderPrice', 0);
        this.handleUpdateMeta({ order_value: 0 });
      }
    }
    if ('order_value_word_figures' in data) {
      this.syncOrderValueFromWordFigures(data.order_value_word_figures);
      return;
    }
    if (!('order_value' in data)) return;
    const { did } = this.props;
    new Relay('document', 'getContent')
      .getJson({ did })
      .then((response) => {
        if (response?.meta) {
          this.setState((prevState) => ({
            meta: {
              ...prevState.meta,
              approvers: response.meta.approvers ?? [],
            },
          }));
        }
      })
      .catch(() => {});
  }

  handleUpdateNumberDocument(data = null, id = 0) {
    this.setState((prevState) => {
      const { numberDocuments } = prevState;
      if (data) {
        // Create
        if (id) {
          const { name } = data;
          return {
            numberDocuments: numberDocuments.map((nd) =>
              Number(nd.id) === Number(id) ? { ...nd, name } : nd,
            ),
          };
        }
        return { numberDocuments: [...numberDocuments, data] };
      }
      if (id) {
        // Remove
        return {
          numberDocuments: numberDocuments.filter(
            (nd) => Number(nd.id) !== Number(id),
          ),
        };
      }
      return prevState;
    });
  }

  handleUpdateTableTotal(inputName, value) {
    const { did, showForm } = this.props;
    this.setState(
      (prevState) => {
        const { config, meta, formConfig } = prevState;
        const { values = {} } = meta;
        const vals = [];
        let newValues = {};
        formConfig.forEach((c) => {
          const keys = Object.keys(c);
          keys.forEach((key) => {
            if ('sum_total' in c[key] && c[key].sum_total) {
              const val = values[key] || 0;
              const newVal =
                c[key].code === `{${inputName}}` ? Number(value) : Number(val);
              vals.push(newVal);
              newValues = { ...newValues, [key]: newVal };
            }
          });
        });
        if (config && config.length) {
          const [document] = config;
          const completeConfig = [
            {
              ...document,
              children: document.children.map((child) =>
                Config.setTotalTable(child, vals),
              ),
            },
          ];

          meta.values = { ...meta.values, ...newValues };

          return {
            ...prevState,
            meta,
            config: completeConfig,
            draft: [...JSON.parse(JSON.stringify(completeConfig))],
          };
        }
        return this.loadTotalOfTable(prevState);
      },
      () => {
        this.setState(async (prevState) => {
          const { config: content } = prevState;
          // We remove the headers and footers before we send it to the backend
          const [document] = JSON.parse(JSON.stringify(content));
          const { children: pages } = document;
          const newPages = pages.map((page) => ({
            ...page,
            children: page.children.slice(1, page.children.length - 1),
          }));
          const newContent = [
            {
              ...document,
              children: newPages,
            },
          ];
          const saveContentAction = showForm ? 'document' : 'template';
          const saveTemplateContentRelay = new Relay(
            saveContentAction,
            'saveContent',
          );
          saveTemplateContentRelay
            .post(newContent, { did })
            .then(async (response) => {
              const jsonResponse = await response.json();
              const { success } = jsonResponse;
              const newState = {
                ...prevState,
              };
              if (success) {
                newState.draft = JSON.parse(JSON.stringify(content));
              } else {
                newState.error = endpointResponseError('saving the form data');
              }
              this.setState(newState);
            })
            .catch(() => {
              this.setState({
                error: endpointError('saving'),
              });
            });
          // no state change here, as we change state after async calls
          return {};
        });
      },
    );
  }

  handleSend(sids = []) {
    const { slug: slugDocument, subcontractor, signature, meta } = this.state;
    const { docType, showForm, did, tid, clinkAccount } = this.props;

    if (showForm) {
      const { projectData } = this.state;
      const { slug } = projectData;
      if (docType === 'order') {
        const body = { did, tid, sids };
        const hasSignatory = meta && meta.signatory;
        if (hasSignatory) {
          body.signing_mechanism = signature;
        }
        const callback = () => {
          /* eslint no-console: "off" */
          const optionsSuccess = {
            title: 'Order Sent',
            message:
              "Your order has been sent, you'll find a copy come to your email",
            type: 'success',
          };
          const optionsError = {
            title: 'Error',
            message: 'Something went wrong',
            type: 'error',
          };
          alertHelper(
            { success: true },
            () => null,
            optionsSuccess,
            optionsError,
          );
        };
        DocController(JSON.stringify(body), callback, console.log).then(() => {
          if (
            clinkAccount &&
            clinkAccount.envelopes &&
            Number(clinkAccount.envelopes.current) &&
            Number(clinkAccount.envelopes.current) > 0
          ) {
            const { envelopes } = clinkAccount;
            envelopes.current = Number(envelopes.current) - 1;
            const newInfo = { ...clinkAccount, envelopes };
            this.setState({ info: newInfo });
          }
        });
        return analytics(
          'history.quote.awarded',
          Number(subcontractor.id),
        ).then(() => goTo(`${BASE_URLS.CLINK}/project/${slug}/orders`));
      }
      if (docType === 'tender') {
        goTo(
          getProjectUrl(slug, 'procurement_schedule', {
            tid,
            did,
            slug: slugDocument,
          }),
        );
      }
    }
    return null;
  }

  handleOrangeFocus(method = 'add') {
    if (this.inputRef && Object.values(this.inputRef).length) {
      Object.values(this.inputRef).forEach((input) => {
        if (!input) return;
        // If we're in a table, we try to highlight it/ remove it
        const { parentElement } = input;
        if (
          parentElement &&
          parentElement.classList.contains('edit-document-table-column')
        ) {
          const { parentElement: grandparentElement } = parentElement;
          grandparentElement.classList[method]('focused');
        }
      });
    }
  }

  handleSignatureChange(event) {
    const { did } = this.props;
    this.setState({ signature: event.target.value });
    const CLINK_RESOURCE = 'relay';
    const CLINK_PARAMS = { action: 'template' };
    const data = { signatory_wet: event.target.value === 'wet' };
    postData(
      CLINK_RESOURCE,
      data,
      '',
      { ...CLINK_PARAMS, method: 'values', did },
      '',
      '',
      '',
    );
  }

  handleUpdateVat(value) {
    this.setState({ vat: value }, () => {
      const newState = this.loadSimpleRowQuotePrice(this.state);
      this.setState({ ...newState });
    });
  }

  setMissingHighlight(value = true) {
    this.setState({ missingHighlight: value }, this.scrollMissingFunc);
  }

  getFirstFocusableFieldName() {
    const { signature } = this.state;
    const { formFields } = this.templateService;

    const [firstFocusableField] = (formFields || []).filter((field) => {
      const references = field.dataref ?? [];
      const isVisibleField =
        field.type !== 'hidden' &&
        field.type !== 'filemanager' &&
        field.type !== 'pdf';
      if (!isVisibleField) return false;
      if (signature === 'wet') {
        return !references.includes('docusign');
      }
      return true;
    });

    return firstFocusableField?.name || null;
  }

  parseOrderValuePennies(text) {
    if (!text || typeof text !== 'string') return null;
    const match = /£?\s*([\d,]+(?:\.\d{1,2})?)/.exec(text);
    if (match) {
      const amount = Number.parseFloat(match[1].replaceAll(',', ''));
      if (!Number.isNaN(amount) && amount > 0) {
        return Math.round(amount * 100);
      }
    }
    return null;
  }

  syncOrderValueFromWordFigures(textValue) {
    const pennies = this.parseOrderValuePennies(textValue);
    if (pennies === null) return;
    const { did } = this.props;
    this.handleUpdateMeta({ order_value: pennies });
    this.handleFormValuesUpdate('OrderPrice', pennies);
    new Relay('template', 'values')
      .patch({ order_value: pennies }, { did })
      .then(() => this.handleApproversRefresh({ order_value: pennies }))
      .catch(() => {});
  }

  _getValuesToFilter(fields, signature) {
    if (
      this._valuesToFilter !== undefined &&
      this._cachedSignature === signature &&
      this._cachedFieldsLength === fields.length
    ) {
      return this._valuesToFilter;
    }
    let valuesToFilter = [];
    if (signature === 'wet') {
      valuesToFilter = [...fields]
        .filter((f) => {
          const references = f.dataref ?? [];
          return references.includes('docusign');
        })
        .map((f) => f.name);
    }
    valuesToFilter = [
      ...valuesToFilter,
      ...fields
        .filter(
          (f) =>
            f.type === 'hidden' || f.type === 'filemanager' || f.type === 'pdf',
        )
        .map((f) => f.name),
    ];
    this._cachedSignature = signature;
    this._cachedFieldsLength = fields.length;
    this._valuesToFilter = valuesToFilter;
    return valuesToFilter;
  }

  initPage() {
    const { showForm } = this.props;

    /*
    1. load PDF content
    2. if we come from tender/order templates, load form config
    3. load header/footer info
    4. if we come from tender/order templates, load filemanager assets
    5. if we come from tender/order templates, load documents inside PDF content
    6. We build form data & check of we have asyncCalls to update form values
    7. we have all the data we need. We update state
    */
    /*
    TODO: To refactor this code, we need to split the logic into smaller functions
     */
    if (showForm) {
      this.loadFileManager()
        .then(this.loadConfig)
        .then(() => this.setState({ loadingConfig: false }));
    }
    this.loadContent()
      .then((response) => {
        if (!response || response?.error) {
          throw new Error(response.error);
        }
        return this.loadHeaderFooter(response);
      })
      .then((response) => {
        return response && (response.soa || response.soamc)
          ? this.loadScheduleAttendances(response)
          : response;
      })
      .then((response) =>
        response && response.miniBoq ? this.loadMiniBoq(response) : response,
      )
      .then((response) =>
        response && response.simpleRowQuotePrice
          ? this.loadSimpleRowQuotePrice(response)
          : response,
      )
      .then((response) => {
        const { config } = response;
        const [contentObject] = config;
        const options = contentObject?.options || {};
        const nd = options.numbered_documents;
        return nd ? this.loadNumberDocuments(response) : response;
      })
      .then((response) => this.loadTotalOfTable(response))
      .then((state) => {
        this.setState({ ...state, loadingContent: false }, this.autoFocus);
      })
      .catch((error) => {
        const newError = error.toString() || endpointError('fetching');
        this.setState({ loadingContent: false, error: newError });
      });
  }

  openWitnessModal(dataref, navTitle, dbKey) {
    if (dataref) {
      const modalVars =
        dataref === 'docusign.contractor'
          ? {
              id: 'add-member-contractor',
              navTitle,
              dbKey,
            }
          : {
              id: 'add-member-subcontractor',
              navTitle,
              dbKey,
            };
      this.setState({
        openWitness: {
          ...modalVars,
          cancel: null,
          confirm: null,
        },
        dataref,
      });
    } else {
      this.setState({
        openWitness: false,
        dataref: '',
      });
    }
  }

  openErrorModal(value) {
    if (value) {
      this.setState({
        openError: {
          id: 'error-boq',
          navTitle: 'No BOQ error',
          cancel: null,
          confirm: null,
        },
      });
    } else {
      this.setState({
        openError: false,
      });
    }
  }

  async updateTemplateServiceFirst() {
    const { formConfig, meta, hasBoq, projectData } = this.state;
    const { did } = this.props;
    this.templateService.buildForm(formConfig, meta, hasBoq, projectData);
    const asyncInputsArray = Object.values(this.templateService.asyncInputs);
    if (asyncInputsArray.length) {
      /* eslint no-await-in-loop: "off" */
      for (let i = 0; i < asyncInputsArray.length; i++) {
        if (asyncInputsArray[i] && asyncInputsArray[i].fetch) {
          const { fetch, inputName, type } = asyncInputsArray[i];
          await fetch(did).then(async (inputDataResponse) => {
            const { success, data } = inputDataResponse;
            if (success && data) {
              let templateName = data.templateName || '';
              const templateId = data.templateId || null;
              if (templateId && !templateName) {
                const templates = await new Relay(
                  'template',
                  'fetchAll',
                ).getJson({ type: 'sow' });
                const matchedTemplate = templates?.find(
                  (template) => Number(template.id) === Number(templateId),
                );
                templateName = matchedTemplate?.name || '';
              }
              this.templateService.initAsyncValue(
                inputName,
                {
                  content: data.content || '',
                  templateName,
                  templateId,
                },
                type,
              );
            }
          });
        }
      }
    }
  }

  async updateTemplateServiceSecond() {
    const { showForm } = this.props;
    if (this.templateService.sourceData.length) {
      for (let i = 0; i < this.templateService.sourceData.length; i++) {
        const {
          inputName,
          source,
          value,
          type,
          options: defaultOptions,
        } = this.templateService.sourceData[i];
        const {
          action,
          method,
          args,
          internalData,
          idField,
          optionLabelKey,
          optionLabelKeyBackup,
          paramInternalData,
          paramInternalDataKey,
        } = source;
        let newArgs = args;
        if (paramInternalData && paramInternalDataKey) {
          const responsePathSteps = paramInternalData.split('.');
          let valueArg = { ...this.state };
          responsePathSteps.forEach((pathStep) => {
            valueArg = valueArg[pathStep];
          });
          if (valueArg) {
            newArgs = {
              ...(newArgs || {}),
              [paramInternalDataKey]: valueArg,
            };
          }
        }
        const relay = new Relay(action, method);
        await relay
          .getJson(newArgs)
          .then((options) => {
            if (options) {
              let newOptions = options;
              if (internalData) {
                const pathSteps = internalData.split('.');
                pathSteps.forEach((pathStep) => {
                  if (!isArray(newOptions)) {
                    newOptions = newOptions[pathStep];
                  }
                });
              }
              newOptions = isArray(newOptions)
                ? newOptions
                : Object.values(newOptions);
              newOptions = newOptions
                .map((option) => {
                  const id = option[idField] || option.id;
                  const valueOpt = option[idField] || option.id;
                  let label =
                    option[optionLabelKey] ||
                    option[optionLabelKeyBackup] ||
                    option.name;
                  const email = option?.email || false;
                  label = email ? `${label} (${email})` : label;
                  return {
                    id,
                    value: valueOpt,
                    label,
                    email,
                  };
                })
                .sort((optionA, optionB) =>
                  optionA.label
                    .toLowerCase()
                    .localeCompare(optionB.label.toLowerCase()),
                );
              if (type && type === 'select_witness') {
                newOptions = [...defaultOptions, ...newOptions];
              }
              const [newValue] = newOptions.filter(
                (option) =>
                  Number(option.id) === Number(value) ||
                  Number(option.value) === Number(value),
              );
              this.templateService.formFields =
                this.templateService.formFields.map((formField) => {
                  if (formField.name === inputName) {
                    return { ...formField, options: newOptions };
                  }
                  return formField;
                });
              if (!isNil(newValue)) {
                this.templateService.initAsyncValue(inputName, newValue);
              }
            }
          })
          .catch((error) => {
            return error;
          });
      }
    }

    let newState = {
      ...this.state,
    };
    if (showForm) {
      const formValues = this.templateService.initialValues;
      if (this._initialOrderValue == null) {
        this._initialOrderValue = formValues?.OrderPrice ?? 0;
      }
      newState = {
        ...newState,
        formValues,
        loadingConfigService: false,
      };
    }
    this.setState(newState, () => {
      this.loadDocuments(newState);
    });
  }

  isValid(s) {
    // Create a stack
    const stack = [];
    // Loop through each element in the string
    for (let i = 0; i < s.length; i++) {
      const char = stack[stack.length - 1];
      // if u encounter a starting bracket, push it onto the stack
      if (s[i] === '{') {
        stack.push(s[i]);
        // pop the opening bracket off the stack,
        // if there is a corresponding closing bracket
      } else if (char === '{' && s[i] === '}') {
        stack.pop();
      }
    }
    // Check empty stask
    return !stack.length;
  }

  scrollMissingFunc() {
    const [firstMissingField] = this._missingCache || [];
    if (this.virtualizedInputsRef.current && firstMissingField?.name) {
      this.virtualizedInputsRef.current.scrollToField(
        firstMissingField.name,
        'start',
      );
      return;
    }

    const { meta } = this.state;
    const offset = meta && meta.signatory ? 692.265625 : 475;
    const { current } = this.formViewerRef;
    const { input } = this.missingInputRef;
    if (!current) return;
    // We restart position to the top
    current.scrollTo(0, 0);
    if (input) {
      // We get the topOffset from the top to the shortcode
      const { top } = input.getBoundingClientRect();
      current.scrollTo(0, (top && top - offset) || 0);
    }
  }

  scrollFunc(inputRef) {
    const { meta } = this.state;
    const { signatory } = meta;
    const { current: pdf } = this.pdfViewerRef;

    // 1. Reset position to the top
    pdf?.scrollTo(0, 0);

    // if logic for all inputs
    if (inputRef && Object.values(inputRef).length) {
      const [input] = Object.values(inputRef);
      if (input) {
        const top = input?.getBoundingClientRect()?.top || 0;
        const pdfTop = pdf?.getBoundingClientRect()?.top || 0;
        const typeOffset = signatory ? 200 : 0;
        let offset = 600 + typeOffset;
        offset = pdfTop <= 600 ? typeOffset + 600 : offset;
        offset = pdfTop <= 500 ? typeOffset + 500 : offset;
        offset = pdfTop <= 400 ? typeOffset + 400 : offset;
        offset = pdfTop <= 300 ? typeOffset + 300 : offset;
        offset = pdfTop <= 200 ? typeOffset + 200 : offset;
        offset = pdfTop <= 100 ? typeOffset + 100 : offset;
        const total = top - offset;
        pdf?.scrollTo(0, total || 0);
        this.handleOrangeFocus('add');
      }
    }
  }

  autoFocus() {
    const firstFocusableFieldName = this.getFirstFocusableFieldName();
    if (this.virtualizedInputsRef.current && firstFocusableFieldName) {
      this.virtualizedInputsRef.current.focusField(
        firstFocusableFieldName,
        'start',
      );
      return;
    }

    const { current } = this.formRef;
    if (!current) return;
    const input = current.querySelector(
      'input:not([type="hidden"]), textarea, button, [tabindex]:not([tabindex="-1"])',
    );
    if (!input) return;
    input.focus();
  }

  async loadContent() {
    const { showForm } = this.props;
    const { vat } = this.state;
    const action = showForm ? 'document' : 'template';
    const { did } = this.props;
    const templateRelay = new Relay(action, 'getContent');
    return templateRelay
      .getJson({ did })
      .then((responseContent) => {
        const response = mockContentHelper(responseContent);
        if (response) {
          const subcontractor = response?.meta?.quote?.subcontractor || null;
          const soa = response?.meta?.soa;
          const soamc = response?.meta?.soamc;
          const meta = response?.meta || {};
          const miniBoq = response?.meta?.miniboq;
          const simpleRowQuotePrice = response?.meta?.simpleRowQuotePrice;
          const vatValue = response?.meta?.vat || vat;
          const signature = meta?.signatory ? 'docusign' : 'wet';
          const hasBoq = response?.has_boq;
          const content = response?.content || [];
          return {
            config: content,
            draft: [...JSON.parse(JSON.stringify(content))],
            subcontractor,
            soa,
            soamc,
            miniBoq,
            simpleRowQuotePrice,
            meta,
            signature,
            hasBoq,
            vat: vatValue,
          };
        }
        throw new Error(
          endpointResponseError('retrieving the PDF content data'),
        );
      })
      .catch((e) => ({
        loadingContent: false,
        error: endpointResponseError(e),
      }));
  }

  async loadConfig(config) {
    const { tid, did, showForm } = this.props;
    const paramsToSend = { did };
    if (showForm) {
      const { projectData } = config;
      paramsToSend.tid = tid;
      paramsToSend.pid = projectData?.id;
    }
    const templateRelay = new Relay('template', 'config');
    return templateRelay
      .getJson(paramsToSend)
      .then((responseConfig) => {
        const response = mockConfigHelper(responseConfig);
        if (response) {
          const slugConfig = response?.slug || '';
          this.templateService.slug = slugConfig;
          const nextState = { slug: slugConfig, formConfig: response.data };
          const warningKey = `domesticShortOrderWarningDismissed:${did}`;
          if (
            slugConfig === DOMESTIC_SHORT_ORDER_SLUG &&
            !localStorage.getItem(warningKey)
          ) {
            nextState.openPolicyWarning = {
              id: 'domestic-short-order-warning',
              navTitle: 'warning',
              title: '',
              cancel: null,
              confirm: 'continue',
              description: 'domestic-short-order-warning-desc',
              handleAccept: () => {
                localStorage.setItem(warningKey, '1');
                this.setState({ openPolicyWarning: false });
              },
            };
          }
          this.setState(nextState);
          return {
            ...config,
            formConfig: response.data,
            slug: slugConfig,
          };
        }
        throw new Error(
          endpointResponseError('retrieving the form config data'),
        );
      })
      .catch((error) => {
        const showError = error.toString() || endpointError('loading');
        return { loadingConfig: false, error: showError };
      });
  }

  async loadHeaderFooter(state) {
    const { config, meta } = state;
    const { clinkAccount } = this.props;
    const { values = {} } = meta;
    if (config && config.length) {
      const [document] = config;
      const { header, footer, children, options = {} } = document;
      const numberedDocuments = 'numbered_documents';
      const hasNumberDocuments =
        numberedDocuments in options && options[numberedDocuments];
      const allPages =
        document && document.children ? document.children.length : 0;
      const pages = [];
      const filteredPages =
        document && document.children
          ? document.children.filter((child) => {
              const condition =
                ('conditionalContent' in child || 'uploadedContent' in child) &&
                child.conditionalContent !== '{SubContractorWorks}';
              if (Object.keys(values).length === 0) {
                pages.push(!condition);
                return condition;
              }
              const conditionalShortcode = child.conditionalContent;
              const numberMatch = conditionalShortcode?.match(/\d+/);
              if (numberMatch) {
                const number = numberMatch[0];
                const prefix = `nd_${number}`;
                const targetKey = Object.keys(values).find((key) =>
                  key.startsWith(prefix),
                );
                const result = targetKey ? values[targetKey] : null;
                const newCondition =
                  ('conditionalContent' in child ||
                    'uploadedContent' in child) &&
                  child.conditionalContent !== '{SubContractorWorks}' &&
                  result === null;
                pages.push(!newCondition);
                return newCondition;
              }
              pages.push(!condition);
              return condition;
            }).length
          : 0;

      const total = allPages - filteredPages;

      let nPage = 0;
      const newConfig = [
        {
          ...document,
          children: children.map((child, index) => {
            if (pages[index]) {
              nPage += 1;
            }
            return Config.setHeaderFooter(
              child,
              header,
              footer,
              clinkAccount,
              nPage,
              total,
              hasNumberDocuments,
              meta,
            );
          }),
        },
      ];

      return {
        ...state,
        config: newConfig,
        draft: [...JSON.parse(JSON.stringify(newConfig))],
      };
    }
    return state;
  }

  async loadFileManager() {
    const { tid, did, dispatch, clinkAccount, docType } = this.props;
    const accountId = clinkAccount?.id;
    const approvalType = docType === 'tender' ? 'tender_enquiry' : 'order';
    const getTenderRelay = new Relay('tender', 'fetch');
    return getTenderRelay
      .getJson({ tid })
      .then((response) => {
        if (!response || !response.project_id) {
          throw new Error(endpointResponseError('getting files data'));
        }
        const { project_id: pid } = response;
        const getProjectRelay = new Relay('project', 'getOne');
        return getProjectRelay.getJson({ id: pid, state: 1 });
      })
      .then(async (projectData) => {
        if (!projectData) {
          throw new Error(endpointResponseError('getting files data'));
        }
        dispatch(actions.clink.setSlug(projectData.slug));
        dispatch(actions.clink.setProjectName(projectData.name));

        const [approversWithLevelsResult, assignedApproversResult] =
          await Promise.all([
            dispatch(
              actions.clink.fetchApproversWithLevels({
                account_id: accountId,
                approval_type: approvalType,
                id: did,
                project_id: projectData.id,
              }),
            ),
            docType === 'order'
              ? dispatch(
                  actions.clink.assignedApproversforDocument({
                    pid: projectData.id,
                    did,
                  }),
                )
              : dispatch(
                  actions.clink.assignedApproversTenderInquiry({
                    project_id: projectData.id,
                    tender_inquiry_id: did,
                  }),
                ),
          ]);
        const payload = assignedApproversResult?.payload;

        const approversList = approversWithLevelsResult?.payload?.levels || [];
        const rawAssigned = payload ? Object.values(payload)[0] : null;
        const assignedApprovers = getAssignedApprovers(rawAssigned);
        const assignedApproversRaw = rawAssigned;

        this.setState({
          projectData,
          defaultTender: tid,
          assignedApprovers,
          assignedApproversRaw,
          approversList,
        });

        return {
          projectData,
          defaultTender: tid,
        };
      })
      .catch((error) => {
        const newError = error.toString() || endpointError('fetching');
        return { loadingConfig: false, error: newError };
      });
  }

  async loadDocuments(state) {
    const { config, projectData } = state;
    if (config && config.length && projectData) {
      const { tid, did } = this.props;
      const { tender: projectTenders, id: pid } = projectData;
      return new CategoriesService({ id: tid })
        .getCategories(false)
        .then((categories) => {
          let newCategories = categories;
          if (categories && Array.isArray(categories) && isEmpty(categories)) {
            newCategories = {};
          }

          const tenders = Tenders.setFolders(
            Tenders.createTenders(projectTenders, pid),
            tid,
            pid,
            newCategories,
          );
          const tender = Tenders.getTender(tenders, tid);
          const folders = tender ? tender.folders : [];
          const [document] = config;
          const completeConfig = [
            {
              ...document,
              children: document.children.map((child) =>
                Config.setDocumentsInConfig(did, child, folders),
              ),
            },
          ];
          this.setState({
            config: completeConfig,
            draft: [...JSON.parse(JSON.stringify(completeConfig))],
          });
        })
        .catch((error) => {
          const newError = error.toString() || endpointError('fetching');
          return { loadingConfig: false, error: newError };
        });
    }
    return state;
  }

  async loadScheduleAttendances(state) {
    const { config, soa: soaType, soamc } = state;
    if (config && config.length) {
      const [document] = config;
      const type = (soaType && 'soa') || (soamc && 'soamc') || '';
      const relay = new Relay('template', 'fetchAll');
      return relay
        .getJson({ type })
        .then(async (scheduleOfAttendances) => {
          const [soa] = scheduleOfAttendances;
          const relayJson = new Relay('template', 'getContent');
          const soaJson = await relayJson
            .get({ did: soa && soa.id })
            .then((data) => data.json())
            .catch(() => null);

          const method =
            type === 'soa'
              ? 'setScheduleOfAttendances'
              : 'setScheduleOfAttendancesMC';

          const completeConfig = [
            soaJson && soaJson.content
              ? {
                  ...document,
                  children: document.children.map((child) =>
                    Config[method](child, soaJson.content, soa.id),
                  ),
                }
              : { ...document },
          ];
          return {
            ...state,
            config: completeConfig,
            draft: [...JSON.parse(JSON.stringify(completeConfig))],
          };
        })
        .catch((newError) => ({ loadingContent: false, error: newError }));
    }

    return state;
  }

  async loadLocalMiniBoq(id, fullData) {
    const { config, miniBoqData } = this.state;
    const { did } = this.props;
    const [document] = config;
    const completeConfig = [
      {
        ...document,
        children: document.children.map((child) =>
          Config.setMiniBoq(child, fullData, id),
        ),
      },
    ];
    this.setState(
      {
        config: completeConfig,
        draft: [...JSON.parse(JSON.stringify(completeConfig))],
        miniBoqData: { ...miniBoqData, content: fullData },
      },
      () => {
        const saveRelay = new Relay('template', 'saveContent');
        return saveRelay.patch(fullData, { did: id, order_document_id: did });
      },
    );
  }

  async loadMiniBoq(state) {
    const { did } = this.props;
    const { config } = state;
    if (config && config.length) {
      const [document] = config;
      const relay = new Relay('template', 'fetchAll');
      return relay
        .getJson({ type: 'miniboq', did })
        .then(async (miniBoqInfo) => {
          const [miniBoq] = miniBoqInfo;
          if (!miniBoq) {
            return state;
          }
          const relayJson = new Relay('template', 'getContent');
          const miniBoqJson = await relayJson
            .get({ did: miniBoq && miniBoq.id, order_document_id: did })
            .then((data) => data.json())
            .catch(() => null);

          const completeConfig = [
            miniBoqJson && miniBoqJson.content
              ? {
                  ...document,
                  children: document.children.map((child) =>
                    Config.setMiniBoq(child, miniBoqJson.content, miniBoq.id),
                  ),
                }
              : { ...document },
          ];
          return {
            ...state,
            config: completeConfig,
            draft: [...JSON.parse(JSON.stringify(completeConfig))],
            miniBoqData: { content: miniBoqJson.content, id: miniBoq.id },
          };
        })
        .catch((newError) => ({ loadingContent: false, error: newError }));
    }

    return state;
  }

  loadSimpleRowQuotePrice(state = this.state) {
    const { config, meta, vat } = state;
    if (config && config.length) {
      const { quote = {} } = meta;
      const [document] = config;
      const completeConfig = [
        {
          ...document,
          children: document.children.map((child) =>
            Config.setSimpleRowQuotePrice(child, quote, vat),
          ),
        },
      ];
      return {
        ...state,
        config: completeConfig,
        draft: [...JSON.parse(JSON.stringify(completeConfig))],
      };
    }
    return state;
  }

  loadNumberDocuments(state) {
    const { did } = this.props;
    const { config } = state;
    if (config && config.length) {
      const relay = new Relay('number_document', 'fetchAll');
      return relay.getJson({ did }).then((res) => {
        const { list } = res;
        return { ...state, numberDocuments: list };
      });
    }
    return state;
  }

  loadTotalOfTable(state = this.state) {
    const { config, meta } = state;
    if (config && config.length) {
      const [document] = config;
      const { values = {} } = meta;
      if (inputsToCalculateTotal.some((input) => input in values)) {
        const filteredInputs = inputsToCalculateTotal
          .filter((input) => input in values)
          .map((input) => values[input]);
        const completeConfig = [
          {
            ...document,
            children: document.children.map((child) =>
              Config.setTotalTable(child, filteredInputs),
            ),
          },
        ];
        return {
          ...state,
          config: completeConfig,
          draft: [...JSON.parse(JSON.stringify(completeConfig))],
        };
      }
    }
    return state;
  }

  formatFormValues() {
    const { formValues, formConfig } = this.state;
    const newFormValues = {};

    // Process formValues first
    Object.keys(formValues).forEach((formKey) => {
      let newValue = formValues[formKey];
      if (formKey === 'MclarenEntityContractor' && newValue?.headerLabel) {
        newFormValues.MclarenEntityContractorHeader = newValue.headerLabel;
      }

      if (typeof newValue === 'string') {
        newValue = getTextFromHTML(newValue || '');
      } else if (newValue && typeof newValue === 'object') {
        if (newValue?.showLabel && !isEmpty(newValue.showLabel)) {
          newValue = newValue.showLabel || '';
        } else if ('label' in newValue) {
          newValue = newValue.label || '';
        } else if ('editorHtml' in newValue) {
          newValue = getTextFromHTML(newValue.editorHtml || '');
        } else if ('empty_text' in newValue) {
          newValue = newValue.empty_text;
        } else {
          // TODO: Get this in consideration if we have new input
          newValue = getDateValuesV1(newValue, true);
        }
      }
      if (this.templateService.moneyInputs.includes(formKey)) {
        let isMoney = true;
        formConfig.forEach((fieldConfig) => {
          const config = Object.values(fieldConfig).find(
            (field) => field.code === `{${formKey}}`,
          );
          if (config && config.just_number) {
            isMoney = false;
          }
        });
        newValue = isMoney ? pennyToCurrency(newValue) : newValue;
      }
      newFormValues[formKey] = newValue;
    });

    // Also include initial values for fields that might not be in formValues yet
    // This ensures shortcodes are available even if the field hasn't been set
    if (this.templateService.initialValues) {
      Object.keys(this.templateService.initialValues).forEach((formKey) => {
        if (!(formKey in newFormValues)) {
          const initialValue = this.templateService.initialValues[formKey];
          if (initialValue !== null && initialValue !== undefined) {
            let newValue = initialValue;
            if (typeof newValue === 'string') {
              newValue = getTextFromHTML(newValue || '');
            } else if (typeof newValue === 'object' && newValue?.label) {
              newValue = newValue.label || '';
            }
            newFormValues[formKey] = newValue;
          }
        }
      });
    }

    if (
      !newFormValues.MclarenEntityContractorHeader &&
      formValues.MclarenEntityContractor?.headerLabel
    ) {
      newFormValues.MclarenEntityContractorHeader =
        formValues.MclarenEntityContractor.headerLabel;
    }

    return newFormValues;
  }

  /**
   * Transform shortcode values for McLaren templates
   * Applies conditional text transformations based on incorporation type
   */
  transformMcLarenShortcodes(shortcodes) {
    if (!shortcodes || !Object.keys(shortcodes).length) {
      return shortcodes;
    }

    const { formValues, formConfig } = this.state;
    const { formFields, initialValues } = this.templateService;

    // Check if this is a McLaren template by looking for McLaren-specific patterns
    const isMcLaren = formFields.some(
      (field) =>
        field.label &&
        (field.label.includes('(Included in Doc)') ||
          field.label.includes('(Asite)')),
    );

    if (!isMcLaren) {
      return shortcodes;
    }

    const transformed = { ...shortcodes };

    // Helper to get field definition by shortcode code or form field name
    const getFieldByCode = (code) => {
      // Try to find by code first (e.g., "ND12" or "{ND12}")
      let codeToSearch = code;
      if (!codeToSearch.startsWith('{')) {
        codeToSearch = `{${codeToSearch}}`;
      }
      let foundField = formFields.find((f) => f.code === codeToSearch);

      // If not found, try to find by form field name (e.g., "nd_12")
      if (!foundField) {
        foundField = formFields.find((f) => f.name === code);
      }

      // Try case-insensitive match
      if (!foundField) {
        foundField = formFields.find((f) => {
          const fieldCode = f.code
            ? f.code.replace(/[{}]/g, '').toLowerCase()
            : '';
          const fieldName = f.name ? f.name.toLowerCase() : '';
          const searchCode = code.toLowerCase();
          return fieldCode === searchCode || fieldName === searchCode;
        });
      }

      // Try format conversion (nd_12 <-> ND12)
      if (!foundField) {
        const altFormat = code.toLowerCase().startsWith('nd_')
          ? code.toUpperCase().replace('nd_', 'ND')
          : code.toLowerCase().replace('nd', 'nd_');
        foundField = formFields.find((f) => {
          const fieldCode = f.code ? f.code.replace(/[{}]/g, '') : '';
          return (
            fieldCode.toLowerCase() === altFormat.toLowerCase() ||
            f.name?.toLowerCase() === altFormat.toLowerCase()
          );
        });
      }

      return foundField;
    };

    // Helper to get parent value from formatted shortcodes
    const getParentValue = (parentCode) => {
      // parentCode might be "nd_12" (field name format) but formValues uses "ND12" (uppercase, no underscore)
      // Convert parentCode to uppercase format for formValues lookup
      const normalizedParentCode = parentCode
        .toUpperCase()
        .replace('ND_', 'ND')
        .replace('_', '');

      // First, try to get directly from formValues using normalized code
      if (formValues[normalizedParentCode]) {
        const value = formValues[normalizedParentCode];
        if (value === 'Yes' || value === 'No') {
          return value;
        }
      }

      // Also try the original parentCode format
      if (formValues[parentCode]) {
        const value = formValues[parentCode];
        if (value === 'Yes' || value === 'No') {
          return value;
        }
      }

      // Try to get from transformed (already processed values)
      if (transformed[normalizedParentCode]) {
        const value = transformed[normalizedParentCode];
        if (value === 'Yes' || value === 'No') {
          return value;
        }
      }

      // Try to get from original shortcodes (before transformation)
      if (shortcodes[normalizedParentCode]) {
        const value = shortcodes[normalizedParentCode];
        if (value === 'Yes' || value === 'No') {
          return value;
        }
      }

      // Try to find parent field and get value from formValues
      const parentField =
        getFieldByCode(normalizedParentCode) || getFieldByCode(parentCode);
      if (parentField && formValues[parentField.name]) {
        const valueFromForm = formValues[parentField.name];

        if (valueFromForm === 'Yes' || valueFromForm === 'No') {
          return valueFromForm;
        }

        if (typeof valueFromForm === 'object' && valueFromForm?.label) {
          return valueFromForm.label;
        }
        if (typeof valueFromForm === 'object' && valueFromForm?.showLabel) {
          return valueFromForm.showLabel;
        }
        // Handle select fields - convert index to label if needed
        if (typeof valueFromForm === 'number' && parentField.options) {
          const option = parentField.options.find(
            (opt) => opt.id === valueFromForm || opt.value === valueFromForm,
          );
          if (option) {
            return option.label || option.showLabel || option.value;
          }
        }
        return typeof valueFromForm === 'string' ? valueFromForm : null;
      }

      return null;
    };

    // First, ensure all formFields with initial values are in the shortcodes
    formFields.forEach((field) => {
      if (field.name && !(field.name in transformed)) {
        // Check if there's an initial value
        const initialValue = initialValues?.[field.name];
        if (initialValue !== null && initialValue !== undefined) {
          let value = initialValue;
          if (typeof value === 'object' && value?.label) {
            value = value.label;
          } else if (typeof value === 'object' && value?.showLabel) {
            value = value.showLabel;
          }
          transformed[field.name] = value;
        } else if (field.parent_code && field.reference) {
          // For incorporation fields (hidden fields with parent_code), initialize with empty string
          // They will be transformed based on parent value below
          transformed[field.name] = '';
        }
      }
    });

    // First, ensure all formFields with initial values are in the shortcodes
    // Also add incorporation fields (hidden fields with parent_code) even if they don't have initial values
    formFields.forEach((field) => {
      if (field.name && !(field.name in transformed)) {
        // Check if there's an initial value
        const initialValue = initialValues?.[field.name];
        if (initialValue !== null && initialValue !== undefined) {
          let value = initialValue;
          if (typeof value === 'object' && value?.label) {
            value = value.label;
          } else if (typeof value === 'object' && value?.showLabel) {
            value = value.showLabel;
          }
          transformed[field.name] = value;
        } else if (field.parent_code && field.reference) {
          // For incorporation fields (hidden fields with parent_code), initialize with empty string
          // They will be transformed based on parent value below
          transformed[field.name] = '';
        }
      }
    });

    // Transform each shortcode
    // Also process incorporation fields that might not be in transformed yet
    const allKeysToProcess = new Set(Object.keys(transformed));
    formFields.forEach((field) => {
      if (field.name && field.parent_code && field.reference) {
        allKeysToProcess.add(field.name);
        if (!(field.name in transformed)) {
          transformed[field.name] = '';
        }
      }
    });

    Array.from(allKeysToProcess).forEach((shortcodeKey) => {
      // shortcodeKey is the form field name (e.g., "nd_12")
      // Find the field by name first
      const field = formFields.find((f) => f.name === shortcodeKey);
      if (!field) {
        // Try to find by code if name doesn't match
        const fieldByCode = formFields.find((f) => {
          const code = f.code ? f.code.replace(/[{}]/g, '') : '';
          return (
            code.toLowerCase() === shortcodeKey.toLowerCase() ||
            code.toLowerCase().replace('nd', 'nd_') ===
              shortcodeKey.toLowerCase()
          );
        });
        if (fieldByCode) {
          // Skip transformation for base fields - only transform incorporation fields
          // Incorporation fields have parent_code and reference properties
          if (fieldByCode.parent_code && fieldByCode.reference) {
            // This is an incorporation field, it will be handled in the formConfig section
          }
          // Base fields (like nd_12) should NOT be transformed - keep Yes/No as is
        }
        return;
      }

      // Get fieldCode for use in formConfig matching
      const fieldCode = field.code ? field.code.replace(/[{}]/g, '') : null; // e.g., "ND12"

      // Skip transformation for base fields (nd_12) - only transform incorporation fields (nd_12_incorporation)
      // Incorporation fields have parent_code and reference properties
      if (field.parent_code && field.reference) {
        // This is an incorporation field, skip the base field transformation
        // It will be handled in the formConfig section below
      } else {
        // This is a base field - do NOT transform it, keep Yes/No as is
        // Only transform if it's explicitly an incorporation field with reference="json"
      }

      // Handle Asite/Attachment link shortcodes
      // Check if this field has parent_code and reference in formConfig
      // Also check if this is a _link field itself (e.g., "nd_01_asite_link")
      if (formConfig && formConfig.length) {
        for (const configItem of formConfig) {
          for (const configKey in configItem) {
            if (Object.prototype.hasOwnProperty.call(configItem, configKey)) {
              const configField = configItem[configKey];
              // Match by the field's code (e.g., "{ND01_LINK}") or by config key matching shortcodeKey
              const matchesCode =
                fieldCode && configField.code === `{${fieldCode}}`;
              const matchesConfigKey = configKey === shortcodeKey;

              if (
                (matchesCode || matchesConfigKey) &&
                configField.parent_code &&
                configField.reference
              ) {
                const referenceType = (
                  configField.reference || ''
                ).toLowerCase();
                const parentCode = configField.parent_code;
                const parentValue = getParentValue(parentCode);
                const conditionalValue = configField.conditional_value || 'Yes';
                const isConditionMet = parentValue === conditionalValue;

                // Handle JSON type incorporation messages (e.g., ND12_INCORPORATION)
                if (referenceType === 'json') {
                  // Use transformation metadata if available, otherwise use defaults
                  const yesText =
                    configField.transformation?.yes_text ||
                    'included in document';
                  const noText =
                    configField.transformation?.no_text ||
                    'not included in document';

                  if (isConditionMet) {
                    transformed[shortcodeKey] = yesText;
                  } else {
                    transformed[shortcodeKey] = noText;
                  }
                  // Also add under code key for DocumentBuilder
                  if (fieldCode) {
                    transformed[fieldCode] = transformed[shortcodeKey];
                  }
                } else if (referenceType === 'asite') {
                  // Use transformation metadata if available, otherwise use defaults
                  const yesText =
                    configField.transformation?.yes_text ||
                    'available via Asite';
                  const noText =
                    configField.transformation?.no_text ||
                    'not available via Asite';

                  const hasParentValue =
                    parentValue !== undefined &&
                    parentValue !== null &&
                    parentValue !== '';
                  if (hasParentValue) {
                    if (!isConditionMet) {
                      transformed[shortcodeKey] = noText;
                    } else {
                      transformed[shortcodeKey] = yesText;
                    }
                  }
                  // Also add under code key for DocumentBuilder
                  if (fieldCode) {
                    transformed[fieldCode] = transformed[shortcodeKey];
                  }
                } else if (referenceType === 'attachment') {
                  // Use transformation metadata if available, otherwise use defaults
                  const yesText =
                    configField.transformation?.yes_text ||
                    'attached in document';
                  const noText =
                    configField.transformation?.no_text ||
                    'not attached in document';

                  if (isConditionMet) {
                    transformed[shortcodeKey] = yesText;
                  } else {
                    transformed[shortcodeKey] = noText;
                  }
                  // Also add under code key for DocumentBuilder
                  if (fieldCode) {
                    transformed[fieldCode] = transformed[shortcodeKey];
                  }
                }
                break;
              }
            }
          }
        }
      }
    });

    // Also process incorporation fields directly from formFields (not just through formConfig)
    formFields.forEach((field) => {
      if (field.name && field.parent_code && field.reference) {
        const referenceType = (field.reference || '').toLowerCase();
        const parentCode = field.parent_code;
        const parentValue = getParentValue(parentCode);
        const conditionalValue = field.conditional_value || 'Yes';
        const isConditionMet = parentValue === conditionalValue;
        // Extract fieldCode from code property (remove braces if present)
        let fieldCode = null;
        if (field.code) {
          fieldCode = field.code.replace(/[{}]/g, '');
        } else if (field.name) {
          fieldCode = field.name.toUpperCase();
        }

        // Ensure the field is in transformed
        if (!(field.name in transformed)) {
          transformed[field.name] = '';
        }

        if (referenceType === 'json') {
          // Use transformation metadata if available, otherwise use defaults
          const yesText =
            field.transformation?.yes_text || 'included in document';
          const noText =
            field.transformation?.no_text || 'not included in document';

          const hasParentValue =
            parentValue !== undefined &&
            parentValue !== null &&
            parentValue !== '';
          if (hasParentValue) {
            if (!isConditionMet) {
              transformed[field.name] = noText;
            } else {
              transformed[field.name] = yesText;
            }
            // Also add under code key for DocumentBuilder (without braces)
            if (fieldCode) {
              transformed[fieldCode] = transformed[field.name];
            }
          }
        } else if (referenceType === 'asite') {
          // Handle Asite type
          const yesText =
            field.transformation?.yes_text || 'available via Asite';
          const noText =
            field.transformation?.no_text || 'not available via Asite';

          const hasParentValue =
            parentValue !== undefined &&
            parentValue !== null &&
            parentValue !== '';
          if (hasParentValue) {
            if (!isConditionMet) {
              transformed[field.name] = noText;
            } else {
              transformed[field.name] = yesText;
            }
            // Also add under code key for DocumentBuilder (without braces)
            if (fieldCode) {
              transformed[fieldCode] = transformed[field.name];
            }
          }
        } else if (referenceType === 'attachment') {
          // Handle Attachment type
          const yesText =
            field.transformation?.yes_text || 'attached in document';
          const noText =
            field.transformation?.no_text || 'not attached in document';

          if (isConditionMet) {
            transformed[field.name] = yesText;
          } else {
            transformed[field.name] = noText;
          }
          if (fieldCode) {
            transformed[fieldCode] = transformed[field.name];
          }
        }
      }
    });

    return transformed;
  }

  replaceShortcodes(shortcodes) {
    if (!shortcodes || (shortcodes && !Object.keys(shortcodes).length)) {
      return {};
    }
    const [firstKey, ...restKeys] = Object.keys(shortcodes);
    const { [firstKey]: firstValue, ...restObj } = shortcodes;

    const returnVal = { [firstKey]: firstValue };
    restKeys.forEach((shortcode) => {
      if (
        firstValue &&
        shortcodes[shortcode] &&
        includes(firstValue, `{${shortcode}}`)
      ) {
        returnVal[firstKey] = replace(
          firstValue,
          `{${shortcode}}`,
          shortcodes[shortcode],
        );
      }
    });
    return { ...returnVal, ...this.replaceShortcodes(restObj) };
  }

  /**
   * Process config to replace hardcoded McLaren text with dynamic values
   * Recursively processes the config tree to find and replace hardcoded text in table rows
   */
  processMcLarenConfigText(config, shortcodes) {
    try {
      if (!config || !Array.isArray(config)) {
        return config;
      }

      if (!shortcodes || !Object.keys(shortcodes).length) {
        return config;
      }

      return config.map((item) => {
        if (!item) return item;

        const processedItem = { ...item };

        // Process children recursively
        if (item.children && Array.isArray(item.children)) {
          // Check if this is a table row (by type or className)
          const isTableRow =
            item.type === 'row' ||
            (item.props &&
              item.props.className &&
              (item.props.className.includes('table-row') ||
                item.props.className.includes('preliminaries')));

          if (isTableRow) {
            // Process table row - find ND reference and replace hardcoded text
            processedItem.children = item.children.map((column) => {
              if (!column || !column.children) return column;

              const processedColumn = { ...column };

              // Check if this column contains hardcoded text
              if (Array.isArray(column.children)) {
                processedColumn.children = column.children.map((child) => {
                  // Only process string children
                  if (typeof child !== 'string') return child;

                  // Hardcoded text patterns to replace - match more variations
                  const textPatterns = [
                    { pattern: /Available via A-Site/i, type: 'asite' },
                    { pattern: /Available via Asite/i, type: 'asite' },
                    { pattern: /available via A-Site/i, type: 'asite' },
                    { pattern: /available via Asite/i, type: 'asite' },
                    { pattern: /Included in Document/i, type: 'json' },
                    { pattern: /included in Document/i, type: 'json' },
                    { pattern: /Included in document/i, type: 'json' },
                    { pattern: /included in document/i, type: 'json' },
                    { pattern: /Attached in Document/i, type: 'attachment' },
                    { pattern: /attached in Document/i, type: 'attachment' },
                    { pattern: /Attached in document/i, type: 'attachment' },
                    { pattern: /attached in document/i, type: 'attachment' },
                  ];

                  let replaced = false;
                  let replacementValue = child;

                  for (const { pattern, type } of textPatterns) {
                    if (pattern.test(child)) {
                      // Find ND reference in the same row
                      const ndRef = this.findNDInRow(item.children);
                      if (ndRef) {
                        // Convert ND12 to nd_12 format (form field name)
                        const shortcodeKey = ndRef
                          .toLowerCase()
                          .replace('nd', 'nd_');

                        // Also try the code format (ND12) in case shortcodes use that
                        const codeKey = ndRef;

                        // Helper to ensure we return a string value
                        const getStringValue = (value) => {
                          if (value === null || value === undefined)
                            return null;
                          if (typeof value === 'string') return value;
                          if (value && typeof value === 'object') {
                            // Handle object values (like {label: "text"})
                            return (
                              value.label ||
                              value.showLabel ||
                              value.value ||
                              String(value)
                            );
                          }
                          return String(value);
                        };

                        // Debug: log what we're trying to replace
                        // console.log('Replacing text:', child, 'ND:', ndRef, 'Type:', type, 'Shortcode keys available:', Object.keys(shortcodes).filter(k => k.includes(shortcodeKey) || k.includes(codeKey)));

                        // For JSON type, use the base ND shortcode
                        if (type === 'json') {
                          // Try form field name first (nd_12)
                          if (shortcodes[shortcodeKey]) {
                            replacementValue = getStringValue(
                              shortcodes[shortcodeKey],
                            );
                            if (replacementValue) {
                              replaced = true;
                              break;
                            }
                          }
                          // Try code format (ND12)
                          if (!replaced && shortcodes[codeKey]) {
                            replacementValue = getStringValue(
                              shortcodes[codeKey],
                            );
                            if (replacementValue) {
                              replaced = true;
                              break;
                            }
                          }
                        }
                        // For Asite/Attachment, try the _link shortcode first
                        else if (type === 'asite') {
                          const asiteKey = `${shortcodeKey}_asite_link`;
                          if (shortcodes[asiteKey]) {
                            replacementValue = getStringValue(
                              shortcodes[asiteKey],
                            );
                            if (replacementValue) {
                              replaced = true;
                              break;
                            }
                          }
                          // Try base shortcode
                          if (!replaced && shortcodes[shortcodeKey]) {
                            replacementValue = getStringValue(
                              shortcodes[shortcodeKey],
                            );
                            if (replacementValue) {
                              replaced = true;
                              break;
                            }
                          }
                          // Try code format
                          if (!replaced && shortcodes[codeKey]) {
                            replacementValue = getStringValue(
                              shortcodes[codeKey],
                            );
                            if (replacementValue) {
                              replaced = true;
                              break;
                            }
                          }
                        } else if (type === 'attachment') {
                          const attachmentKey = `${shortcodeKey}_attachment_link`;
                          if (shortcodes[attachmentKey]) {
                            replacementValue = getStringValue(
                              shortcodes[attachmentKey],
                            );
                            if (replacementValue) {
                              replaced = true;
                              break;
                            }
                          }
                          // Try base shortcode
                          if (!replaced && shortcodes[shortcodeKey]) {
                            replacementValue = getStringValue(
                              shortcodes[shortcodeKey],
                            );
                            if (replacementValue) {
                              replaced = true;
                              break;
                            }
                          }
                          // Try code format
                          if (!replaced && shortcodes[codeKey]) {
                            replacementValue = getStringValue(
                              shortcodes[codeKey],
                            );
                            if (replacementValue) {
                              replaced = true;
                              break;
                            }
                          }
                        }
                      } else {
                        // Debug: log when ND is not found
                        // console.log('ND reference not found for text:', child);
                      }
                    }
                  }

                  // Always return a string - use original if replacement failed
                  return replaced && replacementValue
                    ? String(replacementValue)
                    : child;
                });
              }

              return processedColumn;
            });
          } else {
            // Not a table row, process recursively
            processedItem.children = this.processMcLarenConfigText(
              item.children,
              shortcodes,
            );
          }
        }

        return processedItem;
      });
    } catch (configError) {
      // If there's an error, return the original config to prevent breaking the page
      console.error('Error processing McLaren config text:', configError);
      return config;
    }
  }

  /**
   * Find ND reference (like "ND12") in a table row's children
   */
  findNDInRow(rowChildren) {
    try {
      if (!rowChildren || !Array.isArray(rowChildren)) return null;

      for (const column of rowChildren) {
        if (column && column.children && Array.isArray(column.children)) {
          const text = Array.isArray(column.children)
            ? column.children.join(' ')
            : String(column.children || '');
          const ndMatch = text.match(/ND(\d+)/i);
          if (ndMatch) {
            return `ND${ndMatch[1].padStart(2, '0')}`;
          }
        }
      }
      return null;
    } catch (findError) {
      console.error('Error finding ND in row:', findError);
      return null;
    }
  }

  applyObserverActions(name, currentValue, values, callback = () => {}) {
    if (this.templateService.observerInputs.length) {
      this.templateService.observerInputs.forEach((observerInput) => {
        if (observerInput.inputName === name) {
          const objectValue = this.templateService.observerCallback(
            name,
            currentValue,
            observerInput,
            values,
          );
          const [newValue] = Object.values(objectValue);
          callback(observerInput.inputObserver, newValue);
        }
      });
    }
  }

  async refreshDocument() {
    this.setState(async (prevState) => {
      this.loadDocuments(prevState);
      return {};
    });
  }

  async triggerLoading(callback = () => null) {
    const { showForm } = this.props;
    this.setState(
      {
        loadingContent: true,
        loadingConfig: true,
        loadingConfigService: showForm,
      },
      () => {
        callback();
      },
    );
  }

  render() {
    const {
      vat,
      draft,
      loadingContent,
      loadingConfig,
      loadingConfigService,
      defaultTender,
      projectData,
      error,
      formValues,
      formErrors,
      formConfig,
      inputFocused,
      slug,
      subcontractor,
      loadingSOA,
      signature,
      meta,
      openWitness,
      openError,
      openPolicyWarning,
      dataref,
      missingHighlight,
      isDocumentUpdated,
      numberDocuments,
      assignedApprovers,
      assignedApproversRaw,
      approversList,
    } = this.state;
    const { did, showForm, docType, tid, clinkAccount } = this.props;
    const status = docType === 'tender' ? meta?.status : meta?.quote?.status;

    const { formFields: fields, mainSubcontractor } = this.templateService;

    const useSignature = [signature, this.handleSignatureChange];
    const inputRefFocused = inputFocused ? this.inputRef : null;
    if (
      this._shortcodesCache === undefined ||
      this._shortcodesCachedFormValues !== formValues ||
      this._shortcodesCachedFormConfig !== formConfig ||
      this._shortcodesCachedDraft !== draft
    ) {
      let nextShortcodes = this.formatFormValues();
      nextShortcodes = this.transformMcLarenShortcodes(nextShortcodes);
      nextShortcodes = this.replaceShortcodes(nextShortcodes);
      this._shortcodesCache = nextShortcodes;
      this._shortcodesCachedFormValues = formValues;
      this._shortcodesCachedFormConfig = formConfig;
      this._shortcodesCachedDraft = draft;
    }
    const shortcodesVals = this._shortcodesCache;

    // ref missing inputs
    // find first item in array fields that has no value in formValues
    if (
      this._missingCache === undefined ||
      this._missingCachedFields !== fields ||
      this._missingCachedFormValues !== formValues ||
      this._missingCachedFormErrors !== formErrors ||
      this._missingCachedHighlight !== missingHighlight
    ) {
      this._missingCache =
        (missingHighlight &&
          fields
            .filter(
              (field) =>
                field?.type !== 'hidden' && field?.type !== 'filemanager',
            )
            .filter((field) => {
              if (field.type === 'editor') {
                return (
                  (isStringFunc(formValues[field.name]) &&
                    !Boolean(formValues[field.name])) ||
                  (isObject(formValues[field.name]) &&
                    !Boolean(formValues[field.name].editorHtml))
                );
              }
              return !formValues[field.name];
            })) ||
        [];
      this._missingCachedFields = fields;
      this._missingCachedFormValues = formValues;
      this._missingCachedFormErrors = formErrors;
      this._missingCachedHighlight = missingHighlight;
    }
    const [firstField] = this._missingCache;
    const missingInputRefFocused = firstField
      ? { [firstField.name]: this.missingInputRef }
      : null;

    const handleUpdateAttendance = (idSoa, content) => {
      this.setState({ loadingSOA: true }, async () => {
        const saveRelay = new Relay('template', 'saveContent');
        await saveRelay
          .patch(content, { did: idSoa })
          .then(() =>
            this.loadScheduleAttendances({ ...this.state })
              .then((newState) =>
                this.setState({ ...newState, loadingSOA: false }),
              )
              .catch(() => this.setState({ loadingSOA: false })),
          )
          .catch(() => this.setState({ loadingSOA: false }));
      });
    };

    const valuesToFilter = this._getValuesToFilter(fields, signature);

    let panelRight = <Skeleton width={940} height={1000} />;
    const heightDocument = meta?.signatory ? 1124 : 1022;
    if (!loadingContent) {
      // Config processing is disabled due to structure issues
      // The runtime updates work via transformMcLarenShortcodes for shortcodes like {ND12}
      // For hardcoded text replacement, we need to use shortcodes in the template instead
      const processedDraft = draft;

      panelRight =
        processedDraft && processedDraft.length ? (
          <ClinkPDF
            vat={vat}
            config={processedDraft}
            shortcodes={shortcodesVals}
            inputFocused={inputFocused}
            handleConfigChange={this.handleConfigChange}
            handleUpdateAttendance={handleUpdateAttendance}
            handleLocalMiniBoq={this.loadLocalMiniBoq}
            handleUpdateVat={this.handleUpdateVat}
            pdfViewerRef={this.pdfViewerRef}
            inputRef={inputRefFocused}
            loadingSOA={loadingSOA}
            heightDocument={heightDocument}
            formValues={formValues}
            formFields={fields}
          />
        ) : (
          <div className="min-height-600" />
        );
    }
    const handleSave = () => this.handleConfigSave();
    const handleApprovalConfirmation = (email, varianceExplanation) =>
      this.handleRequestApproval(email, varianceExplanation);
    const handleApproveOrRejectOrder = (approver_id, order_status, comment) =>
      this.handleApproveOrRejectOrder(approver_id, order_status, comment);
    const handleRejectionAcknowledge = () => this.handleRejectionAcknowledge();
    const handleSend = () => this.handleSend();

    if (
      this._percentageCache === undefined ||
      this._percentageCachedFormValues !== formValues ||
      this._percentageCachedValuesToFilter !== valuesToFilter
    ) {
      this._percentageCache = this.templateService.getFormPercentage(
        formValues,
        valuesToFilter,
      );
      this._percentageCachedFormValues = formValues;
      this._percentageCachedValuesToFilter = valuesToFilter;
    }
    const formPercentage = this._percentageCache;

    const canSend = meta?.can_send || true;
    const docusignSendEmail =
      (mainSubcontractor && formValues[mainSubcontractor]) || false;

    const [currentTender] =
      (projectData &&
        projectData.tender &&
        projectData.tender.filter((t) => Number(t.id) === Number(tid))) ||
      [];
    const tenderId = (currentTender && currentTender.id) || '';

    const fileManagerButton = (
      fileManagerConfig,
      buttonDesign,
      testIdSuffix = 'appendix',
    ) =>
      showForm && (
        <FileManagerModal
          tenderAddendum={slug === TA_SLUG ? did : null}
          projectData={projectData}
          defaultTender={defaultTender}
          callback={this.refreshDocument}
          formConfig={fileManagerConfig}
          buttonDesign={buttonDesign}
          testIdSuffix={testIdSuffix}
        />
      );
    return (
      <>
        <SendDocumentModal orders handleSend={this.handleSend} />
        {error && <Alert variant="danger">{error}</Alert>}
        <Modal open={openWitness} setOpen={this.openWitnessModal}>
          <WitnessForm
            did={did}
            open={openWitness}
            dataref={dataref}
            subcontractor={subcontractor}
            initPage={this.initPage}
            triggerLoading={this.triggerLoading}
            openWitnessModal={this.openWitnessModal}
          />
        </Modal>
        <Modal
          style={{ width: '600px' }}
          open={openError}
          setOpen={this.openErrorModal}
        >
          <ErrorContent
            setOpen={this.openErrorModal}
            slug={projectData && projectData.slug}
            tid={tenderId}
          />
        </Modal>
        <Modal
          style={{ width: '600px' }}
          open={openPolicyWarning}
          setOpen={(value) =>
            this.setState({ openPolicyWarning: value || false })
          }
        />
        <Page
          meta={meta}
          actionButtons
          showForm={showForm}
          canSend={canSend}
          docusignSendEmail={docusignSendEmail}
          projectData={projectData}
          formPercentage={formPercentage}
          defaultTender={defaultTender}
          handleConfigSave={handleSave}
          handleApprovalRequest={handleApprovalConfirmation}
          handleApproveOrRejectOrder={handleApproveOrRejectOrder}
          handleRejectionAcknowledge={handleRejectionAcknowledge}
          handleSend={handleSend}
          slug={slug}
          did={did}
          errorStatus={error}
          docType={docType}
          subcontractor={subcontractor}
          loadingConfigService={loadingConfigService}
          callback={this.refreshDocument}
          signature={signature}
          info={clinkAccount}
          setMissingHighlight={this.setMissingHighlight}
          approversList={approversList}
          assignedApprovers={assignedApprovers}
          assignedApproversRaw={assignedApproversRaw}
          isDocumentUpdated={isDocumentUpdated}
          status={status}
          initPage={this.initPage}
        >
          <ContainerMui
            id="container-mui"
            sx={{ padding: '0 !important' }}
            className="edit-PDF"
            maxWidth={false}
          >
            <Grid2 container spacing={2}>
              <Grid2 size={4}>
                <SignatureSection
                  meta={meta}
                  useSignature={useSignature}
                  status={status}
                />
                <div className="panel-left">
                  <FormConfig
                    docType={docType}
                    service={this.templateService}
                    showForm={showForm}
                    loadingConfig={loadingConfig}
                    loadingConfigService={loadingConfigService}
                    updateTemplateServiceFirst={this.updateTemplateServiceFirst}
                    updateTemplateServiceSecond={
                      this.updateTemplateServiceSecond
                    }
                    numberDocuments={numberDocuments}
                    applyObserverActions={this.applyObserverActions}
                    formRef={this.formRef}
                    formErrors={formErrors}
                    signature={signature}
                    formValues={formValues}
                    missingHighlight={missingHighlight}
                    missingInputRefFocused={missingInputRefFocused}
                    formViewerRef={this.formViewerRef}
                    virtualizedInputsRef={this.virtualizedInputsRef}
                    fileManagerButton={fileManagerButton}
                  />
                </div>
                {fileManagerButton(true)}
              </Grid2>
              <Grid2 size={8}>
                {/*should be like {meta?.signatory ? <DocHeader meta={meta} /> : null} for docusign only*/}
                {docType && docType === 'order' && <DocHeader meta={meta} />}
                <div className="panel-right">
                  <div>{panelRight}</div>
                </div>
              </Grid2>
            </Grid2>
          </ContainerMui>
        </Page>
      </>
    );
  }
}

function WrapperDocumentCreator({
  docType,
  showForm,
  project,
  clinkAccount,
  dispatch,
}) {
  const { tenderId: tid, templateId: did } = useParams();

  if (clinkAccount && !clinkAccount.id) {
    return null;
  }
  return (
    <DocumentCreator
      tid={tid}
      did={did}
      docType={docType}
      showForm={showForm}
      projectRedux={project}
      clinkAccount={clinkAccount}
      dispatch={dispatch}
    />
  );
}

const mapStateToProps = (state) => {
  return {
    project: state.project,
    clinkAccount: state.clinkAccount,
  };
};

export default connect(mapStateToProps)(WrapperDocumentCreator);
