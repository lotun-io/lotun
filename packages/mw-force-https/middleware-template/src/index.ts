import { MiddlewareFunction } from '@lotun/middleware';
import { forceHttps } from '@lotun/mw-force-https';

const middleware: MiddlewareFunction = async ({ use }) => {
  await use(forceHttps());
};

export default middleware;
