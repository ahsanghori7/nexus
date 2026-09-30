import React, { useState } from 'react';
import { useContext } from 'hooks/context';
import { analytics } from 'services/helpers';
import Subscription from 'v2/helpers/user/subscription';
import Form from './form';
import { CommonContent } from '../CommonModal';

const subscriptionHelper = new Subscription();
const TENDER_RECEIVED_ID = 4;

const SendQuote = ({
  enquiry = { package: '', project: '' },
  dispatch,
  subcontractor = {},
  onHidden = () => null,
}) => {
  const { package: trade, project } = enquiry;
  const context = useContext(BASE_DIRS.V2.PROSPER);
  const { actions } = context;

  const [docsToSend, setDocsToSend] = useState([]);

  const handleSubmit = (data) => {
    const fileList = new DataTransfer();
    docsToSend.forEach((d) => fileList.items.add(d));
    const files = fileList.files;

    const dataForm = { ...data, document: files };

    analytics('history.quote.sent', enquiry.id_author, enquiry.group_id, () =>
      dispatch(
        actions.createQuote({
          enquiryId: enquiry.id,
          data: dataForm,
        })
      )
        .then(() => {
          onHidden();
          return dispatch(
            actions.enableProsperProBanner({
              enableProsperProBanner: subscriptionHelper.isExternal(
                subcontractor.subscription_id
              ),
            })
          );
        })
    );
  };
  const updateDocumentsToSend = (newDocuments) => setDocsToSend(newDocuments);
  return (
    <CommonContent
      title="send-quotation"
      subtitle={`${trade || 'trade'} at ${project || 'project'}`}
    >
      <Form
        handleSubmit={handleSubmit}
        updateDocumentsToSend={updateDocumentsToSend}
      />
    </CommonContent>
  );
};

export default SendQuote;
export { TENDER_RECEIVED_ID };
