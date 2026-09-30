import React from 'react';
import V1 from './v1';
import V2 from './v2';

const versioning = {
  v1: V1,
  v2: V2,
};
const RegisteredCard = ({
  item,
  cardTheme = 'prosper-big-card',
  image,
  version = 'v1',
}) => {
  const Component = versioning[version];
  return <Component item={item} image={image} cardTheme={cardTheme} />;
};

export default RegisteredCard;
