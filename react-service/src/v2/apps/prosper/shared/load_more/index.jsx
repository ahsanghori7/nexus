import React from 'react';
import i18next from 'v2/helpers/i18n';
import { Button } from 'clink-components';
import StyledLoadMore from './LoadMore.styled';

const LoadMore = ({ data, loaded, onLoad }) => (
  <StyledLoadMore>
    {data && loaded < data.length && (
      <Button
        className="load-more-btn"
        label={i18next.t('load-more')}
        color="prosperGreenButton"
        sizeBtn="large"
        layout="square"
        handleClick={onLoad}
      />
    )}
  </StyledLoadMore>
);

export default LoadMore;
