import { OptionsFunction } from '@lotun/rule-udp-proxy';

const options: OptionsFunction = async (ctx) => {
  return {
    host: 'localhost',
    port: 3000,
  };
};

export default options;
