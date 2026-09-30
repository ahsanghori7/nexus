import moment from 'moment';
// import { httpHelperV2 as httpHelperService } from 'v2/services/httpHelper';
import isNil from 'lodash/isNil';
import GlobalService, { getConfig } from '../../clink';
import TENDER_BUILDER from '../config/tender-builder';
import intersectionByPackage from '../../../helpers/intersection-by-package';

const defaultConfig = getConfig({
  initialValues: TENDER_BUILDER.INITIAL_VALUES,
  formFields: TENDER_BUILDER.FORM_FIELDS,
  validationSchema: TENDER_BUILDER.VALIDATION_SCHEMA,
  method: 'GET',
  key: 'tenders',
});

function findMatchingTenders(selectTender, newCustomTendersArray) {
  const selectTenderPackageIds = selectTender.packages.map(
    (pkg) => pkg.package_id,
  );
  const results = [];

  for (const tender of newCustomTendersArray) {
    for (const pkg of tender.packages) {
      if (selectTenderPackageIds.includes(pkg.package_id)) {
        results.push(tender);
        break; // Stop checking this tender if a match is found
      }
    }
  }

  return results;
}

class TenderBuilder extends GlobalService {
  constructor(pid = 0, config = defaultConfig) {
    super(config);
    this._pageValidation = TENDER_BUILDER.PAGE_VALIDATION_SCHEMA;
    this._pid = pid;
    this._customTenders = [];
    this._groups = [];
    this._page = 0;
    this.submitMissingTrade = this.submitMissingTrade.bind(this);
    this.submitCreatePackage = this.submitCreatePackage.bind(this);
    this.updateTenderOptions = this.updateTenderOptions.bind(this);
    this.addTender = this.addTender.bind(this);
    this.updateTender = this.updateTender.bind(this);
    this.deleteTender = this.deleteTender.bind(this);
    this.checkDelete = this.checkDelete.bind(this);
    this.getCurrentTender = this.getCurrentTender.bind(this);
    this.checkSingleDelete = this.checkSingleDelete.bind(this);
    this.checkCustomDelete = this.checkCustomDelete.bind(this);
    this.getPackages = this.getPackages.bind(this);
    this.updatePage = this.updatePage.bind(this);
    this.updateMissingTradeOptions = this.updateMissingTradeOptions.bind(this);
    this.updateOpenTender = this.updateOpenTender.bind(this);
    this.updateOpenCustomTender = this.updateOpenCustomTender.bind(this);
    this.getTradeIdsToPost = this.getTradeIdsToPost.bind(this);
    this.getSelectedTenders = this.getSelectedTenders.bind(this);
  }

  set pid(pid) {
    this._pid = pid;
  }

  get pid() {
    return this._pid;
  }

  set customTenders(customTenders) {
    this._customTenders = customTenders;
  }

  get customTenders() {
    return this._customTenders;
  }

  set groups(groups) {
    this._groups = groups;
  }

  get groups() {
    return this._groups;
  }

  set page(page) {
    this._page = page;
  }

  get page() {
    return this._page;
  }

  set pageValidation(pageValidation) {
    this._pageValidation = pageValidation;
  }

  get pageValidation() {
    return this._pageValidation;
  }

  async getProjectTenders(id) {
    // return httpHelperService({ url: 'attribute/category/trade_category/groups });
    this.method = 'GET';
    this.submitUrl = `${BASE_URLS.CLINK_APP_HOST}/relay?action=project&method=getProjectTenders&id=${id}`;
    return super.asyncCall();
  }

  async getPackages() {
    this.method = 'GET';
    this.submitUrl = `${BASE_URLS.CLINK_APP_HOST}/relay?action=project&method=getPackages`;
    return super.asyncCall();
  }

  async addTender(body) {
    this.method = 'POST';
    this.submitUrl = `${BASE_URLS.CLINK_APP_HOST}/relay?action=project&method=createProjectTender&pid=${this.pid}`;
    return super.asyncCall(body);
  }

  async updateTender(body) {
    this.method = 'PATCH';
    const { tid, packages, state, ...rest } = body;
    const newBody = {
      state: state ?? 1,
    };
    if (rest.is_custom) {
      newBody.is_custom = rest.is_custom;
    }
    if (rest.packageName) {
      newBody.label = rest.packageName;
    }
    if (rest.referenceNo !== undefined) {
      newBody.reference_no = rest.referenceNo || '';
    }
    if (packages) {
      newBody.packages = packages.map((pack) => pack.package_id);
    }
    if (rest.tenderService && rest.tenderService.id) {
      newBody.service = rest.tenderService.id;
    }
    if (rest.tenderSize && rest.tenderSize.id) {
      newBody.size = rest.tenderSize.id;
    }
    if (rest.provider_folder) {
      const folderName =
        typeof rest.provider_folder === 'string'
          ? rest.provider_folder
          : rest.provider_folder.label ||
            rest.provider_folder.name ||
            rest.provider_folder.value;
      if (folderName) {
        // API expects a single folder name (string), not an array.
        newBody.provider_folder = folderName;
      }
    }
    if (rest.tenderStartDate) {
      newBody.start_on_site =
        typeof rest.tenderStartDate === 'object'
          ? moment(rest.tenderStartDate).format('DD-MM-YYYY')
          : rest.start_on_site;
    }
    if (rest.tenderReturnDate) {
      newBody.tender_return =
        typeof rest.tenderReturnDate === 'object'
          ? moment(rest.tenderReturnDate).format('DD-MM-YYYY')
          : rest.tenderReturnDate;
    }
    if (rest.milestones?.length) {
      newBody.milestones = rest.milestones;
    }
    const updateUrl = '/relay?action=tender&method=updatePackages&tid=';
    this.submitUrl = `${BASE_URLS.CLINK_APP_HOST}${updateUrl}${tid}`;
    return super.asyncCall(newBody);
  }

