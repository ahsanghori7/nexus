const intersectionByPackage = (arrayCustom, arrayGroups) => {
  const selectedPackages = arrayCustom.flatMap((custom) =>
    custom.packages.map((pack) => pack.package_id)
  );
  const selectedTenders = arrayGroups.flatMap((val) =>
    Object.values(val.tenders).map((tender) => tender)
  );
  // from the custom tenders, we get the tenders we selected,
  // by matching package ids
  return selectedTenders.filter(
    (selected) =>
      selected.packages
        .map((pack) => pack.package_id)
        .filter((packId) => selectedPackages.includes(packId)).length
  );
};

export default intersectionByPackage;
