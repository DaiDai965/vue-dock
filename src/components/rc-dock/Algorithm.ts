import { DropDirection, maximePlaceHolderId, nextId, placeHolderStyle } from "./DockData";
import type {
  DockBox,
  DockPanel,
  DockTab,
  DropDirectionType,
  FloatPosition,
  LayoutData,
} from "./types";

let zIndexSeed = 0;

export enum Filter {
  Tab = 1,
  Panel = 1 << 1,
  Box = 1 << 2,
  Docked = 1 << 3,
  Floated = 1 << 4,
  Windowed = 1 << 5,
  Max = 1 << 6,
  EveryWhere = Docked | Floated | Windowed | Max,
  AnyTab = Tab | EveryWhere,
  AnyPanel = Panel | EveryWhere,
  AnyTabPanel = Tab | Panel | EveryWhere,
  All = Tab | Panel | Box | EveryWhere,
}

type FoundPanel = { panel: DockPanel; box: DockBox; index: number };
type FoundTab = FoundPanel & { tab: DockTab; tabIndex: number };

function clone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(clone) as T;

  const copy: Record<string, unknown> = {};
  for (const key in obj) {
    if (key === "parent") continue;
    const value = (obj as Record<string, unknown>)[key];
    copy[key] = key === "component" || key === "content" || key === "icon" ? value : clone(value);
  }
  return copy as T;
}

function isBox(node: unknown): node is DockBox {
  return !!node && typeof node === "object" && Array.isArray((node as DockBox).children);
}

function isPanel(node: unknown): node is DockPanel {
  return !!node && typeof node === "object" && Array.isArray((node as DockPanel).tabs);
}

function ensureBox(layout: LayoutData, key: "floatbox" | "windowbox" | "maxbox", mode: DockBox["mode"]): DockBox {
  layout[key] ??= { id: `${mode}-box`, mode, children: [] };
  return layout[key]!;
}

function attachParentsInBox(box: DockBox | undefined, parent?: DockBox) {
  if (!box) return;
  box.parent = parent;
  for (const child of box.children) {
    child.parent = box;
    if (isPanel(child)) {
      for (const tab of child.tabs) {
        tab.parent = child;
      }
    } else {
      attachParentsInBox(child, box);
    }
  }
}

export function attachParents(layout: LayoutData): LayoutData {
  attachParentsInBox(layout.dockbox);
  attachParentsInBox(layout.floatbox);
  attachParentsInBox(layout.windowbox);
  attachParentsInBox(layout.maxbox);
  return layout;
}

export function nextZIndex(current?: number): number {
  if (current === zIndexSeed) return current;
  zIndexSeed += 1;
  return zIndexSeed;
}

function findInBox(box: DockBox | undefined, id: string, filter: Filter): DockBox | DockPanel | DockTab | undefined {
  if (!box) return undefined;
  if ((filter & Filter.Box) && box.id === id) return box;

  for (const child of box.children) {
    if (isBox(child)) {
      const found = findInBox(child, id, filter);
      if (found) return found;
      continue;
    }

    if ((filter & Filter.Panel) && child.id === id) return child;
    if (filter & Filter.Tab) {
      const tab = child.tabs.find((item) => item.id === id);
      if (tab) return tab;
    }
  }

  return undefined;
}

export function find(layout: LayoutData, id: string, filter: Filter = Filter.AnyTabPanel): DockBox | DockPanel | DockTab | undefined {
  if ((filter & Filter.Docked) || !(filter & Filter.EveryWhere)) {
    const found = findInBox(layout.dockbox, id, filter);
    if (found) return found;
  }
  if (filter & Filter.Floated) {
    const found = findInBox(layout.floatbox, id, filter);
    if (found) return found;
  }
  if (filter & Filter.Windowed) {
    const found = findInBox(layout.windowbox, id, filter);
    if (found) return found;
  }
  if (filter & Filter.Max) {
    const found = findInBox(layout.maxbox, id, filter);
    if (found) return found;
  }
  return undefined;
}

function findPanelInBox(box: DockBox | undefined, panelId: string): FoundPanel | null {
  if (!box) return null;

  for (let index = 0; index < box.children.length; index += 1) {
    const child = box.children[index];
    if (isPanel(child) && child.id === panelId) return { panel: child, box, index };
    if (isBox(child)) {
      const found = findPanelInBox(child, panelId);
      if (found) return found;
    }
  }

  return null;
}

