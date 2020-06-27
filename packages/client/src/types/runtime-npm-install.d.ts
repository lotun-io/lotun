declare module 'runtime-npm-install' {
  export function npmInstallAsync(
    packages: string[],
    installPath?: string,
    npmInstallToOpts?: Object,
  ): Promise<unknown[]>;

  export function npmImportAsync(
    packages: string[],
    installPath?: string,
    npmInstallToOpts?: Object,
  ): Promise<unknown[]>;
}
