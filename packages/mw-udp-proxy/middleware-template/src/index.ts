import { MiddlewareFunction } from '@lotun/middleware';
import { udpProxy } from '@lotun/mw-udp-proxy';

const middleware: MiddlewareFunction = async ({ use }) => {
  await use(
    udpProxy({
      host: 'localhost',
      port: 3000,
    }),
  );
};

export default middleware;
