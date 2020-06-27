import { MiddlewareFunction } from '@lotun/middleware';
import { httpProxy } from '@lotun/mw-http-proxy';

const middleware: MiddlewareFunction = async ({ use }) => {
  await use(
    httpProxy({
      proxyOptions: function (req) {
        return {
          target: 'http://localhost:3000',
        };
      },
    }),
  );
};

export default middleware;
