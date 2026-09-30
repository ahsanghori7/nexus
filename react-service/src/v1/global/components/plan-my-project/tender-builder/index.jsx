import React, { useCallback } from 'react';
import { useContext } from 'hooks/context';
import { connect } from 'react-redux';
import i18next from 'v2/helpers/i18n';
import Alert from 'react-bootstrap/Alert';
import ClinkForm from 'v1/global/components/clink-form';
import PanelForm from 'v1/global/components/layout/panel/Form';
import alert from 'v1/global/helpers/alert';
import Relay from 'v1/global/services/Relay';
import TenderBuilderService from 'v1/global/services/plan-my-project/tender-builder';
import ContentLeft from './ContentLeft';
import ContentRight from './content-right';
import NavButton from './nav-button';

const CUSTOM_ENABLED = 1;
class TenderBuilder extends React.Component {
  constructor(props) {
    super(props);
    const { pid } = props;

    this.state = {
      loading: true,
      firstLoad: true,
      showMessage: true,
      error: false,
      currentDependencies: {},
    };

    this.setOpenForm = this.setOpenForm.bind(this);
    this.init = this.init.bind(this);
    this.closeAlertMessage = this.closeAlertMessage.bind(this);
    this.addCallback = this.addCallback.bind(this);
    this.nextPage = this.nextPage.bind(this);
    this.deleteTender = this.deleteTender.bind(this);
    this.updateCustomTenders = this.updateCustomTenders.bind(this);
    this.responseHandler = this.responseHandler.bind(this);
    this.tenderBuilderService = new TenderBuilderService(pid);
    this.dependenciesService = new Relay('project', 'getPackageDependency');
    this.savePackagesRef = React.createRef();
  }

  componentDidMount() {
    this.init();
  }

  componentWillUnmount() {
    this.tenderBuilderService = null;
  }

  setOpenForm(tid, isOpen) {
    const selectedTenders = this.tenderBuilderService.getSelectedTenders();
    selectedTenders
      .filter((tender) => tender.id === tid)
      .forEach((tender) => {
        if (tender.is_custom) {
          this.tenderBuilderService.updateOpenCustomTender(tid, isOpen);
        } else {
          this.tenderBuilderService.updateOpenTender(tid, isOpen);
        }
      });
    this.forceUpdate();
  }

  init(loading = false) {
    const { pid } = this.props;
    this.setState({ loading: true });
    Promise.all([
      this.tenderBuilderService
        .getProjectTenders(pid)
        .then(this.tenderBuilderService.updateTenderOptions),
      this.tenderBuilderService
        .getPackages()
        .then(this.tenderBuilderService.updateMissingTradeOptions),
      ...(this.props.project?.data?.version === 2
        ? [this.props.dispatch(this.props.actions.getProjectMilestones(pid)).unwrap()]
        : []),
    ])
      .finally(() => {
        this.setState({ loading });
      })
      .catch((error) => {
        /* eslint no-console: "off" */
        this.setState({ loading: false, error });
      });

    this.dependenciesService
      .getJson({ pid, type: 'children' })
      .then((result) => {
        const currentDependencies = (result && result.data) || {};
        this.setState({
          firstLoad: false,
          currentDependencies,
        });
      })
      .catch((error) => {
        /* eslint no-console: "off" */
        console.error('init', error);
        this.setState({ firstLoad: false, error });
      });
  }

  closeAlertMessage() {
    this.setState({ showMessage: false });
  }

  addCallback(tenderBuilderPackagesField, tradeIdsToPost, setFieldValue) {
    let newTenderBuilderPackagesField = {
      ...tenderBuilderPackagesField,
    };
    if (tenderBuilderPackagesField.tooltip) {
      const { tooltip } = tenderBuilderPackagesField;
      const { componentProps } = tooltip;
      const handleClick = (tid) =>
        this.setState({ loading: true }, () =>
          componentProps.handleClick(tid, this.init),
        );
      const newComponentProps = {
        ...componentProps,
        handleClick,
      };
      newTenderBuilderPackagesField = {
        ...tenderBuilderPackagesField,
        tooltip: {
          ...tooltip,
          componentProps: newComponentProps,
        },
      };
    }
    // Callback for checkbox on change
    newTenderBuilderPackagesField.callback = ({ val }) => {
      const isCustom = val && tradeIdsToPost.length > CUSTOM_ENABLED;
      let newPackName = '';

      if (!isCustom) {
        if (tradeIdsToPost.length === 1) {
          const tenderId = tradeIdsToPost[0];
          const { options, tooltipInfo } = tenderBuilderPackagesField;
          const [optionSelected] = options.filter(
            (opt) =>
              Number(opt.id) === Number(tenderId) &&
              (!tooltipInfo || tooltipInfo(opt.value)?.[0] === 0),
          );
          newPackName = optionSelected?.label || '';
        }
      }

      setFieldValue('packageName', newPackName);
    };
    return newTenderBuilderPackagesField;
  }

