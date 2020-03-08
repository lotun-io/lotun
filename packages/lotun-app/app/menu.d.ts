import { checkForUpdates } from './updates';
export declare const DEFAULT_CONTEXT_MENU: ({
    type: string;
    label?: undefined;
    submenu?: undefined;
    click?: undefined;
} | {
    label: string;
    submenu: {
        type: string;
        id: string;
        label: string;
        checked: boolean;
        click: (menuItem: any) => void;
    }[];
    type?: undefined;
    click?: undefined;
} | {
    label: string;
    click: typeof checkForUpdates;
    type?: undefined;
    submenu?: undefined;
})[];
