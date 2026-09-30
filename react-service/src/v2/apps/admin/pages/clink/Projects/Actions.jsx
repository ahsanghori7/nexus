import React from 'react';
import {
  Dropdown,
  OpenDropdown,
  Image,
  Justify,
  CONSTANTS,
} from 'clink-components';
import i18next from 'v2/helpers/i18n';
import ConfirmModal from 'v2/apps/shared/components/confirm-modal';

const { blackCarretDown, blackCarretUp } = CONSTANTS.s3;

const Actions = ({ project, projectsActions, statusList, handleConfirm }) => {
  const actions =
    projectsActions && projectsActions.length ? projectsActions : [];
  const [action] = actions;
  const options = statusList && statusList.length ? statusList : [];
  return (
    <Justify>
      <Dropdown
        theme="admin-clink-projects"
        xOffset={-78}
        key={action.id}
        align={action.align}
        openButton={action.text}
        dropdownContentWidth={90}
        renderOpenDropdown={({ isOpen, align, handleClick }) => (
          <OpenDropdown
            open={isOpen}
            align={align}
            handleClick={handleClick}
            downIcon={<Image src={blackCarretDown} />}
            upIcon={<Image src={blackCarretUp} />}
            data-testid="projects-actions-dropdown-trigger"
          />
        )}
        content={options.map((statusProject) => (
          <ConfirmModal
            key={statusProject.id}
            data={statusProject}
            selected={
              project.status.toLowerCase() === statusProject.label.toLowerCase()
            }
            buttonLabel={statusProject.label}
            title={i18next.t('change-status')}
            subtitle={i18next.t('are-you-sure')}
            handleConfirm={handleConfirm}
          />
        ))}
      />
    </Justify>
  );
};

export default Actions;
