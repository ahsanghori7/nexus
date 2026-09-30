import React, { useState } from 'react';
import { goTo } from 'v2/helpers/url';
import Email from '../../../../global/components/Email';
import GreenButton from '../../../../global/components/general-ui/Buttons';
import { INFO_CLINK_EMAIL } from '../../../../global/helpers/constants';

const Content = ({ project, sidemodal = false }) => {
  const [clicked, setClicked] = useState(false);

  const handleOnClick = () => {
    setClicked(true);
    const { slug } = project;
    const dashboard = `${BASE_URLS.CLINK_APP_HOST}/main-contractor/project_dashboard/${slug}`;
    goTo(dashboard);
  };

  return (
    <div>
      <p>
        Your project files have been archived. Should you wish to download them,
        please email <Email>{INFO_CLINK_EMAIL}</Email> with the name of the
        project and we will send them to you.
      </p>
      {!sidemodal && (
        <div className="button-container">
          <GreenButton
            disabled={clicked}
            label="Return to project dashboard"
            onClick={handleOnClick}
            plusIcon={false}
          />
        </div>
      )}
    </div>
  );
};

export default Content;
