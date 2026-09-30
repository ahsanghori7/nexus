import React from 'react';
import { Card, CardBody, CardTitle, CardSubtitle } from 'clink-components';
import { StyledRightContent } from './styled';

const ProsperDashboardCard = ({
  theme = 'prosper-dashboard-card',
  title,
  optionalRightContent,
  children,
}) => {
  return (
    <Card theme={theme}>
      {title && (
        <CardTitle theme={theme}>
          <CardSubtitle theme={theme}> {title}</CardSubtitle>
          {optionalRightContent && (
            <StyledRightContent>{optionalRightContent}</StyledRightContent>
          )}
        </CardTitle>
      )}
      <CardBody theme={theme}>{children}</CardBody>
    </Card>
  );
};

export default ProsperDashboardCard;