  deleteTender(tid) {
    this.method = 'DELETE';
    this.submitUrl = `${BASE_URLS.CLINK_APP_HOST}/relay?action=tender&method=remove&tid=${tid}`;
    return this.asyncCall().then((response) => {
      if (response.success) {
        const [tenderPackages, ...rest] = this.formFields;
        const { options } = tenderPackages;
        tenderPackages.options = options.filter(
          (opt) => Number(opt.id) !== Number(tid),
        );
        this.formFields = [tenderPackages, ...rest];
        return response;
      }
      return { success: false };
    });
  }

  getCurrentTender(tid) {
    const tenders = this.groups.flatMap((g) => Object.values(g.tenders));
    const [currentTender] = tenders.filter((t) => t.id === tid);
    return currentTender;
  }

  checkSingleDelete(tid) {
    const currentTender = this.getCurrentTender(tid);
    const disabled =
      this.initialValues.tenderBuilderPackages.includes(tid) ||
      currentTender.state;
    const packageName = currentTender && currentTender.label;
    return [disabled, packageName];
  }

  checkCustomDelete(tid) {
    const currentTender = this.getCurrentTender(tid);
    let disabled = false;
    let packageName = '';
    // We check first custom tenders
    if (currentTender) {
      const newCustomTendersArray = Object.values(this.customTenders);
      const matchingTenders = findMatchingTenders(
        currentTender,
        newCustomTendersArray,
      );
      disabled = Boolean(matchingTenders.length);
      if (disabled) {
        packageName = matchingTenders.reduce((acc, curr) => {
          const newAcc = acc === '' ? '' : `${acc}, `;
          return `${newAcc}${curr.label}`;
        }, '');
        packageName = matchingTenders;
      }
    }
    return [disabled, packageName];
  }

  checkDelete(tid) {
    const [disabledCustom, packageNameCustom] = this.checkCustomDelete(tid);
    const [disabledSingle, packageNameSingle] = this.checkSingleDelete(tid);
    let result = [disabledSingle, packageNameSingle];
    if (disabledCustom) {
      const packNames = packageNameCustom.reduce(
        (acc, curr) => {
          const newAcc = acc === '' ? '' : `${acc}, `;
          return `${newAcc}${curr.label}`;
        },
        (disabledSingle && packageNameSingle) || '',
      );
      result = [disabledCustom, packNames];
    }

    return result;
  }

  updateTenderOptions(tenderOptions) {
    if (tenderOptions && !tenderOptions.error) {
      const { custom_tenders: customTenders, groups } = tenderOptions;

      const newCustomTenders = {};
      Object.keys(customTenders).forEach((key) => {
        newCustomTenders[key] = {
          ...customTenders[key],
        };
      });
      this.customTenders = newCustomTenders;

      this.groups = groups.map((group) => {
        const newTenders = {};
        Object.keys(group.tenders).forEach((key) => {
          newTenders[key] = {
            ...group.tenders[key],
          };
        });
        return { ...group, tenders: newTenders };
      });

      const tenders = groups.flatMap((g) => Object.values(g.tenders));

      const [tenderBuilderPackages, ...rest] = this.formFields;

      const initialTenderValues = [];
      const newTenderBuilderPackages = {
        ...tenderBuilderPackages,
        options: tenders.map((t) => {
          return {
            ...t,
            id: t.id,
            value: t.id,
            label: t.label,
          };
        }),
        tooltip: {
          className: 'delete-tender',
          componentProps: {
            handleClick: (tid, callback) => {
              const [disabled, packageName] = this.checkDelete(tid);
              if (disabled) {
                const optionsError = {
                  title: 'Cannot Remove Trade',
                  message: `This trade cannot be removed because it is currently assigned to ${packageName}.`,
                  type: 'error',
                };
                this.alert({}, null, {}, optionsError);
                return callback();
              }
              return this.deleteTender(tid).then((response) => {
                if (response.success && callback) {
                  callback();
                }
              });
            },
            className: 'delete-tender--content tooltip-content',
          },
        },
        tooltipInfo: (tid) => this.checkDelete(tid),
        checkboxHidden: !this.page,
      };

      this.formFields = [newTenderBuilderPackages, ...rest];
      this.initialValues = {
        ...this.initialValues,
        tenderBuilderPackages: initialTenderValues,
      };
      this.updatePage(this.page);
    }
  }

