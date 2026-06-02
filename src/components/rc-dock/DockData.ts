import { inject } from "vue";
import type { InjectionKey } from "vue";
import type {
  DockContextType,
  DropDirectionType,
  TabGroup,
  TabState,
} from "./types";

export const DockContext: InjectionKey<DockContextType> = Symbol("DockContext");
export const DockProvider: InjectionKey<unknown> = Symbol("DockProvider");

export const DropDirection: Record<string, DropDirectionType> = {
  LEFT: "left",
  RIGHT: "right",
  BOTTOM: "bottom",
  TOP: "top",
  MIDDLE: "middle",
  REMOVE: "remove",
  BEFORE: "before-tab",
  AFTER: "after-tab",
  BEFORE_TAB: "before-tab",
  AFTER_TAB: "after-tab",
  FLOAT: "float",
  FRONT: "front",
  MAXIMIZE: "maximize",
  NEW_WINDOW: "new-window",
  MOVE: "move",
  ACTIVE: "active",
  UPDATE: "update",
};

export const defaultGroup: TabGroup = {
  floatable: true,
  maximizable: true,
};

export const placeHolderStyle = "place-holder";
export const maximePlaceHolderId = "-maximized-placeholder-";
export const placeHolderGroup: TabGroup = {
  floatable: false,
};

export const LayoutType = {
  Box: "box",
  Panel: "panel",
};

const tabStateStorage = new Map<string, TabState>();
const componentIdCounters = new Map<string, number>();

const getStorage = (): Storage | undefined => {
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
};

try {
  const saved = getStorage()?.getItem("dock-state");
  if (saved) {
    const parsed = JSON.parse(saved);
    for (const [key, value] of Object.entries(parsed)) {
      tabStateStorage.set(key, value as TabState);
    }
  }
} catch (e) {
  console.error("Failed to load dock state", e);
}

export function saveTabState() {
  try {
    const storage = getStorage();
    if (!storage) return;
    const obj = Object.fromEntries(tabStateStorage);
    storage.setItem("dock-state", JSON.stringify(obj));
  } catch (e) {
    console.error("Failed to save dock state", e);
  }
}

export function getTabState(tabId: string): TabState {
  if (!tabStateStorage.has(tabId)) {
    tabStateStorage.set(tabId, {});
  }
  return tabStateStorage.get(tabId)!;
}

export function nextId(): string {
  return "dock-" + Math.random().toString(36).slice(2, 11);
}

export function nextComponentId(componentName: string): string {
  const count = (componentIdCounters.get(componentName) ?? 0) + 1;
  componentIdCounters.set(componentName, count);
  return `${componentName}-${count}`;
}

export function seedComponentId(componentName: string, id: string) {
  const prefix = `${componentName}-`;
  if (!id.startsWith(prefix)) return;

  const count = Number(id.slice(prefix.length));
  if (!Number.isInteger(count) || count < 1) return;

  componentIdCounters.set(
    componentName,
    Math.max(componentIdCounters.get(componentName) ?? 0, count),
  );
}

export function useDock(): DockContextType {
  const context = inject(DockContext);
  if (!context) {
    throw new Error("useDock must be called under DockLayout");
  }
  return context;
}
