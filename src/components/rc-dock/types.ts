import type { Component, CSSProperties, Ref, VNodeChild } from "vue";

export type DockMode = "horizontal" | "vertical" | "float" | "window" | "maximize";

export type DropDirectionType =
  | "left"
  | "right"
  | "bottom"
  | "top"
  | "middle"
  | "remove"
  | "before-tab"
  | "after-tab"
  | "before"
  | "after"
  | "float"
  | "front"
  | "maximize"
  | "new-window"
  | "move"
  | "active"
  | "update";

export interface TabGroup {
  floatable?: boolean | "singleTab";
  newWindow?: boolean;
  disableDock?: boolean;
  maximizable?: boolean;
  tabLocked?: boolean;
  animated?: boolean;
  panelExtra?: (panel: DockPanel, context: DockContextType) => VNodeChild;
  preferredFloatWidth?: [number, number];
  preferredFloatHeight?: [number, number];
  widthFlex?: number;
  heightFlex?: number;
  moreIcon?: VNodeChild;
}

export interface TabBase {
  id?: string;
  title?: VNodeChild;
  content?: VNodeChild | Component | ((tab: DockTab) => VNodeChild);
  closable?: boolean;
  group?: string;
  componentName?: string;
  cached?: boolean;
  [key: string]: unknown;
}

export interface DockTab extends TabBase {
  id: string;
  title: VNodeChild;
  content?: VNodeChild | Component | ((tab: DockTab) => VNodeChild);
  active?: boolean;
  component?: Component;
  icon?: Component | string;
  parent?: DockPanel;
}

export interface PanelBase {
  id?: string;
  size?: number;
  tabs: TabBase[];
  activeId?: string;
  group?: string;
  x?: number;
  y?: number;
  z?: number;
  w?: number;
  h?: number;
}

export interface DockPanel extends Omit<PanelBase, "id" | "tabs"> {
  id: string;
  tabs: DockTab[];
  activeId?: string;
  minWidth?: number;
  minHeight?: number;
  widthFlex?: number;
  heightFlex?: number;
  panelLock?: PanelLock;
  parent?: DockBox;
}

export interface BoxBase {
  id?: string;
  mode: DockMode;
  size?: number;
  children: (BoxBase | PanelBase)[];
}

export interface DockBox extends Omit<BoxBase, "id" | "children"> {
  id: string;
  children: (DockBox | DockPanel)[];
  minWidth?: number;
  minHeight?: number;
  widthFlex?: number;
  heightFlex?: number;
  parent?: DockBox;
}

export interface LayoutBase {
  dockbox: BoxBase;
  floatbox?: BoxBase;
  windowbox?: BoxBase;
  maxbox?: BoxBase;
}

export interface LayoutData {
  dockbox: DockBox;
  floatbox?: DockBox;
  windowbox?: DockBox;
  maxbox?: DockBox;
  loadedFrom?: LayoutBase;
}

export interface PanelLock {
  panelStyle?: string;
  minWidth?: number;
  minHeight?: number;
  panelExtra?: (panel: DockPanel) => VNodeChild;
  widthFlex?: number;
  heightFlex?: number;
}

export interface FloatSize {
  width: number;
  height: number;
}

export interface FloatPosition extends FloatSize {
  left: number;
  top: number;
}

export interface AddComponentTabOptions {
  title?: string;
  targetId?: string;
  closable?: boolean;
  direction?: DropDirectionType;
}

export interface LayoutProps {
  dockId?: string;
  defaultLayout?: LayoutData;
  layout?: LayoutBase;
  groups?: Record<string, TabGroup>;
  dropMode?: "default" | "edge";
  style?: CSSProperties;
  onLayoutChange?: (
    newLayout: LayoutBase,
    currentTabId?: string,
    direction?: DropDirectionType,
  ) => void;
  saveTab?: (tab: DockTab) => TabBase;
  loadTab?: (tab: TabBase) => DockTab;
  afterPanelSaved?: (savedPanel: PanelBase, panel: DockPanel) => void;
  afterPanelLoaded?: (savedPanel: PanelBase, loadedPanel: DockPanel) => void;
}

export type DockMoveHandler = (
  source: DockTab | DockPanel,
  target: DockTab | DockPanel | DockBox | string | null,
  direction: DropDirectionType,
  floatPosition?: FloatPosition,
) => void;

export type FindNodeHandler = (
  id: string,
) => DockBox | DockPanel | DockTab | undefined;

export interface DockContextType {
  layout: Ref<LayoutData>;
  getDockId: () => unknown;
  useEdgeDrop: () => boolean;
  setDropRect: (
    element: HTMLElement | null,
    direction?: DropDirectionType,
    source?: unknown,
    event?: { clientX: number; clientY: number },
    panelSize?: [number, number],
  ) => void;
  getLayoutSize: () => FloatSize;
  onSilentChange: (currentTabId?: string, direction?: DropDirectionType) => void;
  navigateToPanel: (fromElement: HTMLElement, direction?: string) => void;
  getRootElement: () => HTMLDivElement | null;
  onDockMove: DockMoveHandler;
  dockMove: DockMoveHandler;
  addTab: (
    tab: DockTab,
    targetId?: string,
    direction?: DropDirectionType,
  ) => DockTab;
  addComponentTab: (
    componentName: string,
    component: Component,
    options?: AddComponentTabOptions,
  ) => DockTab;
  findNode: FindNodeHandler;
  find: FindNodeHandler;
  updateTab: (id: string, newTab: Partial<DockTab> | null, makeActive?: boolean) => boolean;
  getGroup: (name?: string) => TabGroup;
  layoutVersion: Ref<number>;
  getTabComponent: (id: string) => Component | undefined;
}

export interface TabState {
  [key: string]: unknown;
}

export type TabData = DockTab;
export type PanelData = DockPanel;
export type BoxData = DockBox;
