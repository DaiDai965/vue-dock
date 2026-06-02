import type {
  BoxBase,
  DockBox,
  DockPanel,
  DockTab,
  LayoutBase,
  LayoutData,
  PanelBase,
  TabBase,
} from "./types";

interface DefaultLayoutCache {
  panels: Map<string, DockPanel>;
  tabs: Map<string, DockTab>;
}

function isPanel(node: DockBox | DockPanel): node is DockPanel {
  return "tabs" in node;
}

function addPanelToCache(panel: DockPanel, cache: DefaultLayoutCache) {
  cache.panels.set(panel.id, panel);
  for (const tab of panel.tabs) {
    cache.tabs.set(tab.id, tab);
  }
}

function addBoxToCache(box: DockBox | undefined, cache: DefaultLayoutCache) {
  if (!box) return;
  for (const child of box.children) {
    if (isPanel(child)) addPanelToCache(child, cache);
    else addBoxToCache(child, cache);
  }
}

export function createLayoutCache(defaultLayout?: LayoutData | DockBox): DefaultLayoutCache {
  const cache: DefaultLayoutCache = {
    panels: new Map(),
    tabs: new Map(),
  };
  if (!defaultLayout) return cache;

  if ("children" in defaultLayout) {
    addBoxToCache(defaultLayout, cache);
  } else {
    addBoxToCache(defaultLayout.dockbox, cache);
    addBoxToCache(defaultLayout.floatbox, cache);
    addBoxToCache(defaultLayout.windowbox, cache);
    addBoxToCache(defaultLayout.maxbox, cache);
  }

  return cache;
}

export function saveLayoutData(
  layout: LayoutData,
  saveTab?: (tab: DockTab) => TabBase,
  afterPanelSaved?: (savedPanel: PanelBase, panel: DockPanel) => void,
): LayoutBase {
  const saveTabData = (tab: DockTab): TabBase => {
    if (saveTab) return saveTab(tab);

    const saved: TabBase = {
      id: tab.id,
      title: tab.title,
      closable: tab.closable,
      group: tab.group,
      componentName: tab.componentName,
      cached: tab.cached,
    };

    if (typeof tab.content === "string" || typeof tab.content === "number") {
      saved.content = tab.content;
    }

    return saved;
  };

  const savePanelData = (panel: DockPanel): PanelBase => {
    const tabs = panel.tabs.map(saveTabData).filter(Boolean);
    const { id, size, activeId, group, x, y, z, w, h } = panel;
    const savedPanel: PanelBase = { id, size, activeId, group, tabs };

    if ([x, y, z, w, h].some((value) => value !== undefined)) {
      Object.assign(savedPanel, { x, y, z, w, h });
    }

    afterPanelSaved?.(savedPanel, panel);
    return savedPanel;
  };

  const saveBoxData = (box?: DockBox): BoxBase | undefined => {
    if (!box) return undefined;
    return {
      id: box.id,
      size: box.size,
      mode: box.mode,
      children: box.children.map((child) => (isPanel(child) ? savePanelData(child) : saveBoxData(child)!)),
    };
  };

  return {
    dockbox: saveBoxData(layout.dockbox)!,
    floatbox: saveBoxData(layout.floatbox),
    windowbox: saveBoxData(layout.windowbox),
    maxbox: saveBoxData(layout.maxbox),
  };
}

export function loadLayoutData(
  savedLayout: LayoutBase,
  defaultLayout: LayoutData,
  loadTab?: (tab: TabBase) => DockTab,
  afterPanelLoaded?: (savedPanel: PanelBase, loadedPanel: DockPanel) => void,
): LayoutData {
  const cache = createLayoutCache(defaultLayout);

  const loadTabData = (savedTab: TabBase): DockTab | null => {
    if (loadTab) return loadTab(savedTab);
    return savedTab.id ? cache.tabs.get(savedTab.id) ?? null : null;
  };

  const loadPanelData = (panel: PanelBase): DockPanel => {
    const tabs = panel.tabs.map(loadTabData).filter(Boolean) as DockTab[];
    const loadedPanel: DockPanel = {
      ...panel,
      id: panel.id ?? `panel-${Math.random().toString(36).slice(2, 8)}`,
      tabs,
      activeId: panel.activeId ?? tabs[0]?.id,
    };

    const cached = loadedPanel.id ? cache.panels.get(loadedPanel.id) : undefined;
    const merged = cached ? { ...cached, ...loadedPanel } : loadedPanel;
    afterPanelLoaded?.(panel, merged);
    return merged;
  };

  const loadBoxData = (box: BoxBase | undefined, fallbackMode: DockBox["mode"]): DockBox => ({
    id: box?.id ?? `${fallbackMode}-box`,
    mode: box?.mode ?? fallbackMode,
    size: box?.size,
    children: (box?.children ?? []).map((child) =>
      "tabs" in child ? loadPanelData(child) : loadBoxData(child, child.mode),
    ),
  });

  return {
    dockbox: loadBoxData(savedLayout.dockbox, "horizontal"),
    floatbox: loadBoxData(savedLayout.floatbox, "float"),
    windowbox: loadBoxData(savedLayout.windowbox, "window"),
    maxbox: loadBoxData(savedLayout.maxbox, "maximize"),
    loadedFrom: savedLayout,
  };
}
