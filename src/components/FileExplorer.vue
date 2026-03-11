<script setup lang="ts">
import { markRaw, inject } from 'vue'
import { DockContext, nextComponentId } from './rc-dock/DockData'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import SettingsView from '../views/SettingsView.vue'
import type { DockBox, DockPanel } from './rc-dock/types'

// Dock context provides layout state and move handler
// Dock 上下文提供布局状态和移动处理函数
const { onDockMove, layout } = inject(DockContext)!

// File list shown in the left tree
// 左侧树展示的组件列表
const files = [
  { name: 'HomeView.vue', component: markRaw(HomeView) },
  { name: 'AboutView.vue', component: markRaw(AboutView) },
  { name: 'SettingsView.vue', component: markRaw(SettingsView) }
]

// Find the first panel under a box for inserting new tabs
// 查找盒子下的第一个面板，用于插入新标签页
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

// Double click to open a tab in the editor area
// 双击在编辑区打开一个标签页
const onDoubleClick = (file: { name: string, component: any }) => {
  const id = nextComponentId(file.name)
  const tab = {
     // Unique tab id per open instance
     // 每次打开生成唯一 tab id
     id,
     title: id,
     componentName: file.name,
     component: file.component,
     closable: true
  }
  
  // Prefer first panel under editor-box
  // 优先插入 editor-box 下的第一个面板
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
