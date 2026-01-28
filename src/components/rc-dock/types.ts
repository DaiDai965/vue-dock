import type { Component } from 'vue'

export type DropDirectionType = 'left' | 'right' | 'bottom' | 'top' | 'middle' | 'remove' | 'before' | 'after' | 'float' | 'front' | 'maximize' | 'new-window' | 'move' | 'active' | 'update'

export interface DockTab {
  id: string
  title: string
  content?: string | Component
  closable?: boolean
  group?: string
  active?: boolean
  componentName?: string
  component?: Component
  icon?: Component | string
  // Allow other properties for user custom data
  [key: string]: any
}

export interface DockContextType {
  layout: any
  onDockMove: (source: DockTab | DockPanel, target: DockTab | DockPanel | DockBox | string, direction: DropDirectionType) => void
  findNode: (id: string) => DockBox | DockPanel | DockTab | undefined
  layoutVersion: any
  getTabComponent: (id: string) => Component | undefined
}

export interface DockPanel {
  id: string
  size?: number
  tabs: DockTab[]
  activeId?: string
  group?: string
  x?: number
  y?: number
  w?: number
  h?: number
  z?: number
  minWidth?: number
  minHeight?: number
  panelLock?: any // PanelLock
}

export interface DockBox {
  id: string
  mode?: 'horizontal' | 'vertical' | 'float'
  size?: number
  children: (DockBox | DockPanel)[]
}

export interface LayoutData {
  dockbox: DockBox
  floatbox?: DockBox
  windowbox?: DockBox
  maxbox?: DockBox
}

export interface TabState {
  [key: string]: any
}
