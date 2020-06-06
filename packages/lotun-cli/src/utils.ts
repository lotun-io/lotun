function timestamp(...args: any[]) {
  return [
    `[${new Date()
      .toString()
      .replace(/\(.*\)/, '')
      .trim()}]`,
  ].concat(args);
}

export function log(...args: any[]) {
  // @ts-ignore
  console.log.apply(console, timestamp(...args));
}

export function error(...args: any[]) {
  // @ts-ignore
  console.error.apply(console, timestamp(...args));
}