  filterOptions(formFields) {
    const [tenderBuilderPackagesField, missingPackagesField] = formFields;
    const { options: tenderBuilderOptions } = tenderBuilderPackagesField;
    const { options: missingPackagesOptions } = missingPackagesField;
    const ids = tenderBuilderOptions.flatMap((tender) =>
      tender.packages ? tender.packages.map((p) => p.package_id) : 0,
    );
    const newOptions = missingPackagesOptions.filter(
      (opt) => !ids.includes(Number(opt.id)),
    );
    return {
      ...missingPackagesField,
      options: newOptions,
    };
  }

  nextPage(page) {
    this.setState(() => {
      this.tenderBuilderService.updatePage(page);
      return { loading: false };
    });
  }

  deleteTender(tid) {
    const currentTender = this.tenderBuilderService.getCurrentTender(tid);
    // Delete custom package
    let handleAccept = () =>
      this.tenderBuilderService.deleteTender(tid).then((response) => {
        if (response.success) {
          this.init();
        }
      });
    if (currentTender) {
      // Set current tender to Suggestion
      handleAccept = () =>
        this.tenderBuilderService
          .updateTender({ state: 0, tid })
          .then((response) => {
            if (response.success) {
              this.init();
            }
          })
          .finally(this.props.fetchProcurementSchedule);
    }
    return handleAccept();
  }

  updateCustomTenders(values, detail = false, hasAsiteFoldersFeature = false) {
    this.setState({ loading: true });
    const promises = values.map((formData) => {
      // eslint-disable-next-line no-promise-executor-return
      return new Promise((resolve, reject) => {
        if (!formData?.isEdited) {
          // eslint-disable-next-line no-promise-executor-return
          return resolve(true);
        }
        // eslint-disable-next-line no-promise-executor-return
        const payload = hasAsiteFoldersFeature
          ? formData
          : { ...formData, provider_folder: undefined };
        return this.tenderBuilderService
          .updateTender(payload)
          .then((response) => {
            if (response.success) {
              resolve(true);
            } else {
              reject(response);
            }
          })
          .finally(this.props.fetchProcurementSchedule)
          .catch(reject);
      });
    });

    return Promise.all(promises)
      .then((response) => {
        this.init(detail);
        return { success: true, values: response };
      })
      .catch((error) => {
        this.setState({ loading: false });
        alert({
          success: false,
          error: error?.error || 'An error occurred updated one of the packages.',
        });
        return { success: false, values: error };
      });
  }

  responseHandler(response, loading = false) {
    if (response && response.success) {
      this.init(loading);
    } else if (response && !response.success) {
      const { page } = this.tenderBuilderService;
      this.setState({ loading: false });
      if (page) {
              alert(
                { success: false },
                null,
                {},
                {
                  title: `Error`,
                  message: (
                    <p>{ i18next.t('package-name-already-exists')}</p>
                  ),
                  type: 'error',
                },
              );
      }
    } else {
      this.setState({ loading: false });
      alert(response);
    }
  }

