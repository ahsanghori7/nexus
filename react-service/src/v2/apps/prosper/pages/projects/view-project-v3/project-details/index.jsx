import React, { useState, useEffect, useRef } from 'react';
import { CONSTANTS, Image } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { Link as ReactLink } from 'react-router-dom';
import { renderHtmlInText } from 'v2/helpers/data';
import { checkIfImageExists } from 'v2/helpers/url';
import { getAccountLogo } from 'v2/helpers/user';
import Subscription from 'v2/helpers/user/subscription';
import MuiButton from '@mui/material/Button';
import Fab from '@mui/material/Fab';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Container from 'v2/apps/prosper/pages/projects/Container.styled';
import About from 'v2/apps/prosper/shared/crm-components/About';
import Description from 'v2/apps/prosper/shared/crm-components/Description';
import Cover from './Cover';
import Characteristics from './Characteristics';

const { japaneseIndigo, white, black } = CONSTANTS.colors.general;
const { prosperRedBorder, prosperBoxRed } = CONSTANTS.colors.prosper;
const { iconWhiteLock, iconContractor } = CONSTANTS.s3;

const subscriptionHelper = new Subscription();

const ProjectDetails = ({
  src,
  project,
  open,
  hasRegistered,
  clientData,
  subcontractor = {},
  distance = [],
}) => {
  const refPackages = useRef(null);
  const { t } = useTranslation();
  const [imageExists, setImageExists] = useState(false);

  useEffect(() => {
    if (clientData && clientData.id) {
      checkIfImageExists(getAccountLogo(clientData.id), (exists) => {
        setImageExists(exists);
      });
    }
  }, [clientData]);

  const pid = project ? project.id : 0;
  const idClient = project ? project.group_id : 0;
  const idContact = project ? project.author_id : 0;
  const projectName = project ? project.project : 0;
  const handleScrollDown = () => {
    if (refPackages) {
      const yOffset = -190;
      const y =
        refPackages.current.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };
  const hideAbout =
    subcontractor &&
    !subscriptionHelper.isExternal(subcontractor.subscription_id);

  const companyName = (clientData && clientData.name) || null;
  const clientDescription = (clientData && clientData.description) || '';
  const loading = !clientData || (clientData && !clientData.id);

  const locked = open || !hasRegistered;
  const linkPathname = `/company_profile/${idClient}${idContact ? `/${idContact}` : ''}`;
  const linkSearch = `?pid=${pid}`;
  const link = `${linkPathname}${linkSearch}`;
  const checkLink = (!locked && link) || '';

  const linkState = {
    fromUrl: window.location.pathname,
    fromName: projectName,
  };
  const to = checkLink;

  let unlockMessage = 'view-full-profile';
  let unlockDesc = renderHtmlInText(clientDescription);
  if (locked) {
    const commission = [8, 12, 13];
    const showMessage = commission.includes(
      Number(subcontractor.subscription_id),
    );
    unlockMessage = showMessage
      ? 'unlock-project-commission'
      : 'unlock-project';
    unlockDesc = showMessage
      ? t('unlock-project-desc-commission')
      : t('unlock-project-desc');
  }
  return (
    <Paper
      sx={{
        marginTop: { lg: '-32px', md: '-32px', sm: 0, xs: 0 },
        paddingLeft: { md: 3, sm: 3, xs: 3 },
        paddingRight: { md: 3, sm: 3, xs: 3 },
        paddingBottom: { xs: 3 },
        boxShadow: 'none',
        '& .MuiFab-root': {
          zIndex: 1,
          position: 'absolute',
          right: 20,
          display: { xs: 'inline-flex', sm: 'none' },
        },
      }}
    >
      {!open && (
        <>
          <Fab
            sx={{
              backgroundColor: black,
              top: 150,
            }}
            size="medium"
            color="secondary"
            aria-label="add"
            onClick={handleScrollDown}
          >
            <ArrowDownward sx={{ color: white }} />
          </Fab>
          <Fab
            sx={{
              background: 'transparent',
              backgroundColor: 'transparent',
              boxShadow: 'none',
              top: 210,
            }}
            aria-label="add"
            onClick={handleScrollDown}
          >
            <Typography
              variant="secondary"
              mb={4}
              sx={{
                fontSize: '10px',
                color: japaneseIndigo,
              }}
            >
              {t('view-packages')}
            </Typography>
          </Fab>
        </>
      )}
      <Container>
        <Grid container>
          <Grid item xs={12} mt={3}>
            <Typography
              variant="secondary"
              mb={4}
              sx={{
                fontWeight: 'bold',
                fontSize: {
                  xs: '16px',
                  sm: '27px',
                },
                color: japaneseIndigo,
              }}
            >
              {t('scope-and-details')}
            </Typography>
          </Grid>
          <Grid
            container
            item
            mt={{ xs: 0, sm: 2 }}
            spacing={3}
            justifyContent="space-between"
          >
            <Grid item xs={12} md={8}>
              <Cover src={src} />
              <Description
                gridSx={{ display: { xs: 'none', md: 'initial' } }}
                text={renderHtmlInText(project.description)}
              />
            </Grid>
            <Grid
              item
              pt={{ xs: '0 !important', sm: '24px !important' }}
              xs={12}
              sm={6}
              sx={{ display: { xs: 'initial', md: 'none' } }}
            >
              <Description text={renderHtmlInText(project.description)} />
              <Characteristics
                project={project}
                distance={distance}
                gridSx={{
                  marginTop: { xs: 3 },
                  paddingTop: { xs: 3, sm: 0 },
                  borderTop: { xs: `1px solid ${japaneseIndigo}`, sm: 'none' },
                }}
              />
            </Grid>
            <Grid
              ref={refPackages}
              container
              item
              xs={12}
              sm={6}
              md={4}
              alignContent="flex-start"
              pt={{ xs: '0 !important', sm: '24px !important' }}
            >
              <Characteristics
                project={project}
                distance={distance}
                gridSx={{
                  display: { xs: 'none', md: 'initial' },
                  marginBottom: { md: 2 },
                }}
              />
              {hideAbout && (
                <>
                  <About
                    title="about-client"
                    descriptionSX={{
                      fontSize: { xs: '14px', md: '16px' },
                      fontWeight: 200,
                      width: '100%',
                      marginTop: 1,
                      maxHeight: '250px',
                      overflowY: 'scroll',
                      overflowX: 'hidden',
                      paddingRight: '10px',
                      boxSizing: 'border-box',
                      textAlign: 'justify',

                      '&::-webkit-scrollbar': {
                        width: '10px',
                      },

                      '&::-webkit-scrollbar-track': {
                        boxShadow: `inset 0 0 5px ${white}`,
                        borderRadius: '10px',
                      },

                      '&::-webkit-scrollbar-track:hover': {
                        boxShadow: 'inset 0 0 5px gray',
                      },

                      '&::-webkit-scrollbar-thumb': {
                        background: prosperBoxRed,
                        borderRadius: '10px',
                      },

                      '&::-webkit-scrollbar-thumb:hover': {
                        background: prosperRedBorder,
                      },
                    }}
                    description={unlockDesc}
                    loading={loading}
                    src={
                      imageExists && !locked
                        ? getAccountLogo(clientData.id)
                        : iconContractor
                    }
                    displayName={locked ? null : companyName}
                    jobTitle={locked ? null : ''}
                    gridSx={{
                      marginTop: { xs: 3, sm: 0 },
                      paddingTop: { xs: 3, sm: 0 },
                      borderTop: {
                        xs: `1px solid ${japaneseIndigo}`,
                        sm: 'none',
                      },
                    }}
                  />

                  <Grid
                    item
                    width="100%"
                    sx={{
                      marginTop: { md: 2, xs: 3 },
                      paddingTop: { xs: 3 },
                      borderTop: {
                        xs: `1px solid ${japaneseIndigo}`,
                        md: 'none',
                      },
                    }}
                  >
                    <ReactLink
                      to={to}
                      state={linkState}
                      style={{
                        textDecoration: 'none',
                        pointerEvents: locked ? 'none' : 'inherit',
                      }}
                    >
                      <MuiButton
                        color="primary"
                        variant="contained"
                        sx={{
                          width: '100%',
                          maxHeight: 42,
                          maxWidth: {
                            lg: '300px',
                            xs: 'inherit',
                          },
                          '& > span': {
                            display: 'flex !important',
                          },
                        }}
                      >
                        {t(unlockMessage)}
                        {locked && (
                          <Image
                            src={iconWhiteLock}
                            style={{ marginLeft: '10px' }}
                          />
                        )}
                      </MuiButton>
                    </ReactLink>
                  </Grid>
                </>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Paper>
  );
};

export default ProjectDetails;
