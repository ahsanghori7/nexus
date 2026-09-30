import React from 'react';
import { v4 as uuidv4 } from 'uuid';

/*

<IMPORTANT> READ THE IMPORTANT COMMENT DOWN BELOW </IMPORTANT>


*/

const keyGenerator = (content) => `${Date.now()}-${uuidv4()}-${content}`;
const b = (children) => (
  <strong key={keyGenerator(children)}>{children}</strong>
);
const bred = (children) => (
  <strong key={keyGenerator(children)} className="red">
    {children}
  </strong>
);
const bpnk = (children) => (
  <strong key={keyGenerator(children)} className="pink">
    {children}
  </strong>
);
const binv = (children) => (
  <strong key={keyGenerator(children)} className="inv">
    {children}
  </strong>
);
const inv = (children) => (
  <strong key={keyGenerator(children)} className="inv">
    {children}
  </strong>
);
const trow = (children) => (
  <strong key={keyGenerator(children)} className="trow">
    {children}
  </strong>
);
const em = (children) => <em key={keyGenerator(children)}>{children}</em>;
const u = (children) => <u key={keyGenerator(children)}>{children}</u>;
const del = (children) => <del key={keyGenerator(children)}>{children}</del>;
const mark = (children) => <mark key={keyGenerator(children)}>{children}</mark>;
const hrt = (children) => (
  <hr key={keyGenerator(children)} data-content={`${children}`} />
);
const ul = (children) => <ul key={keyGenerator(children)}>{children}</ul>;
const ol = (children) => <ol key={keyGenerator(children)}>{children}</ol>;
const li = (children) => (
  <li key={keyGenerator(children)}>
    <span className="ql-ui" contentEditable="false" />
    {children}
  </li>
);
const lind = (children) => (
  <li className="ql-indent-1" key={keyGenerator(children)}>
    <span className="ql-ui" contentEditable="false" />
    {children}
  </li>
);
const lnd2 = (children) => (
  <li className="ql-indent-2" key={keyGenerator(children)}>
    <span className="ql-ui" contentEditable="false" />
    {children}
  </li>
);
const lnd3 = (children) => (
  <li className="ql-indent-3" key={keyGenerator(children)}>
    <span className="ql-ui" contentEditable="false" />
    {children}
  </li>
);
const lnd4 = (children) => (
  <li className="ql-indent-4" key={keyGenerator(children)}>
    <span className="ql-ui" contentEditable="false" />
    {children}
  </li>
);
const lnd5 = (children) => (
  <li className="ql-indent-5" key={keyGenerator(children)}>
    <span className="ql-ui" contentEditable="false" />
    {children}
  </li>
);
const lnd6 = (children) => (
  <li className="ql-indent-6" key={keyGenerator(children)}>
    <span className="ql-ui" contentEditable="false" />
    {children}
  </li>
);
const lnd7 = (children) => (
  <li className="ql-indent-7" key={keyGenerator(children)}>
    <span className="ql-ui" contentEditable="false" />
    {children}
  </li>
);
const lnd8 = (children) => (
  <li className="ql-indent-8" key={keyGenerator(children)}>
    <span className="ql-ui" contentEditable="false" />
    {children}
  </li>
);

const htmlParser = {
  br: () => <br key={keyGenerator('br')} />,
  hr: () => <hr key={keyGenerator('hr')} />,
  hrt: (children) => hrt(children),
  trow: (children) => trow(children),
  b: (children) => b(children),
  bred: (children) => bred(children),
  bpnk: (children) => bpnk(children),
  binv: (children) => binv(children),
  inv: (children) => inv(children),
  em: (children) => em(children),
  u: (children) => u(children),
  mark: (children) => mark(children),
  ul: (children) => ul(children),
  li: (children) => li(children),
  lind: (children) => lind(children),
  lnd2: (children) => lnd2(children),
  lnd3: (children) => lnd3(children),
  lnd4: (children) => lnd4(children),
  lnd5: (children) => lnd5(children),
  lnd6: (children) => lnd6(children),
  lnd7: (children) => lnd7(children),
  lnd8: (children) => lnd8(children),
  del: (children) => del(children),
  ol: (children) => ol(children),
  gp: () => <>&nbsp;</>,
};

/*
<IMPORTANT></IMPORTANT>

  When searching shortcode, we follow the criteria to find the : no further than 6 characters
  EX:
  {mark:
  {u:Hel
  {bred:
  {bpnk:
  {br:Mo


<IMPORTANT2></IMPORTANT2>

  Shortcodes like BR or GP need to be 2 characters max, as it's important for the backend
*/
const MAX_HTML_TAG_OPT_SIZE = 6;

export default htmlParser;
export { MAX_HTML_TAG_OPT_SIZE };
