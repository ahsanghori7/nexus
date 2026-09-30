import find from 'lodash/find';
import parseCurrency, { parseFloatVal } from 'v2/helpers/currency';
import { expiredDate } from 'v2/helpers/date';
import status from 'store/reducers/common/constants';
import { OTHER, ROLE_CHECKER } from 'v2/helpers/prequal/organization';
import { CUSTOM_CERTIFICATE } from 'v2/helpers/prequal/documents';

const YEAR = new Date().getFullYear();
const INITIAL_TURNOVER = {
  id: null,
  year: String(YEAR),
  value: '',
  active_trading: false,
  profit_before_tax: 0,
  initialized: false,
};

const getNotLoadedDefaults = (defaults = [], loaded = []) =>
  [...defaults].filter((d) => {
    const loadedDocuments = loaded.map((i) => i.label.toLowerCase());
    const loadedCheckingLabel = loadedDocuments.includes(d.label.toLowerCase());
    const loadedCheckingValue = loadedDocuments.includes(d.value.toLowerCase());
    return !(loadedCheckingLabel || loadedCheckingValue);
  });

const initDefaultsValues = (section, defaultValues, loaded) => {
  let defaults = [];
  try {
    defaults = [...defaultValues[section]];
  } catch (error) {
    // Depending on the preq version, 'defaultValues' can be an array or an object
    // So, when we try to copy the values from an array and this throws an exception, it should be an object
    // And from that object, we get the array that we need.
    const defaultsObject = { ...defaultValues[section] };
    defaults = defaultsObject.options
      ? [...defaultsObject.options].map((o) => ({
          id: o.id,
          value: o.name,
          label: o.name,
        }))
      : [];
  }
  return section in defaultValues ? getNotLoadedDefaults(defaults, loaded) : [];
};

const setRequestedBy = (requests, label) => {
  const [lastRequest] = [...requests]
    .filter((r) => !r.request_fullfilled_at && r.label === label)
    .sort(
      (dateA, dateB) =>
        new Date(dateB.requested_at) - new Date(dateA.requested_at),
    );
  return lastRequest ? lastRequest.main_contractor : '';
};

const changeLoading = (state = null, severity = false, message = '') => {
  let type = status.IDLE_STATUS;
  if (severity) {
    switch (severity) {
      case 'error':
        type = status.FAILURE_STATUS;
        break;
      default: // info
        type = status.LOADING_STATUS;
        break;
    }
  }

  const result = { severity, message, type };
  if (state) {
    state.statusPreq = result;
  }
  return result;
};

const initPercentage = (state) => {
  const currentYear = new Date().getFullYear();
  const [currentTurnover] = state.turnover.filter(
    (ct) => Number(ct.year) === Number(currentYear),
  );
  const sumTurnover = Boolean(
    currentTurnover && parseFloatVal(currentTurnover.value),
  );
  const companyInfo = state.company_information;
  const sumMin = Boolean(parseFloat(companyInfo.min_order_value));
  const sumMax = Boolean(parseFloat(companyInfo.max_order_value));
  const sumNumEmployees = Boolean(companyInfo.num_current_employees);

  let documentPercentage = false;
  const insurances = [...state.insurances];
  if (insurances.length) {
    const validInsurance = insurances.filter((i) => {
      return i.date && !expiredDate(new Date(i.date));
    });
    documentPercentage = Boolean(validInsurance.length);
  }

  const financeSection = {
    sumTurnover,
    sumMin,
    sumMax,
    sumNumEmployees,
  };
  // Give the 'documents' and 'references' section a double weight to have an even value for sections an avoid work with decimals
  const percentageSections = [
    ...Object.keys(financeSection),
    'documents',
    'documents',
    'references',
    'references',
  ];
  const percentageSection = 100 / percentageSections.length;

  const validFinanceSections = Object.values(financeSection).filter((f) => f);
  const finance = validFinanceSections.length * percentageSection;

  // Documents sections has double value
  const documents = documentPercentage ? percentageSection * 2 : 0;
  const someReference = state?.references ?? [];
  const someApprovedReference = someReference.filter((r) => {
    return r.status === 'approved';
  });
  // References sections has double value
  const references = someApprovedReference.length ? percentageSection * 2 : 0;

  state.percentage = {
    finance,
    documents,
    references,
  };
};

