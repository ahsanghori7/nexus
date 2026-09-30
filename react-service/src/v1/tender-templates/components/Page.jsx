import React from 'react';
import { useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import 'v1/global';
import 'v1/tender-templates/public/styles/index.scss';
import Alert from 'react-bootstrap/Alert';
import Loading from '../../global/components/Loading';
import TemplateTable from './TemplateTable';
import Relay from '../../global/services/Relay';

class TenderTemplates extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: false,
      tenderTemplates: [],
      assets: [],
      templatesLoaded: false,
      assetsLoaded: false,
    };

    this.createTenderTemplates = this.createTenderTemplates.bind(this);
    this.loadTemplates = this.loadTemplates.bind(this);
  }

  componentDidMount() {
    const { projectData } = this.props;
    const { id } = projectData;
    this.loadTemplates(id);

    const assetsRelay = new Relay('template', 'fetchAll');
    assetsRelay
      .getJson({ type: 'tenders' })
      .then((assets) => {
        this.setState({ assets, assetsLoaded: true });
      })
      .catch(() => {
        this.setState({ error: true });
      });
  }

  loadTemplates(pid) {
    const templateRelay = new Relay('tender_template', 'fetchAll');
    templateRelay
      .getJson({ pid })
      .then((tenderTemplates) => {
        this.setState({ tenderTemplates, templatesLoaded: true });
      })
      .catch(() => {
        this.setState({ error: true });
      });
  }

  createTenderTemplates(pid, tid, did) {
    const createTenderRelay = new Relay('tender_template', 'create');
    createTenderRelay
      .post({}, { tid, did, pid })
      .then((response) => response.json())
      .then((e) => {
        if (e?.success && e?.docId) {
          this.props.navigate(
            `/document-creator/template/${e?.docId}/tender/${tid}`,
          );
        } else {
          this.setState({ templatesLoaded: false, error: true });
        }
      })
      .catch(() => {
        this.setState({ error: true });
      });
  }

  render() {
    const { error, assetsLoaded, tenderTemplates, templatesLoaded, assets } =
      this.state;
    const { projectData } = this.props;
    const loaded = assetsLoaded && templatesLoaded;
    return (
      <>
        {!loaded && !error && <Loading />}
        {loaded && !error && (
          <TemplateTable
            projectData={projectData}
            assets={assets}
            data={tenderTemplates}
            createTemplate={this.createTenderTemplates}
            loadTemplates={this.loadTemplates}
          />
        )}
        {error && (
          <Alert variant="danger">
            An error occurred while fetching the form data.
          </Alert>
        )}
      </>
    );
  }
}

const Wrapper = (props) => {
  const navigate = useNavigate();
  const { projectData } = props;
  if (!projectData || (projectData && !projectData.id)) {
    return <Loading />;
  }

  return <TenderTemplates {...props} navigate={navigate} />;
};

const mapStateToProps = (state) => ({
  projectData: state.project.data,
});

export default connect(mapStateToProps)(Wrapper);
