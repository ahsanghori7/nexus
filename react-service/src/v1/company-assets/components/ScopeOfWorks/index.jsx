import React from 'react';
import { getUrl } from 'v2/helpers/url';
import Relay from '../../../global/services/Relay';
import EditIcon from '../../../global/public/images/svg/edit-icon.svg';
import RestoreIcon from '../../../global/public/images/svg/restore-icon.svg';
import Wrapper from '../../../global/components/Wrapper';
import Table from '../Table';
import Header from '../Header';
import ActionsItems from '../ActionsItems';
import PackageModal from './packages-modal';
import RestoreModal from './restore-modal';

class ScopeOfWorks extends React.Component {
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
    this.setState({ loading: true }, () => {
      const templatesRelay = new Relay('template', 'fetchAll');
      templatesRelay
        .getJson({ type: 'sow' })
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
          { type: 'custom_sow_asset', name: encodeURIComponent(template) }
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
      restore.patch({}, { did: id }).catch(() => {
        this.setState({ error: true, loading: false });
      });
    });
  }

  render() {
    const { templates, loading, error } = this.state;
    const assetsHeaders = {
      name: {
        label: 'Package',
      },
      actions: {
        label: 'Actions',
        render: (_value, template) => {
          const id = template && template.id ? template.id : '';
          return (
            <ActionsItems
              items={[
                {
                  id: 1,
                  tooltip: 'Edit Template',
                  content: (
                    <ReactLink
                      to={getUrl(
                        'CLINK_APP_HOST',
                        `${BASE_URLS.COMPANY_ASSETS}/scope-of-works/${id}`
                      )}
                    >
                      <button type="button" className="edit-template-sow-1">
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
                      restoreTemplate={this.restoreTemplate}
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
      <Header title="Scope of Works">
        <PackageModal
          addTemplate={this.addTemplate}
          templates={templates}
          label="Create new scope template"
        />
      </Header>
    );
    const leftContent = (
      <Table
        title="Select a Scope of Works template to view"
        data={templates}
        assetsHeaders={assetsHeaders}
      />
    );
    return (
      <Wrapper
        error={error}
        loading={loading}
        helpText="Here you can view, edit, and create scope of works templates."
        header={header}
        leftContent={leftContent}
      />
    );
  }
}

export default ScopeOfWorks;
