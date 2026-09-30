import React from 'react';
import i18n from 'i18next';
import Grid2 from '@mui/material/Grid2';
import { useNavigate } from 'react-router-dom';
import EmptyState from 'v2/apps/shared/components/empty-state';
import AddIcon from '@mui/icons-material/Add';

const ProjectLoading = ({ loading, isThereTasks, slug }) => {
  const navigate = useNavigate();
  const tradesWorkPackagesUrl = `/main-contractor/projects/${slug}/setup/work_packages`;

  return (
    !loading &&
    !isThereTasks && (
      <Grid2
        container
        justifyContent="center"
        flexDirection="column"
        alignItems="center"
        sx={{
          width: '100%',
          mb: 3,
        }}
      >
        <EmptyState
          variant="firstUse"
          size="default"
          title={i18n.t('project-dashboard-no-packages-title')}
          description={i18n.t('no-trades')}
          primaryAction={{
            label: i18n.t('project-dashboard-add-trades-work-packages'),
            onClick: () => navigate(tradesWorkPackagesUrl),
            icon: AddIcon,
          }}
          sx={{
            width: '100%',
          }}
        />
      </Grid2>
    )
  );
};

export default ProjectLoading;
