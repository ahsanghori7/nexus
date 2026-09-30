import React, { useCallback } from 'react';
import i18next from 'v2/helpers/i18n';
import { useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import 'v1/global';
import 'v1/edit-project/public/styles/index.scss';
import { Alert } from 'react-bootstrap';
import Grid from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import ClinkForm from '../../../global/components/clink-form';
import Loading from '../../../global/components/Loading';
import PackageCollatorService from '../../../global/services/plan-my-project/package-collator';
import DocumentsService from '../../../global/services/documents';
import PackageCollatorPage from './PackageCollator';
import {
  DEFAULT_MAX_SIZE_MB,
  sizeFileIsCorrect,
  typeFileIsAccepted,
} from 'v2/helpers/files';

const EmptyButton = () => null;

class PackageCollator extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: true, submittingFiles: false, error: false };
    this.packageCollatorService = new PackageCollatorService();
    this.documentsService = new DocumentsService();
    this.attachForcedRender = this.attachForcedRender.bind(this);
  }

  componentDidMount() {
    const { projectData } = this.props;
    const { id: pid } = projectData;

    if (pid) {
      this.packageCollatorService = new PackageCollatorService(projectData);
      this.packageCollatorService
        .getCategories()
        .then(this.packageCollatorService.initializeHandleDropzone)
        .then(() => this.setState({ loading: false, error: false }))
        .catch(() => this.setState({ loading: false, error: true }));
    } else {
      this.setState({ loading: false, error: true });
    }
  }

  attachForcedRender(formFields) {
    const [documents] = formFields;
    const newHandleSetDropzone = (label, callback) =>
      documents
        .handleSetDropzone(label, callback)
        .then((success) => success && this.forceUpdate());
    return [
      {
        ...documents,
        handleSetDropzone: newHandleSetDropzone,
      },
    ];
  }

  render() {
    const {
      initialValues,
      formFields: fields,
      validationSchema,
      handleSubmit,
    } = this.packageCollatorService;
    const { loading, submittingFiles, error } = this.state;

    const extraProps = {
      title: i18next.t('upload-reference-documentation'),
      fetch: async (id, file) =>
        new Promise((resolve) => {
          this.setState({ submittingFiles: true }, () => resolve(true));
        })
          .then(() => {
            const sizeLimit = ENV === 'anz' ? 100 : DEFAULT_MAX_SIZE_MB;
            if (!sizeFileIsCorrect(file, sizeLimit)) {
              return { success: false, errorMessage: 'File too large' };
            }
            if (!typeFileIsAccepted(file)) {
              return { success: false, errorMessage: 'Invalid type' };
            }
            return this.documentsService.create(file, true);
          })
          .then((response) => {
            if (response && response.success) {
              return this.packageCollatorService
                .addFile(id, response.id)
                .then(() => response);
            }
            return response;
          }),
      removeFile: this.documentsService.delete,
      submittingFiles,
      callback: () => this.setState({ submittingFiles: false }),
    };

    return (
      <>
        {error && (
          <Alert variant="danger">
            An error ocurred while fetching the form data.
          </Alert>
        )}
        {loading && <Loading />}
        {!loading && !error && (
          <>
            <ClinkForm
              initialValues={initialValues}
              formFields={this.attachForcedRender(fields)}
              validationSchema={validationSchema}
              Content={PackageCollatorPage}
              handleSubmit={handleSubmit}
              className="edit-project__package-collator"
              extraProps={extraProps}
              SubmitButton={EmptyButton}
              enableReinitialize
            />
            <Grid container justifyContent="space-between" pt={2} spacing={2}>
              <Grid size={{ xs: 12, md: 3.65 }}>
                <Button
                  data-testid="package-collator-go-back-button"
                  sx={{ mr: 2 }}
                  onClick={this.props.goBack}
                  variant="contained"
                  color="border"
                  size="large"
                >
                  {i18next.t('go-back')}
                </Button>
              </Grid>
              <Grid
                size={{ xs: 12, md: 3.65 }}
                textAlign={{ xs: 'left', md: 'right' }}
              >
                <Button
                  data-testid="package-collator-next-button"
                  onClick={this.props.goNext}
                  variant="contained"
                  color="primary"
                  size="large"
                >
                  {i18next.t('next')}
                </Button>
              </Grid>
              <Grid size={{ xs: 12, md: 4.7 }} />
            </Grid>
          </>
        )}
      </>
    );
  }
}

const Wrapper = (props) => {
  const navigate = useNavigate();

  const back = useCallback(
    () =>
      navigate(
        `/main-contractor/projects/${props?.projectData?.slug}/setup/scope_details`
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props?.projectData?.slug]
  );
  const next = useCallback(
    () =>
      navigate(
        `/main-contractor/projects/${props?.projectData?.slug}/setup/work_packages`
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props?.projectData?.slug]
  );

  const { projectData } = props;
  if (!projectData || (projectData && !projectData.id)) {
    return <Loading />;
  }
  return (
    <PackageCollator
      {...props}
      slug={projectData.slug}
      goBack={back}
      goNext={next}
    />
  );
};

const mapStateToProps = (state) => ({
  projectData: state.project.data,
});

export default connect(mapStateToProps)(Wrapper);
