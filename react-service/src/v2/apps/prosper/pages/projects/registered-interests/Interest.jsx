import React, { useState, useEffect } from 'react';
import { CONSTANTS } from 'clink-components';
import RegisteredCard from 'v2/apps/shared/components/cards/big/registered-card';
import { getProjectLogo, checkIfImageExists } from 'v2/helpers/url';

const { prosperPackagesDefault } = CONSTANTS.s3;
const Interest = ({ item, version = 'v1' }) => {
  const [images, setImages] = useState('');
  useEffect(() => {
    const projectImage = getProjectLogo(item.id);
    checkIfImageExists(projectImage, (exists) => {
      setImages(exists ? projectImage : prosperPackagesDefault);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <RegisteredCard
      key={item.id}
      item={item}
      image={images}
      version={version}
    />
  );
};

export default Interest;