function findTabInBox(box: DockBox | undefined, tabId: string): FoundTab | null {
  if (!box) return null;

  for (let index = 0; index < box.children.length; index += 1) {
    const child = box.children[index];
    if (isPanel(child)) {
      const tabIndex = child.tabs.findIndex((tab) => tab.id === tabId);
      if (tabIndex >= 0) {
        return { panel: child, box, index, tab: child.tabs[tabIndex], tabIndex };
      }
    } else if (isBox(child)) {
      const found = findTabInBox(child, tabId);
      if (found) return found;
    }
  }

  return null;
}

function findPanel(layout: LayoutData, panelId: string): FoundPanel | null {
  return (
    findPanelInBox(layout.dockbox, panelId) ??
    findPanelInBox(layout.floatbox, panelId) ??
    findPanelInBox(layout.windowbox, panelId) ??
    findPanelInBox(layout.maxbox, panelId)
  );
}

function findTab(layout: LayoutData, tabId: string): FoundTab | null {
  return (
    findTabInBox(layout.dockbox, tabId) ??
    findTabInBox(layout.floatbox, tabId) ??
    findTabInBox(layout.windowbox, tabId) ??
    findTabInBox(layout.maxbox, tabId)
  );
}

function toPanel(source: DockTab | DockPanel): DockPanel {
  if (isPanel(source)) return source;
  return {
    id: nextId(),
    tabs: [source],
    activeId: source.id,
    group: source.group,
  };
}

function removeEmptyPanel(found: FoundPanel) {
  if (found.panel.tabs.length || found.panel.panelLock) return;
  found.box.children.splice(found.index, 1);
}

function removeSource(layout: LayoutData, source: DockTab | DockPanel): DockTab | DockPanel | null {
  if (isPanel(source)) {
    const found = findPanel(layout, source.id);
    if (!found) return clone(source);
    found.box.children.splice(found.index, 1);
    return found.panel;
  }

  const found = findTab(layout, source.id);
  if (!found) return clone(source);

  const [tab] = found.panel.tabs.splice(found.tabIndex, 1);
  if (found.panel.activeId === source.id) {
    found.panel.activeId = found.panel.tabs[Math.min(found.tabIndex, found.panel.tabs.length - 1)]?.id;
  }
  removeEmptyPanel(found);
  return tab;
}

function targetPanel(layout: LayoutData, target: DockBox | DockPanel | DockTab | string | null): DockPanel | null {
  if (!target) return null;
  const targetId = typeof target === "string" ? target : target.id;
  const panel = findPanel(layout, targetId)?.panel;
  if (panel) return panel;
  return findTab(layout, targetId)?.panel ?? null;
}

function targetBox(layout: LayoutData, target: DockBox | DockPanel | DockTab | string | null): DockBox | null {
  if (!target) return null;
  const targetId = typeof target === "string" ? target : target.id;
  const found = find(layout, targetId, Filter.Box | Filter.EveryWhere);
  return isBox(found) ? found : null;
}

function addTabToPanel(panel: DockPanel, source: DockTab | DockPanel, index = panel.tabs.length) {
  const tabs = isPanel(source) ? source.tabs : [source];
  panel.tabs.splice(index, 0, ...tabs);
  panel.activeId = tabs[tabs.length - 1]?.id ?? panel.activeId;
}

function splitTarget(layout: LayoutData, source: DockTab | DockPanel, target: DockBox | DockPanel | DockTab | string | null, direction: DropDirectionType) {
  const panel = targetPanel(layout, target);
  const box = panel ? findPanel(layout, panel.id)?.box : targetBox(layout, target);
  const targetNode = panel ?? targetBox(layout, target);
  if (!box || !targetNode) return;

  const newPanel = toPanel(source);
  const mode = direction === DropDirection.LEFT || direction === DropDirection.RIGHT ? "horizontal" : "vertical";
  const insertBefore = direction === DropDirection.LEFT || direction === DropDirection.TOP;

  if (box.mode === mode) {
    const index = box.children.indexOf(targetNode);
    box.children.splice(insertBefore ? index : index + 1, 0, newPanel);
    targetNode.size = undefined;
    return;
  }

  const index = box.children.indexOf(targetNode);
  const newBox: DockBox = {
    id: nextId(),
    mode,
    size: targetNode.size,
    children: insertBefore ? [newPanel, targetNode] : [targetNode, newPanel],
  };
  targetNode.size = undefined;
  box.children[index] = newBox;
}

