import React from 'react';
import { Link as ReactLink } from 'react-router-dom';
import 'v1/global';
import 'v1/company-assets/public/styles/index.scss';
import Table from 'v1/company-assets/components/TableV2';
import Wrapper from 'v2/apps/shared/components/wrapper-v2';
import Relay from '../../../global/services/Relay';
import EditIcon from '../../../global/public/images/svg/edit-icon.svg';
import RestoreIcon from '../../../global/public/images/svg/restore-icon.svg';
import Header from '../Header';
import ActionsItems from '../ActionsItems';
import PackageModal from './packages-modal';
import RestoreModal from './restore-modal';

class Packages extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      templates: [],
      error: false,
      loading: false,
    };

    this.addTemplate = this.addTemplate.bind(this);
    this.restoreTemplate = this.restoreTemplate.bind(this);
  }

  componentDidMount() {
    const { action = 'template', method = 'fetchAll', type } = this.props;
    this.setState({ loading: true }, () => {
      const templatesRelay = new Relay(action, method);
      templatesRelay
        .getJson({ type })
        .then((templates) => {
          this.setState({ templates, loading: false });
        })
        .catch(() => {
          this.setState({ error: true, loading: false });
        });
    });
  }

  addTemplate(template, onError) {
    this.setState({ loading: true }, () => {
      const relay = new Relay('template', 'create');
      relay
        .post(
          {
            content: { content: '' },
          },
          { type: 'custom_sow_asset', name: encodeURIComponent(template) },
        )
        .then((response) => response.json())
        .then((data) => {
          this.setState((prevState) => {
            const { templates } = prevState;
            return {
              loading: false,
              templates: [
                ...templates,
                {
                  id: data.id,
                  name: template,
                },
              ],
            };
          });
        })
        .catch((err) => {
          if (onError) {
            onError(err);
            this.setState({ error: true, loading: false });
          }
        });
    });
  }

  restoreTemplate(id) {
    this.setState({ loading: true }, () => {
      const restore = new Relay('template', 'restore');
      restore
        .patch({}, { did: id })
        .finally(() => {
          this.setState({ loading: false });
        })
        .catch(() => {
          this.setState({ error: true });
        });
    });
  }

  render() {
    const { templates, loading, error } = this.state;
    const { subtitle, helpText, editUrl } = this.props;

    const assetsHeaders = {
      name: {
        label: 'Package',
      },
      actions: {
        label: 'Actions',
        render: (_value, template) => {
          const mainId = template && template.id ? template.id : '';
          const restore = (id) => this.restoreTemplate(id);
          return (
            <ActionsItems
              items={[
                {
                  id: 1,
                  tooltip: 'Edit Template',
                  content: (
                    <ReactLink to={`${editUrl}/${mainId}`}>
                      <button type="button" className="edit-template-sow-2">
                        <EditIcon />
                      </button>
                    </ReactLink>
                  ),
                },
                {
                  id: 2,
                  tooltip: 'Restore Template',
                  content: (
                    <RestoreModal
                      template={template}
                      label={<RestoreIcon />}
                      restoreTemplate={restore}
                    />
                  ),
                },
              ]}
            />
          );
        },
      },
    };
    const header = (
      <Header>
        <PackageModal
          addTemplate={this.addTemplate}
          templates={templates}
          label="Create new scope template"
        />
      </Header>
    );
    const leftContent = (
      <Table title={subtitle} data={templates} assetsHeaders={assetsHeaders} />
    );

    return (
      <Wrapper
        error={error}
        loading={loading}
        helpText={helpText}
        header={header}
        leftContent={leftContent}
        severity="info"
      />
    );
  }
}

export default Packages;
