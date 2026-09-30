import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { CONSTANTS } from 'clink-components';
import PackageItem from './PackageItem';
import SelectAllItem from './SelectAllItem';
import SelectAllItemMobileOptions from './SelectAllItemMobileOptions';
import ViewAll from './ViewAll';
import {
  DEFAULT_SHOWN_DOCUMENTS,
  MIN_SELECTED_TO_SHOW,
  createShownProjects,
  updateAllPackages,
  makeRequestToUpdate,
  filterPackages,
} from './helpers';

const { platinum, clinkRed, clinkGreen, black } = CONSTANTS.colors.general;
const { SilverSand } = CONSTANTS.colors.prosper;
const { proxima } = CONSTANTS.fonts;

const ProjectsList = ({ projects = [], handleClose = () => null }) => {
  const theme = useTheme();
  const classes = {
    root: {
      padding: '0 30px',
      height: '100%',
      overflowX: 'hidden',
      overflowY: 'auto',
      margin: 0,
      listStyle: 'none',
      [theme.breakpoints.down('sm')]: {
        padding: '0 20px 0 8px',
      },
      '&::-webkit-scrollbar': {
        width: '8px',
        [theme.breakpoints.down('sm')]: {
          width: '6px',
        },
      },
      '&::-webkit-scrollbar-track': {
        boxShadow: `inset 0 0 2px ${black}`,
        webkitBoxShadow: `inset 0 0 2px ${black}`,
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: clinkRed,
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: clinkGreen,
      },
    },
    '*': { boxSizing: 'border-box' },
    listTitle: {
      backgroundColor: platinum,
      border: `2px solid ${SilverSand}`,
      height: '50px',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '30px',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      [theme.breakpoints.down('sm')]: {
        height: '35px',
        paddingLeft: '8px',
      },
    },
    listContainer: {
      listStyleType: 'none',
      paddingLeft: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      fontFamily: proxima,
      position: 'relative',
      marginBottom: '50px',
      [theme.breakpoints.down('sm')]: {
        marginBottom: '20px',
      },
    },
    textFragmentSize: {
      fontSize: '22px',
      [theme.breakpoints.down('sm')]: {
        fontSize: '16px',
      },
    },
  };
  const smallResolution = useMediaQuery(theme.breakpoints.down('sm'));
  const [showProjects, setShowProjects] = useState([]);

  useEffect(() => {
    setShowProjects(createShownProjects(projects));
  }, [projects]);

  const handleShowAll = (pid, showAll) => {
    const [selectedProject] = showProjects.filter(
      (project) => Number(pid) === Number(project.id)
    );
    setShowProjects(
      createShownProjects(showProjects, pid, {
        showAll,
        ...(!showAll && {
          allSelected: false,
          tender: selectedProject
            ? selectedProject.tender.map((tender) => ({
                ...tender,
                selected: false,
              }))
            : [],
        }),
      })
    );
  };

  const handleAllSelected = (pid, allSelected) => {
    const [selectedProject] = showProjects.filter(
      (project) => Number(pid) === Number(project.id)
    );
    setShowProjects(
      createShownProjects(showProjects, pid, {
        allSelected,
        showAll: allSelected,
        tender: selectedProject
          ? selectedProject.tender.map((tender) => ({
              ...tender,
              selected: allSelected,
            }))
          : [],
      })
    );
  };

  const handleUpdateTenders = (tenders = [], newData = {}) => {
    const tendersToUpdateIds = tenders.map((t) => Number(t.id));
    const tendersToUpdateProjects = tenders.map((t) => Number(t.project_id));
    const newShowProjects = showProjects.map((p) => {
      const newTenders = p.tender.map((t) =>
        tendersToUpdateIds.includes(Number(t.id)) ? { ...t, ...newData } : t
      );
      const filteredNewTenders = filterPackages(newTenders);
      return tendersToUpdateProjects.includes(Number(p.id))
        ? {
            ...p,
            tender: newTenders,
            allSelected:
              filteredNewTenders.filter((t) => t.selected).length ===
              filteredNewTenders.length,
          }
        : p;
    });
    setShowProjects(newShowProjects);

    const checkEmpty = newShowProjects
      .map((project) => {
        const packages = filterPackages(project.tender || []);
        if (!packages.length) {
          return null;
        }
        return project;
      })
      .filter((p) => p);
    if (!checkEmpty.length) {
      handleClose();
    }
  };

  return (
    <Box sx={classes.root}>
      {showProjects.map((project) => {
        const packages = filterPackages(project.tender || []);
        if (!packages.length) {
          return null;
        }
        const selectedPackages = packages.filter((pack) => pack.selected);
        const tenders = packages.map((pack) => (
          <PackageItem
            key={pack.id}
            tender={pack}
            showActions={
              !project.allSelected &&
              selectedPackages.length < MIN_SELECTED_TO_SHOW
            }
            handleUpdateTenders={handleUpdateTenders}
          />
        ));

        return (
          <Box key={project.id}>
            <Box sx={classes.listTitle}>
              <Typography sx={classes.textFragmentSize}>
                {project.name}
              </Typography>
            </Box>
            <Box sx={classes.listContainer} component="ul">
              {(project.allSelected ||
                selectedPackages.length >= MIN_SELECTED_TO_SHOW) &&
                smallResolution && (
                  <SelectAllItemMobileOptions
                    packages={packages}
                    makeRequestToUpdate={makeRequestToUpdate}
                    updateAllPackages={updateAllPackages}
                    handleUpdateTenders={handleUpdateTenders}
                    handleAllSelected={handleAllSelected}
                  />
                )}
              <SelectAllItem
                project={project}
                packages={packages}
                min={MIN_SELECTED_TO_SHOW}
                makeRequestToUpdate={makeRequestToUpdate}
                updateAllPackages={updateAllPackages}
                handleUpdateTenders={handleUpdateTenders}
                handleAllSelected={handleAllSelected}
              />
              {project.showAll
                ? tenders
                : tenders.slice(0, DEFAULT_SHOWN_DOCUMENTS)}
              {tenders.length > DEFAULT_SHOWN_DOCUMENTS && (
                <ViewAll
                  pid={project.id}
                  show={project.showAll}
                  packNumber={tenders.length}
                  handleShowAll={handleShowAll}
                />
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default ProjectsList;