function addToFloat(layout: LayoutData, source: DockTab | DockPanel, key: "floatbox" | "windowbox", position?: FloatPosition) {
  const panel = toPanel(source);
  const box = ensureBox(layout, key, key === "windowbox" ? "window" : "float");
  panel.x = position?.left ?? panel.x ?? 100;
  panel.y = position?.top ?? panel.y ?? 80;
  panel.w = position?.width ?? panel.w ?? 320;
  panel.h = position?.height ?? panel.h ?? 240;
  panel.z = nextZIndex(panel.z);
  box.children.push(panel);
}

function maximize(layout: LayoutData, source: DockTab | DockPanel) {
  const box = ensureBox(layout, "maxbox", "maximize");

  const sourcePanel = isPanel(source)
    ? findPanel(layout, source.id)?.panel
    : findTab(layout, source.id)?.panel;
  if (!sourcePanel) return;

  const maximizedPanel = findPanelInBox(box, sourcePanel.id);
  if (maximizedPanel) {
    const [panel] = box.children.splice(maximizedPanel.index, 1) as DockPanel[];
    const placeholder = findPanel(layout, maximePlaceHolderId);
    if (placeholder) {
      panel.size = placeholder.panel.size;
      placeholder.box.children[placeholder.index] = panel;
    } else {
      layout.dockbox.children.push(panel);
    }
    return;
  }

  if (box.children.length) return;

  const found = findPanel(layout, sourcePanel.id);
  if (!found) return;

  const placeholder: DockPanel = {
    id: maximePlaceHolderId,
    tabs: [],
    group: placeHolderStyle,
    panelLock: {},
    size: found.panel.size,
  };
  found.box.children[found.index] = placeholder;
  found.panel.size = undefined;
  box.children = [found.panel];
}

function cleanupBox(box: DockBox | undefined): boolean {
  if (!box) return false;
  let changed = false;

  for (let index = 0; index < box.children.length; index += 1) {
    const child = box.children[index];
    if (!isBox(child)) continue;

    changed = cleanupBox(child) || changed;

    if (!child.children.length) {
      box.children.splice(index, 1);
      index -= 1;
      changed = true;
    } else if (child.children.length === 1 && child.id !== "editor-box") {
      const onlyChild = child.children[0];
      if (child.size !== undefined) onlyChild.size = child.size;
      box.children[index] = onlyChild;
      changed = true;
    }
  }

  return changed;
}

function cleanupLayout(layout: LayoutData) {
  for (const box of [layout.dockbox, layout.floatbox, layout.windowbox, layout.maxbox]) {
    let guard = 20;
    while (cleanupBox(box) && guard > 0) guard -= 1;
  }

  if (!layout.maxbox?.children.length) {
    const placeholder = findPanel(layout, maximePlaceHolderId);
    if (placeholder) {
      placeholder.box.children.splice(placeholder.index, 1);
    }
  }

  if (!layout.dockbox.children.length) {
    layout.dockbox.children.push({
      id: `${placeHolderStyle}-panel`,
      group: placeHolderStyle,
      panelLock: {},
      size: 200,
      tabs: [],
    });
  }
}

export function updateTab(layout: LayoutData, id: string, newTab: Partial<DockTab>): boolean {
  const tab = find(layout, id, Filter.AnyTab) as DockTab | undefined;
  if (!tab) return false;
  Object.assign(tab, newTab);
  return true;
}

export function dockMove(
  layout: LayoutData,
  source: DockTab | DockPanel,
  target: DockTab | DockPanel | DockBox | string | null,
  direction: DropDirectionType,
  floatPosition?: FloatPosition,
): LayoutData {
  const nextLayout = clone(layout);
  attachParents(nextLayout);
  if (direction === DropDirection.MOVE || direction === DropDirection.ACTIVE || direction === DropDirection.UPDATE) {
    return attachParents(nextLayout);
  }

  if (direction === DropDirection.FRONT) {
    const panel = isPanel(source) ? findPanel(nextLayout, source.id)?.panel : targetPanel(nextLayout, source.id);
    if (panel) panel.z = nextZIndex(panel.z);
    return attachParents(nextLayout);
  }

  if (direction === DropDirection.MAXIMIZE) {
    maximize(nextLayout, source);
    return attachParents(nextLayout);
  }

  const movingSource = direction === DropDirection.REMOVE ? source : removeSource(nextLayout, source);

  cleanupLayout(nextLayout);

  if (direction === DropDirection.REMOVE) return attachParents(nextLayout);
  if (!movingSource) return layout;

  if (direction === DropDirection.FLOAT) {
    addToFloat(nextLayout, movingSource, "floatbox", floatPosition);
    return attachParents(nextLayout);
  }

  if (direction === DropDirection.NEW_WINDOW) {
    addToFloat(nextLayout, movingSource, "windowbox", floatPosition);
    return attachParents(nextLayout);
  }

  const panel = targetPanel(nextLayout, target);
  if (
    panel &&
    (direction === DropDirection.MIDDLE ||
      direction === DropDirection.BEFORE ||
      direction === DropDirection.AFTER ||
      direction === "before" ||
      direction === "after")
  ) {
    const targetId = typeof target === "string" ? target : target?.id;
    const tabIndex = targetId ? panel.tabs.findIndex((tab) => tab.id === targetId) : -1;
    if (direction === DropDirection.BEFORE || direction === "before") {
      addTabToPanel(panel, movingSource, Math.max(tabIndex, 0));
    } else if (direction === DropDirection.AFTER || direction === "after") {
      addTabToPanel(panel, movingSource, tabIndex >= 0 ? tabIndex + 1 : panel.tabs.length);
    } else {
      addTabToPanel(panel, movingSource);
    }
    return attachParents(nextLayout);
  }

  const box = targetBox(nextLayout, target);
  if (box && direction === DropDirection.MIDDLE) {
    box.children.push(toPanel(movingSource));
    return attachParents(nextLayout);
  }

  splitTarget(nextLayout, movingSource, target, direction);
  cleanupLayout(nextLayout);
  return attachParents(nextLayout);
}

