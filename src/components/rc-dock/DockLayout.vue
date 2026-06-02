<script setup lang="ts">
import { provide, ref, shallowRef, watch, watchEffect } from "vue";
import type { Component } from "vue";
import {
  DockContext,
  defaultGroup,
  nextComponentId,
  seedComponentId,
} from "./DockData";
import { attachParents, dockMove, find, findNearestPanel } from "./Algorithm";
import DockBox from "./DockBox.vue";
import FloatBox from "./FloatBox.vue";
import MaxBox from "./MaxBox.vue";
import WindowBox from "./WindowBox.vue";
import { loadLayoutData, saveLayoutData } from "./Serializer";
import type {
  AddComponentTabOptions,
  DockContextType,
  DockBox as DockBoxType,
  DockPanel,
  DockTab,
  DropDirectionType,
  FloatPosition,
  LayoutBase,
  LayoutData,
  LayoutProps,
  PanelBase,
  TabBase,
  TabGroup,
} from "./types";

type LayoutNode = DockBoxType | DockPanel;

interface Props extends LayoutProps {
  componentRegistry?: Record<string, Component>;
}

const props = withDefaults(defineProps<Props>(), {
  defaultLayout: () => ({
    dockbox: { id: "root", mode: "horizontal", children: [] },
  }),
  groups: () => ({}),
  componentRegistry: () => ({}),
  dropMode: "default",
});

const tabCache = shallowRef(new Map<string, Component>());
const layoutVersion = ref(0);
const layout = ref<LayoutData>(normalizeLayout(props.layout ?? props.defaultLayout));
const rootRef = ref<HTMLDivElement | null>(null);
const dropRect = ref<{
  left: number;
  top: number;
  width: number;
  height: number;
  direction?: DropDirectionType;
} | null>(null);

const getStorage = (): Storage | undefined => {
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
};

const getStorageKey = () => `dock-layout:${String(getDockId())}`;

const isPanel = (node: unknown): node is DockPanel => {
  return !!node && typeof node === "object" && "tabs" in node;
};

const isBox = (node: unknown): node is DockBoxType => {
  return !!node && typeof node === "object" && "children" in node;
};

function normalizeTab(tab: TabBase): DockTab {
  const id = tab.id ?? nextComponentId("tab");
  const component =
    tab.componentName && props.componentRegistry[tab.componentName]
      ? props.componentRegistry[tab.componentName]
      : (tab as DockTab).component;

  if (tab.componentName) {
    seedComponentId(tab.componentName, id);
  }

  return {
    ...tab,
    id,
    title: tab.title ?? id,
    component,
  } as DockTab;
}

function normalizePanel(panel: PanelBase): DockPanel {
  const tabs = panel.tabs.map((tab) =>
    props.loadTab ? props.loadTab(tab) : normalizeTab(tab),
  );
  const activeId = tabs.some((tab) => tab.id === panel.activeId)
    ? panel.activeId
    : tabs[0]?.id;
  const groupName = panel.group ?? tabs[0]?.group;
  const group = { ...defaultGroup, ...(groupName ? props.groups[groupName] : undefined) };
  const panelLock = (panel as DockPanel).panelLock;

  return {
    ...panel,
    id: panel.id ?? nextComponentId("panel"),
    tabs,
    activeId,
    group: groupName,
    minWidth: Math.max(
      ...tabs.map((tab) => Number(tab.minWidth) || 0),
      panelLock?.minWidth ?? 0,
      1,
    ),
    minHeight: Math.max(
      ...tabs.map((tab) => Number(tab.minHeight) || 0),
      panelLock?.minHeight ?? 0,
      1,
    ),
    panelLock,
    widthFlex: panelLock?.widthFlex ?? group.widthFlex,
    heightFlex: panelLock?.heightFlex ?? group.heightFlex,
  };
}

function normalizeBox(box: LayoutBase["dockbox"]): DockBoxType {
  return {
    ...box,
    id: box.id ?? nextComponentId("box"),
    children: box.children.map((child) =>
      "children" in child ? normalizeBox(child) : normalizePanel(child),
    ),
  };
}

function normalizeLayout(source: LayoutBase): LayoutData {
  return attachParents({
    dockbox: normalizeBox(source.dockbox),
    floatbox: source.floatbox ? normalizeBox(source.floatbox) : undefined,
    windowbox: source.windowbox ? normalizeBox(source.windowbox) : undefined,
    maxbox: source.maxbox ? normalizeBox(source.maxbox) : undefined,
    loadedFrom: source,
  });
}

