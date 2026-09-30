import React from 'react';
import isNil from 'lodash/isNil';

const Breadcrumbs = ({ routes = null }) => {
  const breadcrumbsElements = isNil(routes)
    ? null
    : routes.map(({ url, breadcrumb }) => (
        <span className="breadcrumbs-elem" key={url}>
          <a href={url}>{breadcrumb}</a>
        </span>
      ));

  return <div className="breadcrumbs">{breadcrumbsElements}</div>;
};

export default Breadcrumbs;
