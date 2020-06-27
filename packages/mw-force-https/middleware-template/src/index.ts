import { MiddlewareFunction } from '@lotun/middleware';
import { tcpProxy } from '@lotun/mw-force-https';

const middleware: MiddlewareFunction = async ({ use }) => {
  await use(
    tcpProxy({
      host: 'localhost',
      port: 3000,
    }),
  );
};

export default middleware;
