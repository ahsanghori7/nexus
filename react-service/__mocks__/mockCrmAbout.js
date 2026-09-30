import React from 'react';

// Mock for v2/apps/prosper/shared/crm-components/About
const About = ({
  title,
  fontTitleSx,
  descSx,
  src,
  displayName,
  jobTitle,
  loading,
  ...props
}) => {
  if (loading) {
    return <div data-testid="about-loading">Loading about...</div>;
  }

  return (
    <div
      data-testid="about"
      data-title={title}
      data-display-name={displayName}
      data-job-title={jobTitle}
      {...props}
    >
      {src && <img src={src} alt={`${title}-icon`} />}
      <h3>{title}</h3>
      {displayName && <div data-testid="display-name">{displayName}</div>}
      {jobTitle && <div data-testid="job-title">{jobTitle}</div>}
    </div>
  );
};

export default About;
