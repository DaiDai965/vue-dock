<script setup lang="ts">
import { markRaw, inject } from 'vue'
import { DockContext } from './rc-dock/DockData'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import SettingsView from '../views/SettingsView.vue'
import type { DockBox, DockPanel } from './rc-dock/types'

const { onDockMove, layout } = inject(DockContext)!

const files = [
  { name: 'HomeView.vue', component: markRaw(HomeView) },
  { name: 'AboutView.vue', component: markRaw(AboutView) },
  { name: 'SettingsView.vue', component: markRaw(SettingsView) }
]

const findFirstPanel = (box: DockBox | DockPanel): DockPanel | null => {
    if (!box) return null
    if ('tabs' in box) return box as DockPanel
    if ('children' in box && box.children) {
        for (const child of box.children) {
            const found = findFirstPanel(child)
            if (found) return found
        }
    }
    return null
}

const onDoubleClick = (file: { name: string, component: any }) => {
  const tab = {
     // Append random suffix to allow multiple instances of the same component
     id: file.name.toLowerCase().replace(/[^a-z0-9-]/g, '-') + '-' + Math.random().toString(36).substr(2, 9),
     title: file.name,
     componentName: file.name,
     component: file.component,
     closable: true
  }
  
  // Try to find the first panel in editor-box to append to
  let targetId = 'editor-box'
  
  if (layout && layout.value && layout.value.dockbox) {
      const editorBox = layout.value.dockbox.children.find((c: any) => c.id === 'editor-box')
      if (editorBox) {
          const firstPanel = findFirstPanel(editorBox)
          if (firstPanel) {
              targetId = firstPanel.id
          }
      }
  }

  onDockMove(tab, targetId, 'middle')
}
</script>

<template>
  <div class="file-explorer">
    <div class="header">VIEWS</div>
    <div class="file-list">
      <div 
        v-for="file in files" 
        :key="file.name"
        class="file-item"
        @dblclick="onDoubleClick(file)"
      >
        <span class="icon">📄</span>
        {{ file.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-explorer {
  height: 100%;
  background: #252526;
  color: #cccccc;
  font-size: 13px;
}
.header {
  padding: 10px 20px;
  font-weight: bold;
  font-size: 11px;
}
.file-item {
  padding: 3px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.file-item:hover {
  background-color: #2a2d2e;
}
.icon {
  margin-right: 6px;
}
</style>
