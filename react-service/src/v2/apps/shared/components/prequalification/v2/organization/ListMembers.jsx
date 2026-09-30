import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
// TODO: Add from backend?
import { DIRECTOR } from 'v2/helpers/prequal/organization';
import Member from './Member';
import Confirm from './Confirm';

const { prosperBoxRed } = CONSTANTS.colors.prosper;

const ListMembers = ({
  group = {},
  accountOwner,
  handleDelete,
  logoOwner,
  setSelected,
  handleOnShow,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [deleteMemberId, setDeleteMemberId] = useState(null);

  return Object.keys(group).map((title) => (
    <div key={title}>
      <Typography
        sx={{
          fontSize: '14px',
          color: prosperBoxRed,
          fontWeight: 'bold',
          mb: 1,
        }}
      >
        {title || DIRECTOR.value}
      </Typography>
      {group[title].map((m) => {
        // Skip null or undefined members
        if (!m) return null;

        let memberActions = [
          {
            id: 1,
            label: t('edit'),
            action: () => {
              setSelected && setSelected(m);
              handleOnShow && handleOnShow();
            },
          },
          accountOwner
            ? {
              id: 2,
              label: t('delete'),
              action: () => setDeleteMemberId(m.id),
            }
            : null,
        ].filter(Boolean);

        if (m.account_owner) {
          memberActions = [];
          if (accountOwner) {
            memberActions = [
              {
                id: 1,
                label: t('edit'),
                action: () => navigate('/my-company/profile'),
              },
            ];
          }
        }

        let data = m;
        if (m.account_owner) {
          data = {
            ...m,
            logo: logoOwner,
          };
        }

        return (
          <div key={m.id}>
            <Member data={data} actions={memberActions} />
          </div>
        );
      })}
    </div>
  )).concat(
    deleteMemberId !== null && (
      <Confirm
        key="confirm-modal"
        setOpen={() => setDeleteMemberId(null)}
        open={Boolean(deleteMemberId)}
        handleConfirm={() => {
          handleDelete && handleDelete(deleteMemberId);
          setDeleteMemberId(null);
        }}
      />
    )
  );
};

export default ListMembers;
