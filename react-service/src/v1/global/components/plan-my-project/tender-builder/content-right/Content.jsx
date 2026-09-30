import React from 'react';
import isNil from 'lodash/isNil';
import isEmpty from 'lodash/isEmpty';
import { connect } from 'react-redux';
import { getDateValuesV1 } from 'v2/helpers/date';
import { getInputs } from './helpers';
import FormCard from './FormCard';
import ActionButtons from './ActionButtons';
import TenderFormService from '../../../../services/plan-my-project/tender-builder/Form';
import Loading from '../../../Loading';

class Content extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formsData: [],
      projectIsValid: false,
      triggerCustomErrors: false,
      showEmptyError: false,
    };
    this.handleValidationForm = this.handleValidationForm.bind(this);
    this.setOpenForm = this.setOpenForm.bind(this);
    this.openPreview = this.openPreview.bind(this);
    this.openProjectsDashboard = this.openProjectsDashboard.bind(this);
    this.updateForms = this.updateForms.bind(this);
    this.updateFormsData = this.updateFormsData.bind(this);
  }

  /* eslint react/no-did-update-set-state: "off" */
  componentDidUpdate(prevProps, prevState) {
    const { selectedTenders: prevSelectedTenders } = prevProps;
    const { selectedTenders: currentSelectedTenders } = this.props;
    if (!isEmpty(prevSelectedTenders) && !isEmpty(currentSelectedTenders)) {
      if (
        !prevState.formsData.length ||
        currentSelectedTenders.length > prevSelectedTenders.length
      ) {
        this.updateFormsData(currentSelectedTenders);
      } else if (currentSelectedTenders.length < prevSelectedTenders.length) {
        const { formsData } = prevState;
        const tids = currentSelectedTenders.map((tender) => tender.id);
        const newFormsData = formsData.filter((data) =>
          tids.includes(data.tid),
        );
        this.setState({ formsData: newFormsData });
      } else if (currentSelectedTenders.length === prevSelectedTenders.length) {
        // Check if provider_folder data has been updated for any tender
        const hasProviderFolderChanges = currentSelectedTenders.some(
          (tender, index) => {
            const prevTender = prevSelectedTenders[index];
            return (
              tender.id === prevTender?.id &&
              tender.provider_folder !== prevTender?.provider_folder
            );
          },
        );
        if (hasProviderFolderChanges) {
          this.updateFormsData(currentSelectedTenders);
        }
      }
      // edge case that only happens when formsData is empty
    } else if (
      isEmpty(prevSelectedTenders) &&
      !isEmpty(currentSelectedTenders)
    ) {
      this.updateFormsData(currentSelectedTenders);
    } else if (
      isEmpty(prevSelectedTenders) &&
      isEmpty(currentSelectedTenders) &&
      prevState.formsData.length > 0
    ) {
      this.setState({ formsData: [], projectIsValid: false });
    }
  }

  handleValidationForm(e) {
    const { formsData } = this.state;
    const {
      region,
      constants,
      updateCustomTenders,
      init,
      currentDependencies,
      project,
      hasAsiteFoldersFeature,
    } = this.props;
    if (!formsData || !formsData.length) {
      this.setState({ projectIsValid: false });
      return false;
    }
    const promises = formsData.map((formData) => {
      const serviceData = {
        tid: formData.id,
        region,
        constants,
        formData,
        init,
        currentDependencies,
        project,
        hasAsiteFoldersFeature,
      };

      const tenderFormService = new TenderFormService(serviceData);
      const { validationSchema } = tenderFormService;
      return validationSchema
        .validate(formData)
        .then((validatedData) => {
          return validatedData;
        })
        .catch((error) => {
          throw error;
        });
    });
    return Promise.all(promises)
      .then((res) =>
        updateCustomTenders(res, !e?.detail, hasAsiteFoldersFeature),
      )
      .then((response) => {
        if (response && response.success) {
          this.setState((prevState) => ({
            projectIsValid: true,
            showEmptyError: false,
            formsData: prevState.formsData.map((form) => ({
              ...form,
              isEdited: false, // reset isEdited state after successful validation
            })),
          }));
        } else {
          this.setState({ projectIsValid: false, triggerCustomErrors: true });
        }
        return response;
      })
      .catch(() => {
        const errorIds = formsData.map((form) => {
          if (
            !form?.packageName ||
            !form?.tenderStartDate ||
            !form?.tenderReturnDate ||
            form?.tenderStartDate.length === 0 ||
            form?.tenderReturnDate.length === 0 ||
            !form?.tenderService ||
            (form?.tenderService && !form?.tenderService?.id) ||
            !form?.tenderSize ||
            (form?.tenderSize && !form?.tenderSize?.id) ||
            (hasAsiteFoldersFeature &&
              (!form?.provider_folder ||
                !(
                  (typeof form?.provider_folder === 'string' &&
                    form?.provider_folder.length > 0) ||
                  (form?.provider_folder.label &&
                    form?.provider_folder?.label.length > 0) ||
                  (form?.provider_folder?.name &&
                    form?.provider_folder?.name.length > 0)
                )))
          ) {
            return form.tid;
          }
          return null;
        });
        this.setState({
          projectIsValid: false,
          triggerCustomErrors: true,
          showEmptyError: errorIds,
        });
        return { success: false };
      });
  }

  setOpenForm(tip, isOpen) {
    const { setOpenForm } = this.props;
    setOpenForm(tip, isOpen);
  }

  updateForms(tid, value) {
    this.setState((prevState) => {
      const { formsData } = prevState;
      const newFormsData = formsData.map((data) => {
        if (data.tid === tid) {
          const isEdited = true; // added this the moment we interact with the form
          return {
            ...data,
            [value.fieldName]: value.val,
            isEdited,
          };
        }
        return data;
      });
      return {
        formsData: newFormsData,
        triggerCustomErrors: false,
        projectIsValid: false,
      };
    });
  }

  updateFormsData(currentSelectedTenders) {
    const { projectIsValid } = this.state;
    const newFormsData = currentSelectedTenders
      .map((tender) => {
        const {
          id: tid,
          label: packageName,
          start_on_site: tenderStartDate,
          tender_return: tenderReturnDate,
          service: tenderService,
          size: tenderSize,
          provider_folder: providerFolder,
        } = tender;

        // Normalize provider_folder value to match validation expectations
        let normalizedProviderFolder = providerFolder || null;
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
        } else if (normalizedProviderFolder && normalizedProviderFolder?.name) {
          normalizedProviderFolder = {
            ...normalizedProviderFolder,
            label:
              normalizedProviderFolder?.label || normalizedProviderFolder?.name,
          };
        }

        return {
          ...tender,
          tid,
          packageName,
          tenderReturnDate: getDateValuesV1(tenderReturnDate),
          tenderStartDate: getDateValuesV1(tenderStartDate),
          tenderService: {
            id: tenderService,
            value: tenderService,
            label: tenderService ? 'label' : null,
          },
          tenderSize: {
            id: tenderSize,
            value: tenderSize,
            label: tenderSize ? 'label' : null,
          },
          provider_folder: normalizedProviderFolder,
        };
      })
      .sort((tenderA, tenderB) =>
        tenderA.label.toLowerCase().localeCompare(tenderB.label.toLowerCase()),
      );
    this.setState({ formsData: newFormsData, projectIsValid });
  }

  openPreview() {
    const { slug } = this.props;
    const url = `${BASE_URLS.CLINK_APP_HOST}/project/${slug}`;
    window.open(url, '_blank');
  }

  openProjectsDashboard() {
    const { slug } = this.props;
    window.location.href = `${BASE_URLS.CLINK_APP_HOST}/main-contractor/project_dashboard/${slug}`;
  }

  render() {
    const {
      selectedTenders = [],
      tenderBuilderPackagesData = null,
      region = [],
      constants = [],
      page = 0,
      deleteTender = () => null,
      loading = false,
      pid,
      savePackagesRef,
      init,
      currentDependencies,
      slug,
      project,
      milestones,
      hasAsiteFoldersFeature,
    } = this.props;
    const { projectIsValid, triggerCustomErrors, showEmptyError } = this.state;

    if (!page || !selectedTenders.length || !tenderBuilderPackagesData) {
      return loading && <Loading />;
    }

    return (
      <>
        <div className="tender-packages-forms" data-testid="work-packages-forms">
          <p>
            Please fill in the information for each package below correctly
            before saving the project.
          </p>
          {loading && <Loading fullDiv />}
          {selectedTenders.map((formData) => {
            const showError =
              showEmptyError && showEmptyError.includes(formData.id);
            return (
              formData && (
                <div key={formData.id} data-testid={`work-package-item-${formData.id}`}>
                  <FormCard
                    pid={pid}
                    tid={formData.id}
                    showEmptyError={showError}
                    formData={formData}
                    region={region}
                    constants={constants}
                    deleteTender={deleteTender}
                    setOpenForm={this.setOpenForm}
                    updateForms={this.updateForms}
                    triggerCustomErrors={triggerCustomErrors}
                    selectedTenders={selectedTenders}
                    init={init}
                    currentDependencies={currentDependencies}
                    project={project}
                    milestones={milestones}
                    hasAsiteFoldersFeature={hasAsiteFoldersFeature}
                  />
                  {(isNil(formData.isOpen)
                    ? !formData.open
                    : !formData.isOpen) &&
                    formData.error &&
                    showError && (
                      <div
                        className="incomplete-error"
                        data-testid={`work-package-error-${formData.id}`}
                      >
                        Please complete all the package inputs above
                      </div>
                    )}
                </div>
              )
            );
          })}
        </div>
        <ActionButtons
          handleValidationForm={this.handleValidationForm}
          openPreview={this.openPreview}
          openProjectsDashboard={this.openProjectsDashboard}
          projectIsValid={projectIsValid}
          pid={pid}
          savePackagesRef={savePackagesRef}
          slug={slug}
        />
      </>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    hasAsiteFoldersFeature:
      state.clinkAccount?.featureFlags?.asiteFolders || false,
  };
};

export default connect(mapStateToProps)(Content);
export { getInputs };
