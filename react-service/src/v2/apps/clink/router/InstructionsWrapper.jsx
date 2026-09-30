import React from 'react';
import i18next from 'v2/helpers/i18n';
import { getQueryStringVars } from 'v2/helpers/url';
import FormInstruction from 'v2/apps/clink/pages/form-instruction';
import Layout, { PROJECT_BREADCRUMBS, WITH_PROJECT } from 'v2/apps/clink/layout';

const InstructionsWrapper = () => {
  const vars = getQueryStringVars();
  const { type } = vars;

  return (
    <Layout
      breadCrumbItems={[
        ...PROJECT_BREADCRUMBS,
        {
          ...WITH_PROJECT,
          rest: type.replaceAll('-', '_'),
          name: i18next.t(type),
        },
      ]}
      title={`Edit ${i18next.t(type)}`}
    >
      <FormInstruction />
    </Layout>
  );
};

const routerConfig = {
  path: 'project/:slug/form_instruction',
  element: <InstructionsWrapper />,
};

export default routerConfig;
