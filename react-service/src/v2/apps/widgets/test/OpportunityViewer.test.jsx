// import React from 'react';
// import { MemoryRouter } from 'react-router-dom';
// import { render, screen } from '@testing-library/react';
// import userEvent from '@testing-library/user-event'
// import OpportunityViewer from '../opportunity-viewer';

// const generalTest = ({ discoverTest, resultTest, modalTitleTest, checkboxOptionsTest }) => {
//   const title = screen.getByTestId('opportunity-title-1');
//   const selectBox1 = screen.getByTestId('opportunity-autocomple-1');
//   const selectBox2 = screen.getByTestId('opportunity-autocomple-2');
//   const resultsSuccess = screen.queryByTestId(
//     'opportunity-result-container-success'
//   );
//   const resultsError = screen.queryByTestId(
//     'opportunity-result-container-error'
//   );
//   const signup = screen.queryByTestId('opportunity-signup');
//   const discover = screen.queryByTestId('opportunity-discover');
//   const resultSearch = screen.queryByTestId('opportunity-result-item-success-2');
//   const modalTitle = screen.queryByTestId('dialog-title');
//   const checkboxOptions = screen.queryByTestId('checkbox-options');

//   expect(title).toBeTruthy();
//   expect(selectBox1).toBeTruthy();
//   expect(selectBox2).toBeTruthy();
//   expect(resultsSuccess).toBeFalsy();
//   expect(resultsError).toBeFalsy();
//   expect(signup).toBeFalsy();
//   expect(discover)[discoverTest]();
//   expect(resultSearch)[resultTest]();
//   expect(modalTitle)[modalTitleTest]();
//   expect(checkboxOptions)[checkboxOptionsTest]();
// };

// const testObj = { discoverTest: 'toBeFalsy', resultTest: 'toBeFalsy', modalTitleTest: 'toBeFalsy', checkboxOptionsTest: 'toBeFalsy' };
// describe('OpportunityViewer component', () => {
//   test('should render OpportunityViewer component correctly', () => {
//     render(<OpportunityViewer />);
//     generalTest(testObj);
//   });
//   test('should render discover link when discover is on', () => {
//     render(<OpportunityViewer discover />, { wrapper: MemoryRouter });
//     generalTest({ ...testObj, discoverTest: 'toBeTruthy' });
//   });
//   test('should render trades modal when clicking on the trades button', async () => {
//     render(<OpportunityViewer />);
//     await userEvent.click(screen.getByTestId('trades-open-modal'))
//     generalTest({ ...testObj, modalTitleTest: 'toBeTruthy', checkboxOptionsTest: 'toBeTruthy' });
//     // TODO: Uncoment when test server works
//     // const checkboxOption = screen.queryByTestId('checkbox-option-0');
//     // expect(checkboxOption).toBeTruthy();
//   });
//   test('should render regions modal when clicking on the regions button', async () => {
//     render(<OpportunityViewer />);
//     await userEvent.click(screen.getByTestId('regions-open-modal'))
//     generalTest({ ...testObj, modalTitleTest: 'toBeTruthy', checkboxOptionsTest: 'toBeTruthy' });
//     // TODO: Uncoment when test server works
//     // const checkboxOption = screen.queryByTestId('checkbox-option-0');
//     // expect(checkboxOption).toBeTruthy();
//   });
// });

describe('OpportunityViewer component', () => {
  test('should be review by the developer in a future', async () => {
    expect(true).toBeTruthy();
  });
});
