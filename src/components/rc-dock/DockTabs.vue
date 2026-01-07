<script setup>
import { inject } from 'vue'
import { DockContext } from './DockData'

const props = defineProps({
  panelData: {
    type: Object,
    required: true
  }
})

const { onDockMove, layoutVersion } = inject(DockContext)

const onDragStart = (e, tab) => {
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('dock/tab', JSON.stringify({
    tabId: tab.id,
    panelId: props.panelData.id
  }))
}

const onTabClick = (tab) => {
  props.panelData.activeId = tab.id
}

const onCloseClick = (e, tab) => {
  e.stopPropagation()
  // Use dockMove to handle removal properly, triggering cleanup logic
  onDockMove(tab, null, 'remove')
}
</script>

<template>
  <div class="dock-bar">
    <div 
      v-for="tab in panelData.tabs" 
      :key="tab.id"
      class="dock-tab"
      :class="{ 'dock-tab-active': panelData.activeId === tab.id }"
      draggable="true"
      @dragstart="onDragStart($event, tab)"
      @click="onTabClick(tab)"
    >
      <div class="dock-tab-title">{{ tab.title }}</div>
      <span v-if="tab.closable" class="dock-tab-close" @click="onCloseClick($event, tab)">
        <svg viewBox="0 0 12 12" width="12" height="12"><path d="M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5" stroke="currentColor" stroke-width="1.5" /></svg>
      </span>
    </div>
    <div class="dock-bar-fill"></div>
  </div>
</template>

<style>
.dock-bar {
  display: flex;
  background: #252526;
  height: 35px;
  overflow-x: auto;
  border-bottom: 1px solid #333;
}
.dock-bar-fill {
  flex: 1;
}
.dock-tab {
  padding: 0 12px;
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #969696;
  border-right: 1px solid #1e1e1e;
  user-select: none;
  background: #2d2d2d;
  min-width: 80px;
  max-width: 200px;
}
.dock-tab:hover {
  background: #383838;
}
.dock-tab-active {
  background: #1e1e1e;
  color: #fff;
  border-top: 1px solid #007fd4;
}
.dock-tab-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dock-tab-close {
  margin-left: 8px;
  opacity: 0.7;
  display: flex;
  align-items: center;
}
.dock-tab-close:hover {
  opacity: 1;
  color: #fff;
}
</style>