function saveLayout() {
  try {
    const storage = getStorage();
    if (!storage) return;

    const savedLayout = saveLayoutData(
      layout.value as LayoutData,
      props.saveTab,
      props.afterPanelSaved,
    );
    storage.setItem(getStorageKey(), JSON.stringify(savedLayout));
  } catch (e) {
    console.error("Failed to save layout", e);
  }
}

function restoreLayout() {
  try {
    if (props.layout) return;
    const saved = getStorage()?.getItem(getStorageKey());
    if (!saved) return;

    const parsed = JSON.parse(saved) as LayoutBase;
    if (!parsed?.dockbox?.children) return;

    const loadTab = props.loadTab ?? normalizeTab;
    layout.value = loadLayoutData(
      parsed,
      normalizeLayout(props.defaultLayout),
      loadTab,
      props.afterPanelLoaded,
    );
    layoutVersion.value++;
  } catch (e) {
    console.error("Failed to restore layout", e);
  }
}

watch(
  () => props.layout,
  (nextLayout) => {
    if (!nextLayout) return;
    layout.value = normalizeLayout(nextLayout);
    layoutVersion.value++;
  },
  { deep: true },
);

restoreLayout();

let saveTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  layout,
  () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveLayout, 500);
  },
  { deep: true },
);

function emitLayoutChange(
  currentTabId?: string,
  direction?: DropDirectionType,
) {
  props.onLayoutChange?.(
    saveLayoutData(layout.value as LayoutData, props.saveTab, props.afterPanelSaved),
    currentTabId,
    direction,
  );
}

function updateLayout(newLayout: LayoutData, currentTabId?: string, direction?: DropDirectionType) {
  layout.value = newLayout;
  layoutVersion.value++;
  emitLayoutChange(currentTabId, direction);
}

const onDockMove = (
  source: DockTab | DockPanel,
  target: DockTab | DockPanel | DockBoxType | string | null,
  direction: DropDirectionType,
  floatPosition?: FloatPosition,
) => {
  const currentTabId = isPanel(source) ? source.activeId : source.id;
  updateLayout(dockMove(layout.value, source, target, direction, floatPosition), currentTabId, direction);
};

function findFirstPanel(box: LayoutNode): DockPanel | null {
  if (isPanel(box)) return box;
  for (const child of box.children) {
    const found = findFirstPanel(child);
    if (found) return found;
  }
  return null;
}

function findParentPanel(node: LayoutNode, tabId: string): DockPanel | null {
  if (isPanel(node)) {
    return node.tabs.some((tab) => tab.id === tabId) ? node : null;
  }
  for (const child of node.children) {
    const found = findParentPanel(child, tabId);
    if (found) return found;
  }
  return null;
}

function findNode(id: string): DockBoxType | DockPanel | DockTab | undefined {
  return find(layout.value as LayoutData, id);
}

function resolveTargetId(targetId?: string) {
  const root = layout.value.dockbox as DockBoxType;
  const target = targetId ? findNode(targetId) : undefined;
  if (isPanel(target) || isBox(target)) return target.id;

  const editorBox = (root.children as LayoutNode[]).find((child) => child.id === "editor-box");
  const editorPanel = editorBox ? findFirstPanel(editorBox) : null;
  if (editorPanel) return editorPanel.id;

  const firstPanel = findFirstPanel(root);
  return firstPanel?.id ?? editorBox?.id ?? root.id;
}

function addTab(
  tab: DockTab,
  targetId?: string,
  direction: DropDirectionType = "middle",
) {
  onDockMove(tab, resolveTargetId(targetId), direction);
  return tab;
}

function addComponentTab(
  componentName: string,
  component: Component,
  options: AddComponentTabOptions = {},
) {
  const id = nextComponentId(componentName);
  const tab: DockTab = {
    id,
    title: options.title ?? id,
    componentName,
    component,
    closable: options.closable ?? true,
  };
  return addTab(tab, options.targetId, options.direction ?? "middle");
}

function updateTab(id: string, newTab: Partial<DockTab> | null, makeActive = true) {
  const tab = findNode(id);
  if (!tab || !("title" in tab)) return false;

  if (newTab) {
    Object.assign(tab, newTab);
  }

  if (makeActive) {
    const parentPanel = findParentPanel(layout.value.dockbox as DockBoxType, id);
    if (parentPanel) parentPanel.activeId = id;
  }

  layoutVersion.value++;
  emitLayoutChange(id, "update");
  return true;
}

function getGroup(name?: string): TabGroup {
  return { ...defaultGroup, ...(name ? props.groups[name] : undefined) };
}

function getDockId() {
  return props.dockId ?? "default";
}

function useEdgeDrop() {
  return props.dropMode === "edge";
}

