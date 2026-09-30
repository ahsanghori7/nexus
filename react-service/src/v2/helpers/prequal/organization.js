const DIRECTOR = {
  id: 1,
  value: 'CEO/Managing Director',
  label: 'CEO/Managing Director',
};
const TENDERING = {
  id: 2,
  value: 'Responsible for Tendering',
  label: 'Responsible for Tendering',
};
const CONSTRUCTION = {
  id: 3,
  value: 'Responsible for Construction',
  label: 'Responsible for Construction',
};
const COMMERCIAL = {
  id: 4,
  value: 'Responsible for Commercial',
  label: 'Responsible for Commercial',
};
const ENVIRONMENT = {
  id: 5,
  value: 'Responsible for H & S, Environment',
  label: 'Responsible for H & S, Environment',
};
const WITNESS = {
  id: 6,
  value: 'Witness',
  label: 'Witness',
};
const ROLE_CHECKER = {
  [DIRECTOR.value]: DIRECTOR.value,
  [TENDERING.value]: TENDERING.value,
  [CONSTRUCTION.value]: CONSTRUCTION.value,
  [COMMERCIAL.value]: COMMERCIAL.value,
  [ENVIRONMENT.value]: ENVIRONMENT.value,
  [WITNESS.value]: WITNESS.value,
};
const OTHER = { id: 7, value: 'Other', label: 'Other' };

export {
  DIRECTOR,
  TENDERING,
  CONSTRUCTION,
  COMMERCIAL,
  ENVIRONMENT,
  WITNESS,
  OTHER,
  ROLE_CHECKER,
};
