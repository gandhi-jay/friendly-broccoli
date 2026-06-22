import type { ExtensionData } from "../types";
import { getDefaults } from "./defaults";

const STORAGE_KEY = "extensionData";

export async function loadData(): Promise<ExtensionData> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      resolve((result[STORAGE_KEY] as ExtensionData) ?? getDefaults());
    });
  });
}

export async function saveData(data: ExtensionData): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: data }, resolve);
  });
}
