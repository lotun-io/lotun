import fs from "fs";
import path from "path";
import { getLotunConfigFilePath, constants } from "./util";
import { createApiClient } from "@lotun/api";

type LotunOptionsConfig = {
  deviceToken: string;
};

export class LotunOptions {
  name?: string;
  mode: "NO_DEVICE_TOKEN" | "DEVICE_TOKEN" = "DEVICE_TOKEN";
  appConfig?: {
    type: "HTTP" | "TCP";
    target: string;
  };
  config?: LotunOptionsConfig;
  configFile: string;

  readonly constants: ReturnType<typeof constants>;
  private api!: ReturnType<typeof createApiClient>;

  constructor() {
    let name, deviceToken, configFile: string | undefined;
    this.constants = constants();

    // ENV
    if (typeof name !== "string") {
      name = process.env.LOTUN_NAME;
    }

    if (typeof deviceToken !== "string") {
      deviceToken = process.env.LOTUN_TOKEN;
    }

    if (deviceToken) {
      this.setConfig({ deviceToken });
    }

    if (typeof configFile !== "string") {
      configFile = process.env.LOTUN_CONFIG;
    }

    // DEFAULTS
    if (typeof configFile !== "string") {
      configFile = getLotunConfigFilePath();
    }

    if (!path.isAbsolute(configFile)) {
      configFile = path.join(process.cwd(), configFile);
    }

    this.name = name;
    this.configFile = configFile;

    this.api = createApiClient({ apiUrl: this.constants.API_URL });
  }

  setConfig(config: LotunOptionsConfig) {
    this.config = config;
  }

  async readConfig() {
    try {
      const configBuffer = await fs.promises.readFile(this.configFile);
      const config = JSON.parse(configBuffer.toString()) as LotunOptionsConfig;
      this.setConfig(config);
      return config;
    } catch (err) {
      return null;
    }
  }

  async saveConfig() {
    await fs.promises.mkdir(path.dirname(this.configFile), { recursive: true });
    await fs.promises.writeFile(this.configFile, JSON.stringify(this.config));
    this.readConfig();
  }

  async generateDeviceToken() {
    const token = await this.api.generateDeviceToken();
    return token;
  }
}
