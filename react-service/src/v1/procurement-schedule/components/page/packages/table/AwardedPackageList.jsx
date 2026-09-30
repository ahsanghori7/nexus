import React from 'react';
import isEmpty from 'lodash/isEmpty';
import ListGroup from 'react-bootstrap/ListGroup';
import ClinkService from '../../../../../global/services/clink';
import { Status, Title, UID_AWARDED, TYPE_ENQUIRY } from './row-assets';

const UID_SENT = 'sent';
const UID_VIEWED = 'viewed';
const UID_INFO = 'info';
const AwardedPackageList = ({ procurement }) => {
  let formattedData = ClinkService.transformToArray(procurement);
  formattedData = formattedData.filter(
    (subcontractor) => subcontractor.status.uid !== UID_AWARDED
  );
  if (isEmpty(formattedData)) {
    return null;
  }
  return (
    <>
      <h3 className="other-candidates">Other candidates</h3>
      <ListGroup className="packages-component__not-awarded-list">
        {formattedData.map((subcontractor) => {
          const { type, status, sub_id: subId } = subcontractor;
          let newStatus = { ...status };
          /* eslint default-case: "off" */
          if (type === TYPE_ENQUIRY) {
            switch (status.uid) {
              case UID_SENT:
              case UID_VIEWED:
                newStatus = {
                  ...status,
                  clink_label: 'Never responded',
                };
                break;
              case UID_INFO:
                newStatus = {
                  ...status,
                  clink_label: 'Needed more info',
                };
                break;
            }
          }
          return (
            <ListGroup.Item key={subId}>
              <Title
                className="packages-component__not-awarded-title"
                subcontractor={subcontractor}
              >
                <Status status={newStatus} />
              </Title>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </>
  );
};

export default AwardedPackageList;
