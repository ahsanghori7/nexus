import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TokenModal from 'v2/apps/prosper/shared/TokenModal';
import { getQueryStringVars, resetUrl } from 'v2/helpers/url';
import ButtonWrapper from 'v2/apps/prosper/shared/ButtonWrapper';

const TokenButton = ({
  tokenPrices,
  subcontractor = {},
  claimToken = () => null,
}) => {
  // eslint-disable-next-line no-prototype-builtins
  const tokenUrl = getQueryStringVars().hasOwnProperty('token_modal_open');

  const [modal, setModal] = useState(tokenUrl);
  const [hasTokenUrl] = useState(tokenUrl);
  const { canClaimFreeTokens } = subcontractor;
  const { t } = useTranslation();
  const buyTokenCopy = canClaimFreeTokens
    ? 'claim-free-token'
    : 'buy-more-tokens';

  useEffect(() => {
    if (tokenUrl) {
      resetUrl();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TokenModal
      title={
        hasTokenUrl ? 'buy-more-tokens-instructions-5' : 'buy-more-tokens-title'
      }
      tokenPrices={tokenPrices}
      externalOpen={modal}
      onHiddenModal={() => setModal(false)}
      canClaimFreeTokens={subcontractor.canClaimFreeTokens}
      subcontractor={subcontractor}
      claimToken={claimToken}
      hasTokenUrl={hasTokenUrl}
      openElement={
        <ButtonWrapper
          id="page-header-token-button"
          className="package-modal header-buy-token"
          handleClick={() => setModal(true)}
        >
          {t(buyTokenCopy)}
        </ButtonWrapper>
      }
    />
  );
};

export default TokenButton;
