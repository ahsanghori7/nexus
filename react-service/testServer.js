import { setupServer } from 'msw/node';
import { rest } from 'msw';

const handlers = [
  rest.get(
    'http://app.prosper.local/relay/v1/account/regions',
    (req, res, ctx) => {
      return res(
        ctx.json({ data: [{ id: '2', label: 'East Midlands' }] }),
        ctx.status(200)
      );
    }
  ),
  rest.get(
    'http://app.prosper.local/relay/v1/account/trades',
    (req, res, ctx) => {
      return res(
        ctx.json({
          data: [
            { id: '1', label: 'Access / Temporary Works / Fall Restraint' },
          ],
        }),
        ctx.status(200)
      );
    }
  ),
];

// This configures a request mocking server with the given request handlers.
const server = setupServer(...handlers);
export default server;
