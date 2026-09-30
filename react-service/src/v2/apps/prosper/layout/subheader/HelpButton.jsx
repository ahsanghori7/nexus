import React from 'react';
import NeedHelp from 'v2/apps/prosper/shared/NeedHelp';

const HelpButton = ({ tokenPrices }) => (
  <NeedHelp title="buy-more-tokens-title" tokenPrices={tokenPrices} />
);

export default HelpButton;
