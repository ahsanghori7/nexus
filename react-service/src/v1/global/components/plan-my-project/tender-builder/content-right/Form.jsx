import React from 'react';
import isEqual from 'lodash/isEqual';
import Cookies from 'js-cookie';
import TenderFormService from '../../../../services/plan-my-project/tender-builder/Form';
import ClinkForm from '../../../clink-form';
import { httpHelperV2 } from 'v2/services/httpHelper';

class Form extends React.Component {
  constructor(props) {
    super(props);
    const {
      pid,
      tid,
      formData,
      region,
      constants,
      updateForms,
      selectedTenders,
      init,
      currentDependencies,
      project,
      milestones,
      hasAsiteFoldersFeature,
    } = props;
    const serviceData = {
      pid,
      tid,
      region,
      constants,
      formData,
      selectedTenders,
      init,
      currentDependencies,
      project,
      milestones,
      hasAsiteFoldersFeature,
      callback: (data) => updateForms(tid, data),
    };
    this.state = {
      tenderFormService: new TenderFormService(serviceData),
      currentDependencies,
      hasAsiteFoldersFeature,
      asiteFoldersLoaded: false,
      hasAsiteFolders: true,
      isLoadingAsiteFolders: false,
    };
  }

  componentDidMount() {
    const { hasAsiteFoldersFeature, pid, isOpen } = this.props;
    if (hasAsiteFoldersFeature && isOpen) {
      this.loadAsiteFolders(pid);
    }
  }

  componentDidUpdate(prevProps) {
    const { hasAsiteFoldersFeature, pid, isOpen } = this.props;
    if (
      hasAsiteFoldersFeature &&
      isOpen &&
      !this.state.asiteFoldersLoaded &&
      (prevProps.pid !== pid ||
        prevProps.hasAsiteFoldersFeature !== hasAsiteFoldersFeature ||
        prevProps.isOpen !== isOpen)
    ) {
      this.loadAsiteFolders(pid);
    }
  }

  async loadAsiteFolders(projectId) {
    this.setState({ isLoadingAsiteFolders: true });
    try {
      const response = await httpHelperV2({
        url: `document/provider/asite/project/${projectId}/package/folders`,
      });
      const folders = response?.data || [];

      const hasAsiteFolders = folders.length > 0;

      const options = folders.map((folder) => ({
        id: folder?.id,
        value: folder?.id,
        // SelectField uses `label` for displaying and our save logic supports `name`.
        label: folder?.name,
        name: folder?.name,
      }));

      // Get the latest state after async call
      const { tenderFormService } = this.state;
      if (!tenderFormService) return;

      const isProviderFolderFromAPI =
        tenderFormService?.initialValues?.provider_folder !== null;

      tenderFormService.formFields = tenderFormService.formFields.map(
        (field) => {
          if (field?.name === 'provider_folder') {
            return {
              ...field,
              options,
              isDisabled: isProviderFolderFromAPI,
              hasAsiteFolders,
            };
          }
          return field;
        },
      );

      // Update validation schema based on whether folders exist
      if (!hasAsiteFolders) {
        tenderFormService.updateValidationForEmptyFolders();
      }

      // Force rerender so SelectField gets updated options.
      this.setState(
        {
          asiteFoldersLoaded: true,
          hasAsiteFolders,
          isLoadingAsiteFolders: false,
        },
        () => this.forceUpdate(),
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('loadAsiteFolders error', e?.message);

      // Handle error case: show fallback UI
      const { tenderFormService } = this.state;
      if (!tenderFormService) return;

      const isProviderFolderFromAPI =
        tenderFormService?.initialValues?.provider_folder !== null;

      tenderFormService.formFields = tenderFormService.formFields.map(
        (field) => {
          if (field?.name === 'provider_folder') {
            return {
              ...field,
              options: [],
              isDisabled: isProviderFolderFromAPI,
              hasAsiteFolders: false,
            };
          }
          return field;
        },
      );

      // Update validation schema to make field not required
      tenderFormService.updateValidationForEmptyFolders();

      // Force rerender to show fallback UI
      this.setState(
        {
          asiteFoldersLoaded: true,
          hasAsiteFolders: false,
          isLoadingAsiteFolders: false,
        },
        () => this.forceUpdate(),
      );
    }
  }

  static getDerivedStateFromProps(props, state) {
    const {
      pid,
      tid,
      formData,
      region,
      constants,
      updateForms,
      selectedTenders,
      init,
      currentDependencies,
      project,
      milestones,
      hasAsiteFoldersFeature,
    } = props;
    const {
      currentDependencies: stateCurrentDependencies,
      hasAsiteFoldersFeature: stateAsite,
      tenderFormService: stateTenderFormService,
    } = state;

    const formDataChanged =
      stateTenderFormService &&
      !isEqual(
        formData?.provider_folder,
        stateTenderFormService.initialValues?.provider_folder,
      );

    if (
      !isEqual(currentDependencies, stateCurrentDependencies) ||
      hasAsiteFoldersFeature !== stateAsite ||
      formDataChanged
    ) {
      const serviceData = {
        pid,
        tid,
        region,
        constants,
        formData,
        selectedTenders,
        init,
        currentDependencies,
        project,
        milestones,
        hasAsiteFoldersFeature,
        callback: (data) => updateForms(tid, data),
      };
      return {
        tenderFormService: new TenderFormService(serviceData),
        currentDependencies,
        hasAsiteFoldersFeature,
        asiteFoldersLoaded: false,
        hasAsiteFolders: true,
        isLoadingAsiteFolders: false,
      };
    }
    return state;
  }

  render() {
    const { tenderFormService, isLoadingAsiteFolders } = this.state;
    if (!tenderFormService) {
      return null;
    }
    const {
      initialValues,
      formFields: fields,
      validationSchema,
    } = tenderFormService;
    const { triggerCustomErrors } = this.props;

    // Update provider_folder field with loading state
    const updatedFields = fields.map((field) => {
      if (field?.name === 'provider_folder') {
        return {
          ...field,
          isLoading: isLoadingAsiteFolders,
          loadingMessage: () => 'Loading folders...',
        };
      }
      return field;
    });

    return (
      <ClinkForm
        initialValues={initialValues}
        formFields={updatedFields}
        validationSchema={validationSchema}
        triggerCustomErrors={triggerCustomErrors}
        SubmitButton={() => null}
      />
    );
  }
}

export default Form;
