import React, { useState } from 'react';
import Modal from '../../../../global/components/modal';
import Content from './Content';
import Relay from '../../../../global/services/Relay';

const OpenModalButton = ({ handleClick, label }) => {
  return <button onClick={handleClick}>{label}</button>;
};

const RestoreModal = ({ template, label = '', restoreTemplate }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  let canRestore = true;
  let child = [];
  // eslint-disable-next-line react/no-unstable-nested-components
  const OpenButton = ({ handleClick }) => {
    const relayWrapper = () => {
      const fetchDoc = new Relay('template', 'fetch');
      fetchDoc.getJson({ did: template.id }).then((json) => {
        const { children } = json;
        if (children.length === 0) {
          canRestore = false;
        } else {
          [child] = children;
        }

        handleClick();
      });
    };
    return <OpenModalButton handleClick={relayWrapper} label={label} />;
  };

  const title = 'Are you sure you want to restore to default template?';
  return (
    <Modal
      title={title}
      subtitle="This action will remove any changes you’ve made to the template."
      showClose={false}
      ShowButton={OpenButton}
      className="modal-restore-template"
      render={(modalProps) => {
        const { setShow } = modalProps;
        return (
          <Content
            template={child}
            canRestore={canRestore}
            setShow={setShow}
            error={error}
            loading={loading}
            restoreTemplate={restoreTemplate}
            setError={setError}
            setLoading={setLoading}
          />
        );
      }}
    />
  );
};

export default RestoreModal;
