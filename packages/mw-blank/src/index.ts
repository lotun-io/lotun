import { MiddlewareFunction } from '@lotun/middleware';

const middleware: MiddlewareFunction = async ({ use }) => {
  await use(async (ctx) => {
    // HTTP, TCP
    ctx.on('connection', (socket) => {});

    // UDP
    ctx.on('udpProxySocket', (socket) => {});

    // cleanup
    ctx.on('destroy', () => {});
  });
};

export default middleware;
