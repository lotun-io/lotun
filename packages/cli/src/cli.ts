#!/usr/bin/env node --enable-source-maps

import { LotunUpdater, LotunClient } from "@lotun/client";
import program from "commander";
import { dateFormat, initalizeUpdateNotifier } from "./utils";
import chalk from "chalk";
import os from "os";
import commander from "commander";

initalizeUpdateNotifier();

async function createLotunClient() {
  const lotunUpdater = new LotunUpdater();
  lotunUpdater.on("update", handleUpdate);
  const lotunClient = await lotunUpdater.createLotunClient();
  lotunClient.on("update", handleUpdate);
  return lotunClient;
}

function handleUpdate(latestVersion: string) {
  console.log(
    chalk.yellowBright(
      `Update available, downloading @lotun/client@${latestVersion} ...`
    )
  );
}

function handleDisconnect(lotunClient: LotunClient) {
  lotunClient.on("disconnect", ({ reason }) => {
    if (reason === "INVALID_TARGET") {
      console.log("error: invalid argument 'target'");
      return;
    }

    if (
      reason === "UNPAIRED_DEVICE_TOKEN" &&
      lotunClient.options.config?.deviceToken
    ) {
      const encodedToken = encodeURIComponent(
        lotunClient.options.config?.deviceToken
      );
      const encodedHostname = encodeURIComponent(os.hostname());
      console.log(
        chalk.redBright(
          "Device is not yet paried to your account, please pair your device by click on following link:"
        )
      );
      const DASHBOARD_URL = lotunClient.options.constants.DASHBOARD_URL;
      console.log(
        chalk.underline(
          `${DASHBOARD_URL}/devices/new?token=${encodedToken}&name=${encodedHostname}`
        )
      );
      return;
    }

    if (reason === "INVALID_DEVICE_TOKEN") {
      console.log(chalk.redBright("Device token is invalid"));
      return;
    }

    console.log(chalk.redBright(`Disconnect reason: ${reason}`));
  });
}

function handleConenct(lotunClient: LotunClient) {
  lotunClient.on("connect", ({ app }) => {
    if (lotunClient.options.mode === "NO_DEVICE_TOKEN") {
      const closeAt = new Date(app!.closeAt);
      console.log(
        chalk.greenBright(`Device connected, ${app?.entry} -> ${app?.target}`)
      );
      console.log(
        chalk.yellowBright(
          `Tunnel will be closed at: ${dateFormat(
            closeAt,
            "%yyyy-%mm-%dd %HH:%MM:%ss"
          )}`
        )
      );

      return;
    }
    const DASHBOARD_URL = lotunClient.options.constants.DASHBOARD_URL;
    console.log(
      chalk.greenBright("Device connected, setup your device from Dashboard:")
    );
    console.log(chalk.underline(`${DASHBOARD_URL}/`));
  });
}

async function noDeviceTokenMode(params: {
  type: "HTTP" | "TCP";
  target: string;
}) {
  const { type, target } = params;
  const lotunClient = await createLotunClient();
  lotunClient.options.mode = "NO_DEVICE_TOKEN";
  lotunClient.options.appConfig = {
    type,
    target,
  };
  handleConenct(lotunClient);
  handleDisconnect(lotunClient);
  await lotunClient.connect();
}

async function deviceTokenMode() {
  const lotunClient = await createLotunClient();
  handleConenct(lotunClient);
  handleDisconnect(lotunClient);
  await lotunClient.connect();
}

program
  .command("client", { isDefault: true })
  .action(async (name, options, command) => {
    if (options.args.length === 0 || options.args[0] === "client") {
      deviceTokenMode();
    } else {
      program.help();
    }
  });

program.command("http <target>").action(async (target) => {
  await noDeviceTokenMode({ type: "HTTP", target });
});

program.command("tcp <target>").action(async (target) => {
  await noDeviceTokenMode({ type: "TCP", target });
});

program.on("--help", function () {
  console.log("");
  console.log("Environment Variables:");
  console.log(
    "  LOTUN_TOKEN  -  Use device token directly, instead reading it from config"
  );
  console.log("  LOTUN_CONFIG   -  Path to lotun config file");
  console.log("  LOTUN_DATA   -  Path to lotun data folder");
});

program.parse(process.argv);

process.on("uncaughtException", (err) => {
  console.error("uncaughtException", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("unhandledRejection", promise, "reason:", reason);
});
