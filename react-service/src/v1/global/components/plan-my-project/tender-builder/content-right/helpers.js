const formPackagesInputs = [
  'packageName',
  'tenderReturnDate',
  'tenderStartDate',
  'tenderService',
  'tenderSize',
];

const getInputs = (formFields, field) => {
  const inputs = [];
  formFields.forEach((input) => {
    if (formPackagesInputs.includes(input.name)) {
      inputs.push({
        ...input,
        key: [input.key, field].join('-'),
        name: [input.name, field].join('-'),
      });
    }
  });
  return inputs;
};

export { formPackagesInputs, getInputs };
