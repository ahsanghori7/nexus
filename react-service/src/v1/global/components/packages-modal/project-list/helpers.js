import Relay from 'v1/global/services/Relay';
import flag from 'v2/helpers/flags';

const DEFAULT_SHOWN_DOCUMENTS = 2;
const MIN_SELECTED_TO_SHOW = 2;
const PUBLISHED = 2;
const createShownProjects = (projects, pid = 0, newData = {}) =>
  projects.map((project) =>
    Number(pid) === Number(project.id)
      ? { ...project, ...newData }
      : {
          ...project,
          tender: project.tender.map((tender) => ({
            ...tender,
            selected: !tender.selected ? false : tender.selected,
          })),
          showAll: !pid ? false : project.showAll,
          allSelected: !pid ? false : project.allSelected,
        },
  );

const updateAllPackages = (pack = {}, data = {}) =>
  new Promise((resolve) => {
    const updateTender = new Relay('tender', 'updateAwardedStatus');
    // eslint-disable-next-line no-promise-executor-return
    return updateTender
      .patch(data, { pid: pack.project_id, tid: pack.id })
      .then(() => resolve(pack));
  });

const makeRequestToUpdate = (
  promises = [],
  newValue = {},
  callback = () => null,
) => Promise.all(promises).then((results) => callback(results, newValue));

const filterPackages = (tenders = []) =>
  tenders
    .filter(
      (pack) =>
        !pack.awarded &&
        (!pack.decision_date ||
          (new Date(pack.decision_date) > new Date(flag('EPOCH')) &&
            new Date(pack.decision_date) < new Date())),
    )
    .filter((pack) => pack.state === PUBLISHED)
    .filter((pack) => pack.decision_date);

export {
  filterPackages,
  makeRequestToUpdate,
  updateAllPackages,
  createShownProjects,
  PUBLISHED,
  MIN_SELECTED_TO_SHOW,
  DEFAULT_SHOWN_DOCUMENTS,
};
