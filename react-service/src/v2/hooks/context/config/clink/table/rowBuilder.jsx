import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Form, InputFormControlled, CONSTANTS } from 'clink-components';
import ConfirmModal, {
  Content as ContentModal,
} from 'v2/apps/shared/components/confirm-modal/v2';

const { white, japaneseIndigo } = CONSTANTS.colors.general;

const style = {
  color: japaneseIndigo,
  bgcolor: white,
};
const isInternalUseRoles = ['administrator', 'project_team_member'];

const rowBuilder = (
  member,
  roles,
  userRole,
  changeRoleAction,
  clinkAccount,
) => {
  const { email, user_id, role, roles: memberRole, firstname, lastname } = member;
  const id = user_id;
  const hasNewRoles = Array.isArray(memberRole) && memberRole.length > 0;
  const primaryRole = hasNewRoles ? memberRole[0] : role;
  const idRole = primaryRole?.id;
  const name = `${firstname} ${lastname}`.trim();
  const canBeRemoved = member.can_be_removed;
  const selectedRole = roles.find(
    (t) => {
      if (hasNewRoles) {
        return Number(t.id) === Number(idRole);
      }
      return Number(t.user_type_id) === Number(idRole);
    }
  );
  const currentUserRoleValue = clinkAccount?.type;
  const userRoleData = roles.find((t) => t.value === userRole);
  // We filter the options according to the logged in user
  let options;
  if (currentUserRoleValue === 'super_admin') {
    options = roles.filter(
      (t) =>
        Number(t.level) >= Number(userRoleData.level) &&
        !isInternalUseRoles.includes(t.value),
    );
  } else if (
    currentUserRoleValue === 'team_assistant' ||
    currentUserRoleValue === 'approver'
  ) {
    options = [];
  } else {
    options = roles.filter(
      (t) =>
        Number(t.level) > Number(userRoleData.level) &&
        !isInternalUseRoles.includes(t.value),
    );
  }
  // We filter the options according to the member role
  options =
    userRoleData &&
    selectedRole &&
    Number(userRoleData.level) <= Number(selectedRole.level)
      ? options
      : [];

  return {
    id,
    name,
    role: (
      <Form
        data-testid="form-content"
        disableUntilValid
        defaultValues={{
          'user-type': selectedRole?.label ?? null,
        }}
        render={(formHook) => {
          const [open, setOpen] = useState(false);
          const { formState, register, setValue, control } = formHook;
          const { errors } = formState;
          return (
            <Box
              id="mui-wrap-user-role"
              sx={{
                width: '100%',
                '& .MuiAutocomplete-clearIndicator': {
                  display: 'none',
                },
              }}
            >
              <ConfirmModal
                id="delete-team-member"
                openModal={Boolean(open)}
                handleClose={() => setOpen(false)}
              >
                <ContentModal
                  style={style}
                  title="confirm-deleting-team-member"
                  cancel="cancel"
                  confirm="confirm"
                  description=""
                  handleCancel={() => {
                    setValue('user-type', selectedRole);
                    setOpen(false);
                  }}
                  handleAccept={() => {
                    changeRoleAction(id, open);
                    setOpen(false);
                  }}
                />
              </ConfirmModal>
              <InputFormControlled
                className="option-test"
                autoComplete="user-type"
                errors={errors}
                placeholder="Select user type"
                register={register}
                setValue={setValue}
                control={control}
                name="user-type"
                type="select"
                rules={{}}
                theme="c-link"
                selectOption={(option) => {
                  const previousRole = selectedRole;
                  changeRoleAction(id, option, () => {
                    setValue('user-type', previousRole);
                  }).then((success) => {
                    if (success) {
                      setValue('user-type', option);
                    }
                  });
                }}
                options={options.map((type) => ({
                  id: type.id,
                  label: type.label,
                  value: type.id,
                }))}
              />
            </Box>
          );
        }}
      />
    ),
    email,
    canBeRemoved,
  };
};

export default rowBuilder;
