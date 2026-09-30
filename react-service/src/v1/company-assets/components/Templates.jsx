import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import IconView from 'v1/global/public/images/svg/icon-view.svg';
import 'v1/global';
import 'v1/company-assets/public/styles/index.scss';
import { getUrl } from 'v2/helpers/url';
import flag from 'v2/helpers/flags';
import Wrapper from 'v2/apps/shared/components/wrapper-v2';
import assetsLoader from 'v1/company-assets/services/assets';
import Table from './TableV2';
import Header from './Header';
import { TemplateActions } from './template-actions';
import EditTemplateDialog from './template-actions/EditTemplateDialog';
import RenameTemplateDialog from './template-actions/RenameTemplateDialog';
import DeleteTemplateDialog from './template-actions/DeleteTemplateDialog';

const prefix = BASE_URLS.DOCUMENT_CREATOR || '';
const transformLabel = {
  orders: 'order',
  tenders: 'tender',
};

class TenderAssets extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: false,
      loading: false,
      assets: [],
      confirmOpen: false,
      confirmRow: null,
      renameOpen: false,
      renameRow: null,
      editOpen: false,
      editRow: null,
    };

    this.assetsHeaders = {
      name: {
        label: 'Templates',
      },
      actions: {
        label: 'Actions',
        render: (_value, row) => {
          if (flag('SOW_ACTIONS')) {
            return (
              <TemplateActions
                row={row}
                typeAsset={this.props.typeAsset}
                onDeleteClick={this.handleOpenConfirm}
                onRenameClick={this.handleOpenRename}
                onEditClick={this.handleOpenEdit}
              />
            );
          }
          const documentURL = `${prefix}/template/${row.id}`;
          const openTemplate = async () => {
            const url = getUrl('CLINK_APP_HOST', documentURL);
            if (url) {
              window.open(url, '_blank');
            }
          };
          return (
            <Tooltip
              title={`View ${transformLabel[props?.typeAsset]} document`}
            >
              <IconButton onClick={openTemplate}>
                <IconView />
              </IconButton>
            </Tooltip>
          );
        },
      },
    };
  }

  componentDidMount() {
    const { typeAsset } = this.props;
    this.setState({ loading: true }, () => {
      assetsLoader(typeAsset)
        .then((json) => {
          const assets = [];
          json.forEach((item) => {
            const { label, id } = item;
            assets.push({
              id,
              name: label,
              inUse: !!item.inUse,
            });
          });
          this.setState({ assets, loading: false });
        })
        .catch(() => this.setState({ error: true, loading: false }));
    });
  }

  handleOpenConfirm = (row) => {
    this.setState({ confirmOpen: true, confirmRow: row });
  };

  handleCloseConfirm = () => {
    this.setState({ confirmOpen: false, confirmRow: null });
  };

  handleConfirmDelete = () => {
    const { confirmRow } = this.state;
    if (confirmRow) {
      // TODO: replace with real delete API call
      // eslint-disable-next-line no-console
      console.log('Deleting row:', confirmRow);
    }
    this.handleCloseConfirm();
  };

  handleOpenRename = (row) => {
    this.setState({ renameOpen: true, renameRow: row });
  };

  handleCloseRename = () => {
    this.setState({ renameOpen: false, renameRow: null });
  };

  handleSubmitRename = (newName) => {
    // Todo: Replace with real API call as needed, then sync local state:
    this.setState((prev) => ({
      assets: prev.assets.map((a) =>
        a.id === prev.renameRow?.id ? { ...a, name: newName } : a,
      ),
      renameOpen: false,
      renameRow: null,
    }));
  };

  handleOpenEdit = (row) => {
    this.setState({ editOpen: true, editRow: row });
  };

  handleCloseEdit = () => {
    this.setState({ editOpen: false, editRow: null });
  };

  handleSubmitEdit = ({ title, body }) => {
    this.setState((prev) => ({
      assets: prev.assets.map((a) =>
        a.id === prev.editRow?.id ? { ...a, name: title, body } : a,
      ),
      editOpen: false,
      editRow: null,
    }));
  };

  render() {
    const {
      assets,
      loading,
      error,
      confirmOpen,
      renameRow,
      editOpen,
      editRow,
      renameOpen
    } = this.state;
    const { tenderTemplate } = this.props;

    const header = <Header />;

    const leftContent = (
      <Table
        title={`View ${tenderTemplate}`}
        data={assets}
        assetsHeaders={this.assetsHeaders}
      />
    );

    return (
      <>
        <Wrapper
          error={error}
          loading={loading}
          rightContent="This is where you are able to view and edit document templates."
          header={header}
          leftContent={leftContent}
          severity="info"
        />
        <DeleteTemplateDialog
          open={confirmOpen}
          onClose={this.handleCloseConfirm}
          onConfirm={this.handleConfirmDelete}
        />
        <RenameTemplateDialog
          open={renameOpen}
          originalName={renameRow?.name || ''}
          existingNames={assets.map((a) => a.name)}
          onClose={this.handleCloseRename}
          onSubmit={this.handleSubmitRename}
        />
        <EditTemplateDialog
          open={editOpen}
          originalTitle={editRow?.name || ''}
          originalBody={editRow?.body || ''}
          existingTitles={assets.map((a) => a.name)}
          onClose={this.handleCloseEdit}
          onSave={this.handleSubmitEdit}
        />
      </>
    );
  }
}

export default TenderAssets;