const initCompanyProfile = (state, data) => {
  const { company_information } = data;
  if (company_information) {
    const {
      avg_order_value = 0,
      max_order_value = 0,
      min_order_value = 0,
    } = company_information;

    state.company_information = {
      ...company_information,
      avg_order_value: parseCurrency(avg_order_value),
      max_order_value: parseCurrency(max_order_value),
      min_order_value: parseCurrency(min_order_value),
    };
  }
};
const initFinancial = (state, payload) => {
  if (payload && payload.financials && payload.financials.length) {
    const financialYears = [YEAR, YEAR - 1, YEAR - 2];
    let turnover = financialYears
      .map((financialYear) => {
        const [filterFinancial] = payload.financials.filter(
          (checkFinancialYear) =>
            Number(checkFinancialYear.year) === financialYear,
        );
        let result = {
          year: financialYear,
          value: '',
          active_trading: true,
        };
        if (filterFinancial) {
          const { value } = filterFinancial;
          const numberValue = parseFloatVal(value);
          const currencyValue = parseCurrency(
            !isNaN(numberValue) ? numberValue : value,
          );
          const newValue =
            value && !isNaN(currencyValue) ? currencyValue : value;
          result = {
            ...filterFinancial,
            label: filterFinancial.value,
            value: newValue,
            initialized: true,
          };
          return result;
        }
        return null;
      })
      .filter((t) => t);

    if (
      turnover &&
      turnover.length &&
      !find(turnover, (o) => String(o.year) === String(YEAR))
    ) {
      let initialTurnover = [INITIAL_TURNOVER];
      if (!find(turnover, (o) => String(o.year) === String(YEAR - 1))) {
        initialTurnover = [
          INITIAL_TURNOVER,
          { ...INITIAL_TURNOVER, year: String(YEAR - 1) },
        ];
      }
      turnover = [...initialTurnover, ...turnover];
    }
    state.turnover = (turnover.length && turnover) || state.turnover;
  }
};
const initOrganization = (state, payload) => {
  if (payload && payload.organisation && payload.organisation.length) {
    state.organisation = payload.organisation.map((o) => {
      let role = ROLE_CHECKER[o.title];
      let role_input = '';
      if (!role) {
        role = OTHER.value;
        role_input = o.title;
      }
      return {
        ...o,
        role,
        role_input,
      };
    });
  }
};
const initSections = (state, payload, type, defaultDocument = {}) => {
  state[type] = [];
  if (payload && payload[type]) {
    const loadedDocs = [...payload[type]].map((doc) => {
      const { file, price, ...rest } = doc;
      const requestConfig = {
        request: rest.requested || false,
        requestedBy: setRequestedBy(rest.requests || [], doc.label),
      };
      const priceData = {};
      if (price) {
        priceData.price = parseFloatVal(price);
      }
      const keySection = rest?.section;
      const documents = state ? { ...state.documents } ?? {} : {};
      const defaultDocuments = JSON.parse(JSON.stringify(documents));
      const section = defaultDocuments[keySection];
      const sectionDocuments = section?.options || [];
      const documentsWithExtras = sectionDocuments.filter((s) => s.extra);

      let extra = null;
      if (
        rest?.extra?.length ||
        documentsWithExtras.map((s) => s.name).includes(rest?.name)
      ) {
        const [documentWithExtras] = documentsWithExtras.filter((s) => s.name);
        extra = documentWithExtras?.extra.map((e) => {
          const docFound = find(rest.extra, (o) => o.label === e.name);
          if (docFound) {
            return docFound;
          }
          return { id: e.id, label: e.name };
        });
      }
      return {
        ...rest,
        ...priceData,
        document: file,
        custom: type === CUSTOM_CERTIFICATE,
        ...requestConfig,
        extra,
      };
    });
    state[type] = [
      ...loadedDocs,
      ...initDefaultsValues(type, defaultDocument, loadedDocs),
    ];
  }
};
const initReferences = (state, payload) => {
  state.references = [];
  if (payload && payload.references) {
    state.references = payload.references.map((r) => ({
      id: r.id,
      project_name: r.project_name,
      client_name: r.client_name,
      completion_date: r.completion_date,
      contract_value: parseFloatVal(r.contract_value),
      contact_name: r.contact_name,
      contact_email: r.contact_email,
      file: r.file,
      sow: r.sow,
      status: r.status,
      file_name: r.file_name,
    }));
  }
};

const initPreqState = (state, payload, arg, defaultDocument = {}) => {
  initCompanyProfile(state, payload);
  initFinancial(state, payload);
  initOrganization(state, payload);

  const documents = state ? ({ ...state.documents } ?? {}) : {};
  if (documents) {
    Object.keys(documents).forEach((typeDocument) => {
      initSections(state, payload, typeDocument, defaultDocument);
    });
  }
  initReferences(state, payload);
  initPercentage(state);
  changeLoading(state);
};

export {
  YEAR,
  INITIAL_TURNOVER,
  CUSTOM_CERTIFICATE,
  initPreqState,
  getNotLoadedDefaults,
  initPercentage,
  changeLoading,
};
