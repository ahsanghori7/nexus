import React from 'react';
import styled from 'styled-components';
import { CONSTANTS, HOOKS, Image } from 'clink-components';

const { prosperImage } = CONSTANTS.s3;
const { SM_SCREEN } = CONSTANTS.dimensions;
const { useWindowDimensions } = HOOKS;
const { white: prosperWhite } = CONSTANTS.colors.general;
const StyledHeaderLogo = styled.div`
  background: ${prosperWhite};
  width: 57px;
  height: 77px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderLogo = ({ subscriptionId, filterRoutes }) => {
  const dimensions = useWindowDimensions();
  const heightLogo = dimensions.width <= SM_SCREEN ? 27 : 28;
  const widthLogo = dimensions.width <= SM_SCREEN ? 19 : 20;

  const url = filterRoutes.includes(subscriptionId)
    ? `${BASE_URLS.PROSPER}/projects/enquiries`
    : `${BASE_URLS.PROSPER}/dashboard`;
  return (
    <StyledHeaderLogo>
      <a href={url} aria-label="header-logo">
        <Image height={heightLogo} width={widthLogo} src={prosperImage} />
      </a>
    </StyledHeaderLogo>
  );
};

export default HeaderLogo;
