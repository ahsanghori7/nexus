import React from 'react';
import Box from '@mui/material/Box';
import { Table } from 'clink-components';

const ProjectManagementTable = ({
  columns = [],
  rows = [],
  theme = 'project-management',
}) => (
  <Box
    sx={{
      '& table': {
        tr: {
          td: {
            '.instruction-nr': {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              '.badge-wrapper': {
                width: '50px',
                height: '24px',
              },
            },
            height: '78px',
            padding: '0px 15px',
            '.clink-form': {
              minHeight: '78px',
              '.clink-form__input': {
                width: '100%',
                flex: '1',
                justifyContent: 'center',
                '&::after': {
                  top: '27px',
                },
                input: {
                  maxWidth: 'initial',
                  width: '100%',
                  textIndent: '2rem',
                },
              },
            },
            '.instruction-sub__name, .instruction-sub__label': {
              marginBottom: '0px',
            },
          },
          '&:last-of-type': {
            td: {
              padding: '0px 15px',
            },
          },
        },
      },
    }}
  >
    <Table theme={theme} columns={columns} rows={rows} />
  </Box>
);

export default ProjectManagementTable;