export function getFloatPanelSize(panel: HTMLElement | null, tabGroup?: { preferredFloatWidth?: [number, number]; preferredFloatHeight?: [number, number] }) {
  const rect = panel?.getBoundingClientRect();
  const width = Math.min(Math.max(rect?.width ?? 320, tabGroup?.preferredFloatWidth?.[0] ?? 100), tabGroup?.preferredFloatWidth?.[1] ?? 600);
  const height = Math.min(Math.max(rect?.height ?? 240, tabGroup?.preferredFloatHeight?.[0] ?? 50), tabGroup?.preferredFloatHeight?.[1] ?? 500);
  return [width, height] as const;
}

export function fixFloatPanelPos(layout: LayoutData, layoutWidth = 0, layoutHeight = 0): LayoutData {
  const nextLayout = clone(layout);
  for (const box of [nextLayout.floatbox, nextLayout.windowbox]) {
    for (const child of box?.children ?? []) {
      if (!isPanel(child)) continue;
      child.x = Math.min(Math.max(child.x ?? 0, 16 - (child.w ?? 320)), Math.max(layoutWidth - 16, 0));
      child.y = Math.min(Math.max(child.y ?? 0, 0), Math.max(layoutHeight - 16, 0));
    }
  }
  return nextLayout;
}

export function fixLayoutData(layout: LayoutData): LayoutData {
  const nextLayout = clone(layout);
  nextLayout.floatbox ??= { id: "floatbox", mode: "float", children: [] };
  nextLayout.windowbox ??= { id: "windowbox", mode: "window", children: [] };
  nextLayout.maxbox ??= { id: "maxbox", mode: "maximize", children: [] };
  cleanupLayout(nextLayout);
  return attachParents(nextLayout);
}

export function findNearestPanel(rectFrom: DOMRect, rectTo: DOMRect, direction: string): number {
  let distance = -1;
  let overlap = -1;
  let alignment = 0;

  switch (direction) {
    case "ArrowUp":
      distance = rectFrom.top - rectTo.bottom + rectFrom.height;
      overlap = Math.min(rectFrom.right, rectTo.right) - Math.max(rectFrom.left, rectTo.left);
      break;
    case "ArrowDown":
      distance = rectTo.top - rectFrom.bottom + rectFrom.height;
      overlap = Math.min(rectFrom.right, rectTo.right) - Math.max(rectFrom.left, rectTo.left);
      break;
    case "ArrowLeft":
      distance = rectFrom.left - rectTo.right + rectFrom.width;
      overlap = Math.min(rectFrom.bottom, rectTo.bottom) - Math.max(rectFrom.top, rectTo.top);
      alignment = Math.abs(rectFrom.top - rectTo.top);
      break;
    case "ArrowRight":
      distance = rectTo.left - rectFrom.right + rectFrom.width;
      overlap = Math.min(rectFrom.bottom, rectTo.bottom) - Math.max(rectFrom.top, rectTo.top);
      alignment = Math.abs(rectFrom.top - rectTo.top);
      break;
  }

  if (distance < 0 || overlap <= 0) return -1;
  return distance * (alignment + 1) - overlap * 0.001;
}

export function getUpdatedObject<T>(obj: T): T {
  return obj;
}
