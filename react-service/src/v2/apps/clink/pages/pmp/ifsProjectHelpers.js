export const getIfsBusinessUnitLabel = (option) => {
  if (!option) return '';
  return [option.business_unit_code, option.business_unit_name]
    .filter(Boolean)
    .join(' - ');
};

export const getIfsOptionLabel = (option) => {
  if (!option) return '';
  const businessUnit = getIfsBusinessUnitLabel(option);
  return [option.project_code, option.project_name, businessUnit]
    .filter(Boolean)
    .join(' - ');
};

export const readOnlyIfsFieldSx = {
  '& .MuiInputBase-input': {
    backgroundColor: 'action.hover',
    cursor: 'default',
  },
};

export const IFS_FEATURE_NAME = 'IFS';

export const accountHasIfsFeature = (clinkAccount) =>
  Boolean(
    clinkAccount?.features?.some(
      (feature) => feature?.name === IFS_FEATURE_NAME,
    ),
  );

export const isIfsLinkedProject = (linkedIfsProject) => {
  const data = linkedIfsProject?.data;
  if (!data || Array.isArray(data)) {
    return false;
  }
  return Boolean(data.id || data.external_id || data.project_code);
};
