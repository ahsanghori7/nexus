import React from 'react';
import {
  Card,
  CardBody,
  CardImage,
  CardTitle,
  CardSubtitle,
} from 'clink-components';

const DashboardCard = ({
  theme = 'clink-dashboard-card',
  dropdown,
  imageSrc,
  cardName,
  handleClick,
}) => {
  return (
    <Card handleClick={handleClick} theme={theme}>
      <CardTitle theme={theme}>
        <CardImage theme={theme} src={imageSrc} alt="" />
      </CardTitle>
      <CardBody theme={theme}>
        <CardSubtitle theme={theme}>{cardName}</CardSubtitle>
        {dropdown}
      </CardBody>
    </Card>
  );
};

export default DashboardCard;
