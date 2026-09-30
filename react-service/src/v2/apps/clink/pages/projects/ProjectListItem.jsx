import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Grid2 from '@mui/material/Grid2';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import CardActionArea from '@mui/material/CardActionArea';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import { modalAsyncAction } from 'v2/apps/clink/pages/orders/subcontractors/useActions/common';
import { CONSTANTS } from 'clink-components';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const {
  charcoalGray,
  mediumGray,
  grayDark,
  teal2,
  lightCyan,
  white,
  clinkPurple,
  lightPeriwinkle,
} = CONSTANTS.colors.general;

const ProjectListItem = ({
  projectType,
  projectName,
  imgSrc,
  archived = true,
  project = {},
  handleArchive = () => null,
  handleRestore = () => null,
  setOpen,
  isVisible,
}) => {
  const navigate = useNavigate();
  const clinkAccount = useSelector((state) => state.clinkAccount);
  const [anchorEl, setAnchorEl] = useState(null);
  const [hasError, setHasError] = useState(false);
  const errorImgSrc =
    'https://clink-assets.s3.eu-west-2.amazonaws.com/production/static/images/project/project-building.svg';

  const handleDropdownClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const canArchiveProject =
    clinkAccount?.acl?.archiveProject?.canArchive || false;

  const handleCloseDropdown = () => {
    setAnchorEl(null);
  };

  const actions = !archived
    ? [
        modalAsyncAction(
          setOpen,
          () =>
            handleArchive(project).then(() => {
              setOpen(false);
            }),
          `Are you sure you want to archive ${projectName}?`,
          'Archive',
        ),
      ].map((action, i) => ({ ...action, id: `archive-${i}` }))
    : [
        modalAsyncAction(
          setOpen,
          () =>
            handleRestore(project).then(() => {
              setOpen(false);
            }),
          `Are you sure you wish to Restore this project? `,
          'Restore',
        ),
      ].map((action, i) => ({ ...action, id: `restore-${i}` }));

  return (
    <Grid2 sx={{ position: 'relative' }} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Card
        sx={{
          height: 210,
          position: 'relative',
          cursor: archived ? 'default' : 'pointer',
        }}
      >
        {isVisible && canArchiveProject && (
          <CardHeader
            action={
              <CardActions
                sx={{
                  borderRadius: '50%',
                  position: 'absolute',
                  padding: 0,
                  backgroundColor: white,
                  color: clinkPurple,
                  '& .MuiButtonBase-root': {
                    padding: 0,
                    border: `1px solid ${clinkPurple}`,
                  },
                }}
              >
                <IconButton onClick={handleDropdownClick}>
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleCloseDropdown}
                  slotProps={{
                    paper: {
                      sx: {
                        '& .MuiList-root': {
                          padding: 0,
                        },
                      },
                    },
                  }}
                >
                  {actions.map((actionItem) => (
                    <MenuItem
                      key={actionItem.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseDropdown();
                        actionItem.action();
                      }}
                      disabled={actionItem.disabled}
                      sx={{
                        fontSize: '16px',
                        color: charcoalGray,
                        backgroundColor: 'transparent',
                        '&:hover': {
                          backgroundColor: grayDark,
                          color: charcoalGray,
                        },
                        '&.Mui-selected': {
                          backgroundColor: teal2,
                          color: white,
                          '&:hover': {
                            backgroundColor: teal2,
                          },
                        },
                        '&.Mui-focusVisible': {
                          backgroundColor: lightCyan,
                          color: charcoalGray,
                        },
                      }}
                    >
                      {actionItem.name}
                    </MenuItem>
                  ))}
                </Menu>
              </CardActions>
            }
          />
        )}

        <CardActionArea>
          <CardMedia
            height={120}
            component="img"
            image={hasError ? errorImgSrc : imgSrc}
            alt={projectName || 'Project Image'}
            onClick={() => {
              if (!archived) {
                navigate(
                  `${BASE_URLS.CLINK_APP_HOST}/main-contractor/project_dashboard/${project.slug}`,
                );
              }
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = errorImgSrc;
              setHasError(true);
            }}
            sx={{
              ...(hasError && {
                width: '120px',
                margin: 'auto',
                padding: '18px',
                objectFit: 'contain',
              }),
            }}
          />
          <CardContent
            sx={{ height: 106, borderTop: `1px solid ${lightPeriwinkle}` }}
            onClick={() => {
              if (!archived) {
                navigate(
                  `${BASE_URLS.CLINK_APP_HOST}/main-contractor/project_dashboard/${project.slug}`,
                );
              }
            }}
          >
            <Tooltip title={projectName || 'Untitled Project'}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 500,
                  fontSize: 20,
                  color: charcoalGray,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                }}
              >
                {projectName || 'Untitled Project'}
              </Typography>
            </Tooltip>

            <Typography
              variant="body2"
              sx={{ fontSize: 16, color: mediumGray }}
            >
              {projectType || 'Unknown Category'}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid2>
  );
};

export default ProjectListItem;
