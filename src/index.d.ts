import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api?: {
      getStoreValue?: (key: string) => Promise<any>;
      setStoreValue?: (key: string, value: any) => Promise<boolean>;
      toggleClipboardMonitoring?: (enabled: boolean) => Promise<boolean>;
      getClipboardText?: () => Promise<string>;
      setClipboardText?: (text: string) => Promise<boolean>;
      onClipboardThread?: (
        callback: (text: string) => void
      ) => (() => void) | undefined;
    };
  }
}
