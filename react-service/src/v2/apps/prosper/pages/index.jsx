import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Page, Image, CONSTANTS } from 'clink-components';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import {
  getQueryStringVars,
  resetUrl,
  getUrlWithoutParamers,
} from 'v2/helpers/url';
import WarnModal from 'v2/apps/shared/components/WarnModal';
import {
  StyledSuccesContent,
  StyledSuccesContentDescription,
  StyledSuccesContentChecked,
  StyledSuccesContentStripe,
} from 'v2/apps/prosper/shared/styled';

const { logoChecked, logoStripe } = CONSTANTS.s3;

const titleConfig = {
  order_success: 'ORDER SUCCESSFUL',
  order_failed: 'Error',
};

const messageConfig = {
  order_success: 'Your tokens have been added to your account',
  order_failed: 'There was an error while purchasing the tokens',
};

const initialUrl = getUrlWithoutParamers();

function Prosper(props) {
  const [url, setUrl] = useState(initialUrl);
  const location = useLocation();
  const context = useContext('prosper');
  const { actions } = context;
  const { children, title = 'title', type = 'string', dispatch } = props;
  let messageType = null;

  // eslint-disable-next-line no-prototype-builtins
  if (getQueryStringVars().hasOwnProperty('order_success')) {
    messageType = 'order_success';
  }

  // eslint-disable-next-line no-prototype-builtins
  if (getQueryStringVars().hasOwnProperty('order_failed')) {
    messageType = 'order_failed';
  }

  useEffect(() => {
    setUrl(getUrlWithoutParamers());
  }, [location]);

  useEffect(() => {
    dispatch(actions.setTitle(title));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  useEffect(() => {
    dispatch(actions.setType(type));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    dispatch(actions.setLock(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line prefer-regex-literals
  const regex1 = new RegExp(/company_profile\/[0-9]{1,9}/gim);
  // eslint-disable-next-line prefer-regex-literals
  const regex2 = new RegExp(/projects\/[0-9]{1,9}/gim);
  const noPadding =
    url.includes('success-stories') ||
    url.includes('/projects/enquiries') ||
    regex1.test(url) ||
    regex2.test(url);

  const handleHide = () => resetUrl();

  return (
    <Page theme="prosper" noPadding={noPadding}>
      {messageType && (
        <WarnModal
          title={titleConfig[messageType]}
          message={
            messageType === 'order_success' ? (
              <StyledSuccesContent>
                <StyledSuccesContentDescription>
                  {messageConfig[messageType]}
                </StyledSuccesContentDescription>

                <StyledSuccesContentChecked>
                  <Image src={logoChecked} />
                </StyledSuccesContentChecked>
                <StyledSuccesContentStripe>
                  <Image src={logoStripe} />
                </StyledSuccesContentStripe>
              </StyledSuccesContent>
            ) : (
              messageConfig[messageType]
            )
          }
          onHidden={handleHide}
          className="action-required-modal buy-token-modal"
          theme="prosper"
        />
      )}
      {children}
    </Page>
  );
}

const mapStateToProps = (state) => ({
  config: state.config,
});

export default connect(mapStateToProps)(Prosper);
