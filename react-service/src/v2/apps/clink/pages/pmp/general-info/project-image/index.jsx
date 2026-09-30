import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import i18next from 'v2/helpers/i18n';
import { connect } from 'react-redux';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Grid2 from '@mui/material/Grid2';
import { getProjectLogo } from 'v2/helpers/url';
import { postFormData } from 'services/clinkHelpers';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import { CONSTANTS } from 'clink-components';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import UploadBox, { VisuallyHiddenInput } from './UploadBox';
import { allowedTypes } from './validateImageDimensions';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const ProjectImage = ({ project }) => {
  const [src, setSrc] = useState(getProjectLogo(project.data.id) || '');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (project?.data?.id) {
      setSrc(getProjectLogo(project.data.id));
    } else {
      setSrc('');
    }
  }, [project?.data?.id]);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    // Check if file type is allowed
    if (!allowedTypes.includes(file.type)) {
      setError(i18next.t('unsupported-format'));
      return;
    }
    setError(false);
    setSrc('');
    const result = await postFormData(
      'project',
      'addLogo',
      { file },
      {
        pid: project?.data?.id,
      },
    ).then((res) => res.json());
    if (!result?.success) {
      setError('Upload failed. Please try again or another image.');
    }
    setSrc(getProjectLogo(project?.data?.id));
  };
  return (
    <Grid2
      size={{ xs: 12, md: 4 }}
      sx={{ width: '100% !important' }}
      container
      flexDirection="column"
    >
      <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.75}>
        <Typography sx={{ fontWeight: 600 }}>
          {i18next.t('project-image')}
        </Typography>
      </Grid2>
      <Grid2 p={1.75} container flexDirection="column" alignItems="center">
        {error && (
          <Grid2 p={1.75}>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography key={error} variant="body2">
                {error}
              </Typography>
            </Alert>
          </Grid2>
        )}
        <Grid2>
          <Card sx={{ maxWidth: 345 }}>
            {project?.data?.id && src && (
              <CardMedia
                sx={{
                  height: 150,
                  maxWidth: 345,
                  position: 'relative',
                  overflow: 'hidden',
                  textAlign: 'center',
                }}
                title="Project Logo"
              >
                <LazyLoadImage
                  style={{ maxWidth: 345, width: '100%' }}
                  alt="Project Logo"
                  effect="blur"
                  src={src}
                  onError={() => setSrc('')}
                />
              </CardMedia>
            )}
            {!src && (
              <CardContent>
                <UploadBox handleUpload={handleUpload} />
              </CardContent>
            )}
            <CardActions>
              <Button
                size="small"
                component="label"
                fullWidth
                role={undefined}
                variant="contained"
                tabIndex={-1}
                data-testid="upload-project-image-button"
                startIcon={<CloudUploadIcon />}
              >
                {src ? i18next.t('replace-image') : i18next.t('upload-image')}
                <VisuallyHiddenInput type="file" onChange={handleUpload} />
              </Button>
            </CardActions>
          </Card>
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

ProjectImage.propTypes = {
  project: PropTypes.shape({
    data: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }),
};

ProjectImage.defaultProps = {
  project: {
    data: {
      id: null,
    },
  },
};

const mapStateToProps = (state) => {
  return {
    project: state.project,
  };
};

export default connect(mapStateToProps)(ProjectImage);
