const superAdmin = {
  id: 8,
  value: 'super_admin',
  label: 'Super Admin',
  level: 1,
};

const admin = {
  id: 2,
  value: 'team_admin',
  label: 'Admin',
  level: 3,
};

const manager = {
  id: 3,
  value: 'team_manager',
  label: 'Manager',
  level: 4,
};

const assistant = {
  id: 4,
  value: 'team_assistant',
  label: 'Team Member',
  level: 5,
};
const approver = {
  id: 9,
  value: 'approver',
  label: 'Approver',
  level: 6,
};

const witness = {
  id: 6,
  value: 'witness',
  label: 'Witness',
  level: 7,
};

const administrator = {
  value: 'administrator',
  label: 'Administrator',
};

const userTypes = [superAdmin, admin, manager, assistant, approver, witness, administrator];

export default userTypes;
export { superAdmin, admin, manager, assistant, witness, approver, administrator };
