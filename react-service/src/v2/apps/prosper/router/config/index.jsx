import dashboard from './dashboard';
import projects from './projects';
import myCompany from './my-company';
import crm from './crm';
import changePassword from './change-password';
import resources from './resources';

class Config {
  constructor(subcontractor = {}) {
    this._subcontractor = subcontractor;
  }

  get subcontractor() {
    return this._subcontractor;
  }

  getDashboard() {
    const dashboarObj = dashboard(this.subcontractor);
    return dashboarObj;
  }

  getProjects() {
    const projectsObj = projects(this.subcontractor);
    return {
      ...projectsObj,
      routes: [
        ...projectsObj.routes,
      ],
    };
  }

  getMyCompany() {
    return myCompany;
  }

  getCRM() {
    return crm;
  }

  getChangePassword() {
    return changePassword;
  }

  getResources() {
    return resources;
  }

  getMain() {
    return [
      {
        id: 1,
        path: `${BASE_URLS.PROSPER}`,
        reactRouter: true,
        routes: [
          {
            ...this.getDashboard(),
            id: 2,
            index: true,
            label: null,
          },
          this.getDashboard(),
          this.getProjects(),
          this.getMyCompany(),
          this.getCRM(),
          this.getChangePassword(),
          this.getResources(),
        ],
      },
    ];
  }

  getRedirects() {
    return [
      ...this.getDashboard().redirects,
      ...this.getProjects().redirects,
      ...this.getMyCompany().redirects,
      ...this.getCRM().redirects,
      ...this.getChangePassword().redirects,
      ...this.getResources().redirects,
    ];
  }
}

export default Config;
