import React from 'react';
import Box from '@mui/material/Box';
import { useParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import 'v1/global';
import 'v1/company-assets/public/styles/index.scss';
import { goTo, getUrl } from 'v2/helpers/url';
import Relay from 'v1/global/services/Relay';
import Wrapper from 'v2/apps/shared/components/wrapper-v2';
import Header from 'v1/company-assets/components/Header';
import TemplateEditor from './TemplateEditor';

class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sow: {},
      error: false,
      loading: false,
      templateName: '',
    };

    this.updateTemplate = this.updateTemplate.bind(this);
    this.saveTemplate = this.saveTemplate.bind(this);
  }

  componentDidMount() {
    const { did } = this.props;

    this.setState({ loading: true });
    const templatesRelay = new Relay('template', 'getContent');
    templatesRelay
      .getJson({ did })
      .then((sow) => {
        const newSow = {
          id: did,
          content: { content: '' },
        };
        if (sow && sow.content) {
          newSow.content.content = sow.content.content || '';
        }

        this.setState({
          sow: {
            ...newSow,
            content: {
              ...newSow.content,
            },
          },
        });
        const templatesListRelay = new Relay('template', 'fetchAll');
        templatesListRelay
          .getJson({ type: 'sow' })
          .then((templates) => {
            const [selectedTemplate] = templates.filter(
              (template) => Number(template.id) === Number(did)
            );
            this.setState({
              templateName:
                selectedTemplate && selectedTemplate.name
                  ? selectedTemplate.name
                  : '',
              loading: false,
            });
          })
          .catch(() => {
            this.setState({ error: true, loading: false });
          });
      })
      .catch(() => {
        this.setState({ error: true, loading: false });
      });
  }

  updateTemplate(newValue) {
    this.setState((prevState) => {
      const { sow } = prevState;
      return {
        sow: { ...sow, content: { ...sow.content, content: newValue } },
      };
    });
  }

  saveTemplate() {
    const { sow } = this.state;
    const { did } = this.props;
    this.setState({ loading: true }, () => {
      const saveRelay = new Relay('template', 'saveContent');
      const { content } = sow;
      saveRelay
        .patch(content, { did })
        .then(() => {
          this.setState({ loading: false });
        })
        .catch(() => this.setState({ loading: false, error: true }));
    });
  }

  render() {
    const { loading, error, sow, templateName } = this.state;

    const header = (
      <Header
        title={`${templateName} Template`}
        routes={[
          {
            url: '/main-contractor/company-assets/scope-of-works',
            label: 'Scope of works',
          },
        ]}
      >
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            const newUrl = getUrl(
              'CLINK_APP_HOST',
              `${BASE_URLS.COMPANY_ASSETS}/scope-of-works`
            );
            goTo(newUrl);
          }}
        >
          Cancel changes
        </Button>
        <Button sx={{ ml: 2 }} variant="contained" onClick={this.saveTemplate}>
          Save changes
        </Button>
      </Header>
    );

    const leftContent = (
      <TemplateEditor sow={sow} updateTemplate={this.updateTemplate} />
    );

    return (
      <Box
        id="sow-box-mui"
        sx={{
          '& .sector.mr-0.panel-left--sector.card': {
            '&> .collapse.show': {
              '&> div': {
                '& .scope-of-works': {
                  '& .quill': {
                    height: '100%',
                  },
                },
              },
            },
          },
        }}
      >
        <Wrapper
          error={error}
          loading={loading}
          helpText="Create the Scope of Works description here. This will act as your default description of the subcontract works."
          header={header}
          leftContent={leftContent}
          severity="info"
        />
      </Box>
    );
  }
}

function WrappForm() {
  const { templateId: did } = useParams();
  return <Form did={did} />;
}

export default WrappForm;
