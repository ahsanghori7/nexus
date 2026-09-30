import React, { useState, useEffect } from 'react';
import { SECTIONS } from 'v2/helpers/prequal/documents';
import { useContext } from 'hooks/context';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getAccountLogo } from 'v2/helpers/user';
import { checkIfImageExists } from 'v2/helpers/url';
import Box from '@mui/material/Box';
import Loading from 'v2/apps/shared/components/Loading';
import { deleteData } from 'v2/services/helpers';
import {
  sizeFileIsCorrect,
  typeFileIsAccepted,
  DEFAULT_ACCEPTED_IMG,
} from 'v2/helpers/files';
import DocContainer from 'v2/apps/shared/components/prequalification/v2/DocContainer';
import Form from './Form';
import ListMembers from './ListMembers';

const MAX_FILE_SIZE = 1;
const Organization = ({
  aid,
  prequalificationV2,
  subcontractor,
  dispatch,
  contextType = 'prosper',
}) => {
  const isProsper = contextType === 'prosper';
  const { t } = useTranslation();
  const context = useContext(contextType);
  const { actions } = context;

  const [profileLogoExists, setProfileLogoExists] = useState(false);

  const { [SECTIONS.ORG]: organisation, statusPreq } = prequalificationV2;
  const [selected, setSelected] = useState(null);
  const [logoValidation, setLogoValidation] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (subcontractor && subcontractor.accountId) {
      checkIfImageExists(getAccountLogo(subcontractor.accountId), (exists) => {
        setProfileLogoExists(exists);
      });
    }
  }, [subcontractor]);

  const logoOwner =
    profileLogoExists && getAccountLogo(subcontractor.accountId);

  const handleOnClose = () => {
    setOpen(false);
  };

  const handleOnShow = () => {
    setOpen(true);
  };

  const handleSubmit = (submitData, localLogo = false, s3 = false) => {
    if (!isProsper) return Promise.resolve();
    const { picture, ...rest } = submitData;

    const body = {
      aid,
      ...rest,
      role: rest.role === 'Other' ? rest.role_input : rest.role,
    };

    const logo = picture && picture[0];
    let validationFile = false;
    if (logo) {
      body.logo = logo;
      if (!sizeFileIsCorrect(logo, MAX_FILE_SIZE)) {
        validationFile = t('file-too-large_one');
      }
      if (!typeFileIsAccepted(logo, DEFAULT_ACCEPTED_IMG)) {
        validationFile = t('invalid-type-file_one');
      }
      setLogoValidation(validationFile);
    }
    if (validationFile) {
      return null;
    }
    const submitAction = submitData.id
      ? actions.patchOrganizationV2_V2
      : actions.postOrganization_V2;

    if (!logo && s3 && !localLogo) {
      deleteData('team_manager', null, `${aid}/member/${rest.id}/remove_logo`);
    }
    return dispatch(submitAction(body)).then(() =>
      dispatch(actions.fetchPrequalification_V2(aid)),
    );
  };

  const groupedOrganisation = {};
  const main = {};
  organisation.forEach((o) => {
    if (o.account_owner) {
      main[o.title] = [o];
      return;
    }
    if (o.title in groupedOrganisation) {
      groupedOrganisation[o.title].push(o);
    } else {
      groupedOrganisation[o.title] = [o];
    }
  });

  const handleDelete = (id) => {
    if (!isProsper) return Promise.resolve();
    return dispatch(actions.deleteTeamMember_V2({ id, aid })).then(() =>
      dispatch(actions.fetchPrequalification_V2(aid)),
    );
  };

  const accountOwner = subcontractor?.account_owner || false;
  return (
    <Box sx={{ minHeight: '450px' }}>
      <Loading status={statusPreq.message} />
      {!statusPreq.message && (
        <DocContainer
          actionLabel={t('add-team-member')}
          titleDialog={selected ? t('edit-team-member') : t('new-team-member')}
          action={
            isProsper
              ? () => {
                  setSelected(null);
                  handleOnShow();
                }
              : null
          }
          selected={selected}
          fileError={logoValidation}
          open={open}
          Form={Form}
          handleOnClose={handleOnClose}
          handleSubmit={handleSubmit}
        >
          <ListMembers
            group={main}
            accountOwner={accountOwner}
            handleDelete={handleDelete}
            logoOwner={logoOwner}
            setSelected={setSelected}
            handleOnShow={handleOnShow}
          />
          <ListMembers
            group={groupedOrganisation}
            accountOwner={accountOwner}
            handleDelete={handleDelete}
            logoOwner={logoOwner}
            setSelected={setSelected}
            handleOnShow={handleOnShow}
          />
        </DocContainer>
      )}
    </Box>
  );
};

const mapStateToProps = (state) => ({
  prequalificationV2: state.prequalificationV2,
  subcontractor: state.subcontractor,
});

export default connect(mapStateToProps)(Organization);
