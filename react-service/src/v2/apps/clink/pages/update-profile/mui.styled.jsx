import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Modal from '@mui/material/Modal';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ImageIcon from '@mui/icons-material/Image';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';

const { clinkGreen, clinkPurple, clinkRed, white } = CONSTANTS.colors.general;

const passwordValidationStyles = {
  box: {
    border: `1px solid ${clinkPurple}`,
    padding: '10px',
    backgroundColor: white,
    borderRadius: '4px',
    position: 'absolute',
    zIndex: 10,
    marginTop: '5px',
    top: '76px',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '-20px',
      left: '19px',
      borderWidth: '10px',
      borderStyle: 'solid',
      borderColor: `transparent transparent ${clinkPurple} transparent`,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '-17px',
      left: '20px',
      borderWidth: '9px',
      borderStyle: 'solid',
      borderColor: `transparent transparent ${white} transparent`,
    },
  },
  p: {
    margin: 0,
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    marginRight: '8px',
  },
};

const PasswordValidationEntry = ({ rule }) => {
  return (
    <Typography sx={passwordValidationStyles.p}>
      {rule.valid ? (
        <Typography
          component="span"
          sx={{ ...passwordValidationStyles.icon, color: clinkGreen }}
        >
          ✔
        </Typography>
      ) : (
        <Typography
          component="span"
          sx={{ ...passwordValidationStyles.icon, color: clinkRed }}
        >
          ✘
        </Typography>
      )}
      <Typography
        component="span"
        sx={rule.valid ? { color: clinkGreen } : { color: clinkRed }}
      >
        {rule.message}
      </Typography>
    </Typography>
  );
};

const PasswordValidationBox = ({ rules }) => {
  return (
    <Box sx={passwordValidationStyles.box}>
      {rules.map((rule) => (
        <PasswordValidationEntry key={rule.message} rule={rule} />
      ))}
    </Box>
  );
};

const RepeatPasswordValidationBox = ({ match }) => {
  return (
    <Box sx={passwordValidationStyles.box}>
      <Typography
        sx={
          match
            ? { ...passwordValidationStyles.p, color: clinkGreen }
            : { ...passwordValidationStyles.p, color: clinkRed }
        }
      >
        {match
          ? `✔ ${i18next.t('update-profile-pass-match')}`
          : `✘ ${i18next.t('update-profile-pass-match-not')}`}
      </Typography>
    </Box>
  );
};

const ModalBox = ({ open, onClose, title, description }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="reusable-modal-title"
      aria-describedby="reusable-modal-description"
    >
      <Card
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          minWidth: 300,
          cursor: 'pointer',
          borderRadius: 3,
          boxShadow: 6,
        }}
      >
        <CardContent>
          <Typography id="reusable-modal-title" variant="h6" component="h2">
            {title}
          </Typography>
          <Typography id="reusable-modal-description" sx={{ mt: 1.5 }}>
            {description}
          </Typography>
        </CardContent>
      </Card>
    </Modal>
  );
};

const AvatarUpload = ({ avatar, handleLogoUpload }) => {
  const [showImageSizeModal, setShowImageSizeModal] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const img = new Image();

    reader.onload = (event) => {
      img.onload = () => {
        if (img.width > 150 || img.height > 150) {
          setShowImageSizeModal(true);
          return;
        }

        handleLogoUpload(e);
      };
      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          position: 'relative',
        }}
      >
        <Typography
          sx={{
            position: 'absolute',
            top: '6px',
            left: 0,
            fontSize: '12px',
            fontWeight: '600',
            color: clinkPurple,
            mb: '4px',
          }}
          component="label"
          variant="body1"
        >
          <ImageIcon sx={{ marginRight: '4px', height: '18px' }} />{' '}
          {i18next.t('update-profile-logo')}
        </Typography>
        <Box
          sx={{ position: 'relative', marginTop: '50px', marginBottom: '39px' }}
        >
          <Avatar
            alt="Company Logo"
            src={avatar || ''}
            sx={{ width: 150, height: 150, bgcolor: 'gray' }}
          />
          <input
            className="upload"
            accept=".png, .jpg, .jpeg"
            id="account_image"
            name="account[logo]"
            type="file"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <Box
            component="label"
            htmlFor="account_image"
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              left: 0,
              top: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <IconButton
              component="span"
              color="primary"
              sx={{
                borderRadius: '4px',
                padding: '4px',
                zIndex: 2,
                width: '100%',
                height: '100%',
                '& .MuiSvgIcon-root': {
                  opacity: avatar ? '0' : '0.5',
                },
                '&:hover': {
                  '& .MuiSvgIcon-root': {
                    opacity: '1',
                  },
                },
              }}
            >
              <PhotoCamera sx={{ width: '32px', height: '32px' }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <ModalBox
        open={showImageSizeModal}
        onClose={() => setShowImageSizeModal(false)}
        title={i18next.t('update-profile-logo-too-large')}
        description={i18next.t('update-profile-logo-max-size')}
      />
    </>
  );
};

const SaveWrapper = ({ children }) => {
  return (
    <Grid
      item
      xs={12}
      sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}
    >
      {children}
    </Grid>
  );
};

const MuiTitle = ({ children }) => (
  <Typography sx={{ fontWeight: 600, fontSize: '32px', mb: 2 }}>
    {children}
  </Typography>
);


export {
  PasswordValidationBox,
  RepeatPasswordValidationBox,
  AvatarUpload,
  SaveWrapper,
  MuiTitle,
  ModalBox
};
