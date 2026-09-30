import React from 'react';
import PropTypes from 'prop-types';
import PackageCollator from 'v1/edit-project/components/package-collator';
import TenderBuilder from 'v1/edit-project/components/tender-builder';
import TeamManager from 'v2/apps/clink/pages/team-manager';
import GeneralInfo from './general-info';
import ProjectDetails from './project-details';

const Section = ({ activeStep }) => {
  let Component = null;
  switch (activeStep) {
    case 0:
      Component = <GeneralInfo />;
      break;
    case 1:
      Component = <TeamManager />;
      break;
    case 2:
      Component = <ProjectDetails />;
      break;
    case 3:
      Component = <PackageCollator v2 />;
      break;
    case 4:
      Component = <TenderBuilder v2 />;
      break;
    default:
      Component = 'Not found';
  }
  return Component;
};

Section.propTypes = {
  activeStep: PropTypes.number.isRequired,
};

export default Section;
