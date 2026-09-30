import React from 'react';
import { Card, CardBody, CardSubtitle } from 'clink-components';
import { StyledWrapperWithImage } from './styled';

const DashboardCardDesktop = ({
  theme = 'clink-dashboard-card-desktop',
  dropdown,
  cardName,
  handleClick,
  imageSrc,
  imageSrcHover,
}) => {
  return (
    <Card handleClick={handleClick} theme={theme}>
      <CardBody theme={theme}>
        <CardSubtitle theme={theme}>
          <StyledWrapperWithImage
            imageSrc={imageSrc}
            imageSrcHover={imageSrcHover}
            dropdown={dropdown}
          >
            {dropdown ?? cardName}
          </StyledWrapperWithImage>
        </CardSubtitle>
      </CardBody>
    </Card>
  );
};

export default DashboardCardDesktop;
