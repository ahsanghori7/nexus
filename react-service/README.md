# react-service-v2
Clink React V2: improved and better (and amazing!)

## 📚 Documentation

This project includes comprehensive documentation to help developers understand the codebase, follow best practices, and plan new features:

### Core Documentation
- **[Feature Implementation Planning Template](./PRESENTATION_LAYER_IMPLEMENTATION_PLAN.md)** - Reusable template for planning any new feature or component implementation
- **[Pull Request Template](./pull_request_template.md)** - Template for standardizing pull requests

### Development Guidelines
- **Project Structure Documentation** - *Coming soon: Detailed breakdown of the codebase organization*
- **Frontend Guidelines** - *Coming soon: UI/UX best practices and coding standards*

---

## ⚙️ Setup & Installation

### Before you start
This project was set up with webpack, npm and babel. You need to have up to date your dependencies in other to run and install the project
****
Important: make sure you have created in the root folder:
- config.json file with the local configuration (ask a dev for it)
- .npmrc file with the credentials for installing react-components assets
- Now we have clink-components.js helper. If you want to work locally with your react-components repo instead from package.json, uncomment the desired line from src/clink-components (also, don't forget to add new items to the list when developed, and do not push to github the local uncommented line)

***
### Before you start
We're using now pnpm to see if we can improve our local development performance. Please install this in your device before runing any commands
```
   npm install -g pnpm
```
#### Content of the .npmrc
```
@construction-link:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=[ASK_FOR_THIS_TOKEN]
strict-peer-dependencies=true
```
### Run up the project
After cloning the project, install dependencies
```
pnpm install
```
For running the project in local you need to:
```
/*
   Running server in dev mode:
*/
pnpm start
```
Other useful commands
```
=============================

// Build production assets
pnpm run build

// Running tests with jest (check package.json for all the available commands)
pnpm test

// To format the code with Eslint Airbnb Rules (check if you have npx installed)
pnpm prettier --write src
---
```
## 🧪 Testing & Analysis

### Bundle Analyzer
![image](https://github.com/construction-link/react-service-v2/assets/76554962/71c5ca6a-8a5b-4904-bf77-96811cf6187e)

We utilize [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer) to visually inspect the composition of our bundles. This tool aids us in pinpointing areas for optimization in our workflow. To view the graphical representation, please execute the following command on your local environment.

```
pnpm run build --env analyzer=true
// OR
pnpm run buildDev --env analyzer=true
```
-----

## Playwright (E2E testing)

This part will be moved to Nexus


---

## 🏗️ Project Architecture

## Project Structure (v2)
The src folder is the one we need to look at in order to start developing. We have the following structure
```
src
|
|____services // API helpers
|    |
|    |____Relay.js // Class library for calling Relay Endpoint
|
|____helpers // stand alone functions for solving specific problems
|    |
|    |____url.js // functions for managing URL problems
|    |____...etc
|
|____assets // global public folder: styles, images, fonts, etc
|    |____fonts
|    |____styles
|    |____...etc
|
|____hooks // helpers that use React Hooks to solve problems
|    |____context // configuring useContext hook
|                  // (global variables for our apps)
|    |____...etc
|
|____store // Global State management (we use Redux)
|    |____index.js // Create Store Instance. We declare the store and apply any enhancers or middleware here
|    |    enhancers // Extra feature to add to the store
|    |____middlewares // Layer between the store and components (currently empty: no custom middlewares implemented)
|    |____reducers // Action & State definitions
|             |
|             |____index.js // Combine reducers declarations
|             |____helpers.js // Stand alone functions
|             |               // for solving problems related to stores
|             |____actions.js // App/action mapping
|             |               // that allows us to see the relation
|             |               // between the apps we have and
|             |               // the action those apps can do to the states
|             |____contractors // store domain, state
|             |____projects // store domain, state
|             |____[store-domain] // folder that contain
|                        |        // the store information about
|                        |        // the data we want to manages.
|                        |        // Example: contractors store,
|                        |        // projects store, users store, etc...
|                        |
|                        |____actions.js // where we define the dispatch
|                        |               // actions the store is going to
|                        |               // listen for changing the state
|                        |____extraReducers.js // another actions file that
|                        |                     // will interact with the backend.
|                        |                     // Here we'll have the Relay
|                        |                     // calls and the behavior
|                        |                     // the store is going to dispatch
|                        |                     // depending on the call results
|                        |____index.js // Reducer instance.
|                                      // We use createSlice to create the
|                                      // reducer for our state domain
|
|____apps // where all the app/pages are.
      |
      |__admin
      |__[app-name]
      |__...etc
```

---

## 📖 Additional Documentation

For comprehensive development guidance, refer to these additional resources:

### Planning & Implementation
- **[Feature Implementation Planning Template](./PRESENTATION_LAYER_IMPLEMENTATION_PLAN.md)** - Use this template to plan any new feature, component, or significant code changes. It provides a structured approach with checklists, code templates, and best practices.

### Development Standards
- **[Pull Request Template](./pull_request_template.md)** - Follow this template when creating pull requests to ensure consistency and proper documentation.

### Recommended Documentation (To Be Created)
Consider creating these additional documentation files to improve the development experience:

- **PROJECT_STRUCTURE.md** - Detailed breakdown of the entire codebase structure with explanations
- **FRONTEND_GUIDELINES.md** - UI/UX development standards, coding conventions, and best practices
- **API_DOCUMENTATION.md** - Documentation of API endpoints and data structures
- **TESTING_GUIDE.md** - Comprehensive testing strategies and examples
- **DEPLOYMENT_GUIDE.md** - Step-by-step deployment instructions for different environments

### External Resources
- [Testing Guide (Google Drive)](https://drive.google.com/file/d/18gzBnGty1s0llF4Xyn5cUprStOOTnAGo/view?usp=sharing) - Unit testing guide and future plans

---

**Happy coding! 🚀**
