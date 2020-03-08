"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const os_1 = require("os");
const electron_1 = require("electron");
function openPairURL(token, dashboardUrl) {
    const pairURL = `${dashboardUrl}/devices/new?token=${token}&name=${os_1.hostname()}`;
    electron_1.shell.openExternal(pairURL);
}
exports.openPairURL = openPairURL;
function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs_1.default.readFile(filePath, (err, data) => {
            if (err)
                return reject(err);
            return resolve(data);
        });
    });
}
exports.readFile = readFile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9oZWxwZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsNENBQW9CO0FBQ3BCLDJCQUE4QjtBQUM5Qix1Q0FBaUM7QUFFakMsU0FBZ0IsV0FBVyxDQUFDLEtBQWEsRUFBRSxZQUFvQjtJQUM3RCxNQUFNLE9BQU8sR0FBRyxHQUFHLFlBQVksc0JBQXNCLEtBQUssU0FBUyxhQUFRLEVBQUUsRUFBRSxDQUFDO0lBQ2hGLGdCQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLENBQUM7QUFIRCxrQ0FHQztBQUVELFNBQWdCLFFBQVEsQ0FBQyxRQUFnQjtJQUN2QyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ3JDLFlBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ2xDLElBQUksR0FBRztnQkFBRSxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1QixPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVBELDRCQU9DIn0=