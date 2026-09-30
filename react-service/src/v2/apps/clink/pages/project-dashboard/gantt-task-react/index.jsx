import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { CONSTANTS, Gantt } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import InfoModal from 'v2/apps/shared/components/InfoModal';
import { useTranslation } from 'react-i18next';
import PackageDetails from './package-details';
import Timeline from './timeline';

const { clinkGreen, clinkRed } = CONSTANTS.colors.general;

const GanttTaskReact = ({
  alert,
  tasks,
  useSetView,
  service,
  size,
  slug,
}) => {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useSetView;
  const [selectedTask, setSelectedTask] = useState(null);
  const { t } = useTranslation();

  const handleCloseModal = () => {
    setSelectedTask(null);
  };

  useEffect(() => {
    if (loading) {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    setLoading(!loading);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  return (
    <>
      <Timeline
        value={view}
        onViewModeChange={(viewMode) => {
          setView(viewMode);
          setLoading(true);
        }}
      />
      <Grid container spacing={0}>
        <Grid item md={4}>
          <PackageDetails tenders={tasks} service={service} size={size} />
        </Grid>
        <Grid item md={8}>
          {!loading && (
            <Box id="gantt-wrapper" sx={{ maxWidth: '70vw' }}>
              <Gantt
                tasks={tasks}
                view={view}
                onClick={(task) => {
                  setSelectedTask(task);
                }}
              />
            </Box>
          )}
        </Grid>
      </Grid>
      {alert && (
        <InfoModal
          theme="c-link"
          title={t('packages-missing')}
          message={t('incorrect-dates')}
          closeLabel={t('close')}
          disableEscapeKeyDown
        />
      )}
      <Modal
        open={Boolean(selectedTask)}
        onClose={handleCloseModal}
        aria-labelledby="task-modal-title"
        aria-describedby="task-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography sx={{ fontSize: '28px', textAlign: 'center', mb: 2 }}>
            {selectedTask?.label}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sx={{ textAlign: 'center' }}>
              <Button
                sx={{ '&:hover': { color: clinkRed } }}
                variant="outlined"
                color="secondary"
                LinkComponent={Link}
                to={`${BASE_URLS.CLINK}/project/${slug}/procurement_schedule#${selectedTask?.label.replace(/ /g, '%20')}`}
              >
                {i18next.t('procurement-schedule')}
              </Button>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'center' }}>
              <Button
                sx={{ '&:hover': { color: clinkGreen } }}
                variant="outlined"
                LinkComponent={Link}
                to={`${BASE_URLS.CLINK}/project/${slug}/quotes_tender#${selectedTask?.label.replace(/ /g, '%20')}`}
              >
                {i18next.t('quotes-tender')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
};

export default GanttTaskReact;