function setDropRect(
  element: HTMLElement | null,
  direction?: DropDirectionType,
  _source?: unknown,
  _event?: { clientX: number; clientY: number },
) {
  if (!element || direction === "remove") {
    dropRect.value = null;
    return;
  }

  const rootRect = rootRef.value?.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  dropRect.value = {
    left: rect.left - (rootRect?.left ?? 0),
    top: rect.top - (rootRect?.top ?? 0),
    width: rect.width,
    height: rect.height,
    direction,
  };
}

function getLayoutSize() {
  const rect = rootRef.value?.getBoundingClientRect();
  return {
    width: rect?.width ?? 0,
    height: rect?.height ?? 0,
  };
}

function onSilentChange(currentTabId?: string, direction?: DropDirectionType) {
  layoutVersion.value++;
  emitLayoutChange(currentTabId, direction);
}

function navigateToPanel(fromElement: HTMLElement, direction = "ArrowRight") {
  const root = rootRef.value;
  const currentPanel = fromElement.closest<HTMLElement>(".dock-panel");
  if (!root || !currentPanel) return;

  const fromRect = currentPanel.getBoundingClientRect();
  let bestPanel: HTMLElement | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const panel of Array.from(root.querySelectorAll<HTMLElement>(".dock-panel"))) {
    if (panel === currentPanel) continue;
    const distance = findNearestPanel(fromRect, panel.getBoundingClientRect(), direction);
    if (distance >= 0 && distance < bestDistance) {
      bestDistance = distance;
      bestPanel = panel;
    }
  }

  const panelId = bestPanel?.dataset.panelId;
  const panelData = panelId ? findNode(panelId) : undefined;
  if (panelData && isPanel(panelData) && panelData.activeId) {
    updateTab(panelData.activeId, null, true);
    bestPanel?.focus();
  }
}

function getRootElement() {
  return rootRef.value;
}

function getAllTabs(node: LayoutNode): DockTab[] {
  if (isPanel(node)) return [...node.tabs];
  return node.children.flatMap(getAllTabs);
}

watchEffect(() => {
  const boxes = [layout.value.dockbox, layout.value.floatbox, layout.value.maxbox].filter(
    Boolean,
  ) as DockBoxType[];
  const tabs = boxes.flatMap(getAllTabs);
  const activeIds = new Set<string>();

  for (const tab of tabs) {
    activeIds.add(tab.id);
    if (!tabCache.value.has(tab.id) && tab.component) {
      tabCache.value.set(tab.id, tab.component);
    }
  }

  for (const key of tabCache.value.keys()) {
    if (!activeIds.has(key)) {
      tabCache.value.delete(key);
    }
  }
});

const context = {
  layout,
  getDockId,
  useEdgeDrop,
  setDropRect,
  getLayoutSize,
  onSilentChange,
  navigateToPanel,
  getRootElement,
  onDockMove,
  dockMove: onDockMove,
  addTab,
  addComponentTab,
  findNode,
  find: findNode,
  updateTab,
  getGroup,
  layoutVersion,
  getTabComponent: (id: string) => tabCache.value.get(id),
} as unknown as DockContextType;

provide(DockContext, context);

defineExpose({
  dockMove: onDockMove,
  addTab,
  addComponentTab,
  find: findNode,
  updateTab,
  updateLayout,
});
</script>

<template>
  <div ref="rootRef" class="dock-layout" :style="style">
    <DockBox v-if="layout.dockbox" :box-data="layout.dockbox" />
    <FloatBox
      v-if="layout.floatbox?.children.length"
      :box-data="layout.floatbox"
    />
    <WindowBox
      v-if="layout.windowbox?.children.length"
      :box-data="layout.windowbox"
    />
    <MaxBox
      v-if="layout.maxbox?.children.length"
      :box-data="layout.maxbox"
    />
    <div
      v-if="dropRect"
      class="dock-drop-preview"
      :class="dropRect.direction"
      :style="{
        left: `${dropRect.left}px`,
        top: `${dropRect.top}px`,
        width: `${dropRect.width}px`,
        height: `${dropRect.height}px`,
      }"
    />
  </div>
</template>

<style>
.dock-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: #1e1e1e;
  color: #ccc;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
}
.dock-drop-preview {
  position: absolute;
  pointer-events: none;
  z-index: 2000;
  box-shadow: inset 0 0 0 2px #007fd4;
  background: rgba(0, 127, 212, 0.16);
}
.dock-drop-preview.left {
  width: 30% !important;
}
.dock-drop-preview.right {
  left: auto !important;
  right: 0;
  width: 30% !important;
}
.dock-drop-preview.top {
  height: 30% !important;
}
.dock-drop-preview.bottom {
  top: auto !important;
  bottom: 0;
  height: 30% !important;
}
</style>