  getSelectedTenders() {
    const { customTenders, groups } = this;
    const createdTenders = groups
      .flatMap((group) => Object.values(group.tenders))
      .filter((tender) => tender.state);

    let result = [...createdTenders, ...Object.values(customTenders)].sort(
      (tenderA, tenderB) =>
        tenderA.label.toLowerCase().localeCompare(tenderB.label.toLowerCase()),
    );
    let firstOpened = true;
    result = result.map((tender) => {
      const shouldBeOpen =
        !tender.start_on_site ||
        !tender.tender_return ||
        tender.start_on_site.length === 0 ||
        tender.tender_return.length === 0 ||
        !tender.service ||
        !tender.size;
      const newTender = {
        ...tender,
        open: isNil(tender.isOpen)
          ? firstOpened && shouldBeOpen
          : tender.isOpen,
        error: shouldBeOpen,
      };
      if (tender.state && shouldBeOpen) {
        firstOpened = false;
      }
      return newTender;
    });
    const mapOfBools =
      (result.length && result.map((tender) => tender.open)) || [];
    if (mapOfBools.length && !mapOfBools.includes(true)) {
      const [first, ...rest] = result;
      result = [{ ...first, open: true }, ...rest];
    }
    return result;
  }

  updatePage(page) {
    const [tenderBuilderPackages, ...rest] = this.formFields;
    const newTenderBuilderPackages = {
      ...tenderBuilderPackages,
      checkboxHidden: !page,
    };
    this.page = page;
    this.formFields = [newTenderBuilderPackages, ...rest];
    this.validationSchema = this.pageValidation[page](
      this.groups,
      this.customTenders,
    );
  }

  updateMissingTradeOptions(packages) {
    if (packages && packages.length) {
      const [tenderBuilderPackages, missingTrades, packageName] =
        this.formFields;
      const newMissingTrades = {
        ...missingTrades,
        options: packages.map((p) => ({
          ...p,
          id: p.id,
          value: p.id,
          label: p.label,
        })),
      };
      this.formFields = [tenderBuilderPackages, newMissingTrades, packageName];
    }
  }

  updateOpenTender(tid, isOpen) {
    this.groups = this.groups.map((group) => {
      const newTenders = {};
      Object.keys(group.tenders).forEach((key) => {
        newTenders[key] =
          group.tenders[key].id === tid
            ? { ...group.tenders[key], isOpen }
            : group.tenders[key];
      });
      return { ...group, tenders: newTenders };
    });
  }

  updateOpenCustomTender(tid, isOpen) {
    const newCustomTenders = {};
    Object.keys(this.customTenders).forEach((key) => {
      newCustomTenders[key] =
        this.customTenders[key].id === tid
          ? { ...this.customTenders[key], isOpen }
          : this.customTenders[key];
    });
    this.customTenders = newCustomTenders;
  }

  submitMissingTrade(values) {
    const { missingTrades } = values;
    const body = {
      is_custom: 0,
      state: 0,
      label: missingTrades.label,
      packages: [missingTrades.id],
      service: null,
      size: null,
      start_on_site: '',
      tender_return: '',
    };
    return this.addTender(body);
  }

  getTradeIdsToPost(values) {
    const arrayGroups = Object.values(this.groups);
    const arrayCustom = Object.values(this.customTenders);
    const { tenderBuilderPackages } = values;

    const intersectionByPack = intersectionByPackage(arrayCustom, arrayGroups);

    const tradesIds = intersectionByPack.map((tender) => tender.id);
    return tenderBuilderPackages.filter(
      (tenderId) => !tradesIds.includes(tenderId),
    );
  }

  submitCreatePackage(values) {
    const { packageName, referenceNo, tenderBuilderPackages } = values;
    const tradeIdsToPost = tenderBuilderPackages;
    let body = {
      state: 1,
      label: packageName,
    };

    // Add reference_no to body if provided
    if (referenceNo !== undefined && referenceNo !== '') {
      body.reference_no = referenceNo;
    }

    // Create custom tender
    const tenders = this.groups
      .flatMap((g) => Object.values(g.tenders))
      .filter((tender) => tradeIdsToPost.includes(Number(tender.id)));
    const packages = tenders.flatMap((tender) =>
      tender.packages.map((pack) => pack.package_id),
    );

    // Update non custom tender
    if (tradeIdsToPost.length === 1) {
      const [tender] = tenders;
      // if label is equal the name of the package, update the tender
      if (tender.label === packageName) {
        const [tid] = tradeIdsToPost;
        body.tid = tid;
        return this.updateTender(body);
      }
    }
    body = {
      is_custom: 1,
      state: 1,
      label: packageName,
      reference_no: referenceNo || undefined,
      packages,
      service: null,
      size: null,
      start_on_site: '',
      tender_return: '',
    };
    return this.addTender(body);
  }
}

export default TenderBuilder;
