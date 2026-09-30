import React from 'react';
import PropTypes from 'prop-types';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import { goToNewTab } from 'v2/helpers/url';
import {
  GreenButton,
  Tooltip,
} from 'v1/procurement-schedule/components/page/general-ui';

const ViewButton = ({ handleClick, label }) => (
  <GreenButton
    plusIcon={false}
    className="tender-log-green-button"
    label={label}
    handleClick={handleClick}
  />
);

const Actions = ({ sid, meta }) => {
  const label = 'View Attachments';
  const validMeta = isObject(meta) && !isArray(meta) && 'document' in meta;
  if (!validMeta) {
    return null;
  }
  const content =
    (meta?.document?.bulk && meta?.document?.bulk[sid]) ||
    (meta?.document && meta?.document[sid]) ||
    meta?.document;
  if (!content?.id) {
    return null;
  }
  return (
    <div className="tender-log-actions">
      <Tooltip message={label}>
        <ViewButton
          handleClick={() => goToNewTab(`/download-all/document/${content.id}`)}
          label={label}
        />
      </Tooltip>
    </div>
  );
};

Actions.propTypes = {
  sid: PropTypes.string.isRequired,
  meta: PropTypes.shape({
    document: PropTypes.oneOfType([
      PropTypes.shape({
        bulk: PropTypes.object,
      }),
      PropTypes.object,
    ]),
  }),
};

export default Actions;
