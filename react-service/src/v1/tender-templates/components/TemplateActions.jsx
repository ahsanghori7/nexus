import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { getUrl } from 'v2/helpers/url';
import Relay from '../../global/services/Relay';
import Delete from '../../global/public/images/svg/bin-icon.svg';
import View from '../../global/public/images/svg/icon-view.svg';
import alertHelper from '../../global/helpers/alert';
import ConfirmModal from '../../global/components/ConfirmModal';

function deleteDocument(did, tid, pid, callback) {
  const deleteDocumentRelay = new Relay('tender_template', 'remove');
  deleteDocumentRelay.deleter({ did, tid, pid }).then(() => {
    callback();
  });
}

const OpenModal = ({ handleClick }) => (
  <Button onClick={handleClick}>
    <Delete />
  </Button>
);

const TenderName = ({ item }) => (
  <>
    Are you sure you want to delete{' '}
    <span className="tender-name">{item.name}</span>?
  </>
);

const TemplateActions = (props) => {
  const navigate = useNavigate();
  // Tid is needed to create the link to document creator
  // id is the doc id and needed for the link to document creator and for delete function
  const { tid, id, pid, item, loadTemplates } = props;
  const { status } = item;
  const url = getUrl(
    'clink_app_host',
    `document-creator/template/${id}/tender/${tid}`,
  );
  const viewDocFunc = () => {
    const isArchived = Number(status) === 3;
    if (isArchived) {
      const optionsError = {
        title: 'Archived',
        message:
          'The document has been archived. If you wish to see it, please email info@c-link.com',
        type: 'error',
      };
      alertHelper({}, null, {}, optionsError);
    } else {
      navigate(url);
    }
  };

  return (
    <div className="template-actions">
      <div className="template-action-container template-view">
        <Button onClick={viewDocFunc}>
          <View />
        </Button>
        <div className="pop-dialog">View document</div>
      </div>
      <div className="template-action-container template-delete">
        <ConfirmModal
          title={<TenderName item={item} />}
          subtitle="This template will be removed."
          OpenModal={OpenModal}
          handleSubmit={(propsModal) =>
            deleteDocument(id, tid, pid, () => {
              propsModal.setShow(false);
              loadTemplates(pid);
            })
          }
        />
        <div className="pop-dialog">Delete</div>
      </div>
    </div>
  );
};

export default TemplateActions;
