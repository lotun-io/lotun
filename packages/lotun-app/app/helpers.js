"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const os_1 = require("os");
const electron_1 = require("electron");
const constants_1 = require("./constants");
function openPairURL(token) {
    const pairURL = `https://dashboard.${constants_1.LOTUN_URL}/devices/new?token=${token}&name=${os_1.hostname()}`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9oZWxwZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsNENBQW9CO0FBQ3BCLDJCQUE4QjtBQUM5Qix1Q0FBaUM7QUFDakMsMkNBQXdDO0FBRXhDLFNBQWdCLFdBQVcsQ0FBQyxLQUFhO0lBQ3ZDLE1BQU0sT0FBTyxHQUFHLHFCQUFxQixxQkFBUyxzQkFBc0IsS0FBSyxTQUFTLGFBQVEsRUFBRSxFQUFFLENBQUM7SUFDL0YsZ0JBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDOUIsQ0FBQztBQUhELGtDQUdDO0FBRUQsU0FBZ0IsUUFBUSxDQUFDLFFBQWdCO0lBQ3ZDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDckMsWUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDbEMsSUFBSSxHQUFHO2dCQUFFLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzVCLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBUEQsNEJBT0MifQ==