  render() {
    const { slug, handleBack, pid, fetchProcurementSchedule } = this.props;
    const { loading, firstLoad, showMessage, error, currentDependencies } =
      this.state;
    const {
      formFields,
      initialValues,
      validationSchema,
      submitMissingTrade,
      submitCreatePackage,
      page,
    } = this.tenderBuilderService;
    let handleSubmit = (values, { resetForm }) => {
      this.setState({ loading: true }, () =>
        submitMissingTrade(values).then(this.responseHandler).then(resetForm),
      );
    };
    if (page) {
      handleSubmit = (values, { resetForm }) => {
        const callback = () => {
          this.setState({ loading: true }, () =>
            submitCreatePackage(values)
              .then(this.responseHandler)
              .then(resetForm)
              .finally(fetchProcurementSchedule),
          );
        };
        const { current } = this.savePackagesRef;
        if (current) {
          const event = new CustomEvent('custom-event', { detail: callback });
          current.dispatchEvent(event);
        } else {
          callback();
        }
      };
    }

    const selectedTenders = this.tenderBuilderService.getSelectedTenders();
    const navButton = (
      <NavButton handleClick={this.nextPage} handleBack={handleBack} />
    );
    const isEdit = !handleBack;
    return (
      <>
        {error && <Alert variant="danger">{error}</Alert>}
        {!error && (
          <div className="tender-builder">
            <ClinkForm
              initialValues={initialValues}
              formFields={formFields}
              validationSchema={validationSchema}
              handleSubmit={handleSubmit}
              className="tender-builder"
              enableReinitialize
              render={({ values, errors, isSubmitting, setFieldValue, validateForm, setFieldTouched }) => {
                const tradeIdsToPost = values.tenderBuilderPackages || [];
                let isCustom = tradeIdsToPost.length > CUSTOM_ENABLED;
                if (tradeIdsToPost.length) {
                  const [tid] = tradeIdsToPost;
                  const [existingTrade] = selectedTenders.filter(
                    (tender) => tender.id === tid,
                  );
                  if (existingTrade) {
                    isCustom = true;
                  }
                }
                const classNameRight =
                  page && selectedTenders.length ? 'success-bg' : 'disabled-bg';
                // Add callback for updating state after deleting tenders
                // eslint-disable-next-line no-unused-vars
                const [tenderBuilderPackagesField, _, packageNameField] =
                  formFields;
                const newTenderBuilderPackagesField = this.addCallback(
                  tenderBuilderPackagesField,
                  tradeIdsToPost,
                  setFieldValue,
                  selectedTenders,
                );
                const newMissingPackagesField = this.filterOptions(formFields);

                const newFormFields = [
                  newTenderBuilderPackagesField,
                  newMissingPackagesField,
                  packageNameField,
                ];
                const [tenderList, missingTrades, packageName] = newFormFields;
                const newTenderList = {
                  ...tenderList,
                  options: tenderList.options.sort((itemA, itemB) =>
                    itemA.label
                      .toLowerCase()
                      .localeCompare(itemB.label.toLowerCase()),
                  ),
                };
                const formFieldGroups = page
                  ? [[newTenderList], [packageName]]
                  : [[newTenderList], [missingTrades]];
                return (
                  <PanelForm
                    title={page ? 'Select Package Trades' : 'Trades'}
                    classNameRight={classNameRight}
                    headerRight={<b>Your packages</b>}
                    contentLeft={
                      <ContentLeft
                        showMessage={showMessage}
                        loading={loading}
                        firstLoad={firstLoad}
                        closeAlertMessage={this.closeAlertMessage}
                        formFields={formFieldGroups}
                        values={values}
                        errors={errors}
                        isSubmitting={isSubmitting}
                        setFieldValue={setFieldValue}
                        page={page}
                        isCustom={isCustom}
                        navButton={navButton}
                        isEdit={isEdit}
                        service={this.tenderBuilderService}
                        init={this.init}
                        validateForm={validateForm}
                        setFieldTouched={setFieldTouched}
                      />
                    }
                    contentRight={
                      <ContentRight
                        loading={loading}
                        formFields={newFormFields}
                        slug={slug}
                        selectedTenders={selectedTenders}
                        setOpenForm={this.setOpenForm}
                        page={page}
                        deleteTender={this.deleteTender}
                        updateCustomTenders={this.updateCustomTenders}
                        pid={pid}
                        savePackagesRef={this.savePackagesRef}
                        init={this.init}
                        currentDependencies={currentDependencies}
                      />
                    }
                  />
                );
              }}
            />
          </div>
        )}
      </>
    );
  }
}

const Wrapper = (props) => {
  const context = useContext('clink');
  const { actions } = context;
  const { slug, dispatch } = props;

  // we restart project data
  const fetchProcurementSchedule = useCallback(() => {
    try {
      dispatch(actions.resetQuotesTender());
      dispatch(actions.restartOrders());
      dispatch(actions.restartProcurement());
      dispatch(actions.resetOverview());
    } finally {
      if (slug) {
        dispatch(actions.fetchProjectGantt({ slug }));
      }
    }
  }, [slug, dispatch, actions]);

  return (
    <TenderBuilder
      {...props}
      actions={actions}
      fetchProcurementSchedule={fetchProcurementSchedule}
    />
  );
};
const mapStateToProps = (state) => {
  return {
    slug: state?.project?.data?.slug,
    project: state?.project,
  };
};
export default connect(mapStateToProps)(Wrapper);
