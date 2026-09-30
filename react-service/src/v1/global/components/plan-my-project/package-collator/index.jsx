import React from 'react';
import PanelForm from '../../layout/panel/Form';
import AcceptedFilesList from './AcceptedFilesList';

const PackageCollator = ({
  title,
  contentLeft,
  contentRight = <AcceptedFilesList />,
  children,
}) => (
  <>
    <PanelForm
      title={title}
      contentLeft={contentLeft}
      contentRight={contentRight}
    />
    {children}
  </>
);

export default PackageCollator;
