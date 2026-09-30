import { useEffect, useState } from 'react';
import isNaN from 'lodash/isNaN';
import capitalize from 'lodash/capitalize';
import find from 'lodash/find';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'v2/helpers/i18n';
import Subscription from 'v2/helpers/user/subscription';
import { getQueryStringVars } from 'v2/helpers/url';

const subscriptionHelper = new Subscription();
const checkToken = (subcontractor = {}) =>
  subcontractor &&
  subscriptionHelper.isTokenUser(subcontractor.subscription_id);

const filters = ['projects', 'my-company', 'resources'];
const breadcrumbsConfig = (
  subcontractor = {},
  companyName = null,
  projectName = null,
  pages = {},
) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useTranslation();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const location = useLocation();
  const { state } = location;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [pathname, setPathname] = useState(location.pathname);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPathname(location.pathname);
  }, [location]);

  const { home, unlockedProjects, registeredInterests } = pages;
  const urlItems = pathname.split('/');
  // eslint-disable-next-line no-unused-vars
  const [_, ...rest] = urlItems;
  const uniqueUri = [...new Set(rest)];

  let breadcrumbsPath = uniqueUri.map((r, i) => {
    const copy = [...uniqueUri];
    const prevPath = copy.splice(0, i);
    let path = r;
    if (prevPath.length) {
      path = `${prevPath.join('/')}/${r}`;
    }
    const numberKey = Number(r);
    let keyTitle = t(r);
    if (!isNaN(numberKey)) {
      keyTitle = projectName || companyName;
    }
    // TODO: set strategy for general breadcrums + custom breadcrumbs so we get rid of this if hell
    if (keyTitle === t('company-profile') && state) {
      path = state && state.fromUrl && state.fromUrl.substring(1);
      keyTitle = state && state.fromName;
    } else if (state && keyTitle === state.fromName) {
      keyTitle = t('company-profile');
    }
    return {
      path,
      keyTitle,
    };
  });

  if (uniqueUri.length === 2 && !uniqueUri[0].includes('projects')) {
    breadcrumbsPath = breadcrumbsPath.filter((p) => !filters.includes(p.path));
  }
  // TODO: handle this in the backend to delete this
  if (
    uniqueUri.length === 2 &&
    uniqueUri[0].includes('projects') &&
    isNaN(Number(uniqueUri[1]))
  ) {
    breadcrumbsPath = breadcrumbsPath.filter((p) => !filters.includes(p.path));
  }
  const vars = getQueryStringVars();

  if ('unlocked_projects' in vars) {
    breadcrumbsPath = [
      !checkToken(subcontractor) ? registeredInterests : unlockedProjects,
    ];
  }
  // TODO: Investigate fixing duplicate i18n entries
  let breadcrumbsItems = [home, ...breadcrumbsPath].map((b) => ({
    ...b,
    keyTitle: i18next.exists(b.keyTitle)
      ? t(b.keyTitle)
      : capitalize(b.keyTitle),
  }));
  // TODO: Check this file to be supported by backend
  if (find(breadcrumbsItems, (b) => b.keyTitle === 'Submit quote')) {
    // eslint-disable-next-line no-unused-vars
    const [first, _second, third, fourth, fifth] = breadcrumbsItems;
    breadcrumbsItems = [first, third, { ...fourth, path: fifth.path }];
  }

  return breadcrumbsItems;
};

export default breadcrumbsConfig;
