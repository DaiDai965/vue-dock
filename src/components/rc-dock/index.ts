import DockLayout from './DockLayout.vue'
import { useTabState } from './useTabState'
import { useDock } from './DockData'

export * from './types'
export * from './DockData'
export * from './Algorithm'
export * from './Serializer'
export * from './dragdrop/DragManager'
export * from './dragdrop/GestureManager'

export { default as DockLayout } from './DockLayout.vue'
export { default as DockBox } from './DockBox.vue'
export { default as DockPanel } from './DockPanel.vue'
export { default as DockTabs } from './DockTabs.vue'
export { default as DockTabRenderer } from './DockTabRenderer.vue'
export { default as FloatBox } from './FloatBox.vue'
export { default as MaxBox } from './MaxBox.vue'
export { default as WindowBox } from './WindowBox.vue'
export { default as WindowPanel } from './WindowPanel.vue'
export { default as DockDropLayer } from './DockDropLayer.vue'
export { default as DockDropEdge } from './DockDropEdge.vue'
export { default as DragDropDiv } from './dragdrop/DragDropDiv.vue'
export { useDock, useTabState }

export default DockLayout
