<script setup lang="ts">
import { inject, ref } from 'vue'
import { DockContext, DropDirection } from './DockData'
import DockTabs from './DockTabs.vue'
import DockTabRenderer from './DockTabRenderer.vue'
import type { DockPanel, DropDirectionType } from './types'

const props = defineProps<{
  panelData: DockPanel
}>()

const { onDockMove } = inject(DockContext)!
const dropZone = ref<DropDirectionType | null>(null)

const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  
  if (!e.currentTarget) return

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const width = rect.width
  const height = rect.height
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  const t = 0.25 // threshold
  
  if (x < width * t) dropZone.value = DropDirection.LEFT
  else if (x > width * (1 - t)) dropZone.value = DropDirection.RIGHT
  else if (y < height * t) dropZone.value = DropDirection.TOP
  else if (y > height * (1 - t)) dropZone.value = DropDirection.BOTTOM
  else dropZone.value = DropDirection.MIDDLE
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  
  const zone = dropZone.value
  dropZone.value = null
  
  if (!e.dataTransfer) return
  const data = e.dataTransfer.getData('dock/tab')
  if (!data) return
  
  const source = JSON.parse(data)
  
  // If dropping on same panel and middle, ignore
  if (source.panelId === props.panelData.id && zone === DropDirection.MIDDLE) return
  
  if (zone) {
      onDockMove({ id: source.tabId } as any, props.panelData.id, zone)
  }
}

const onDragLeave = () => {
  dropZone.value = null
}
</script>

<template>
  <div 
    class="dock-panel"
    @dragover="onDragOver"
    @drop="onDrop"
    @dragleave="onDragLeave"
  >
    <DockTabs :panel-data="panelData" />
    
    <div class="dock-panel-content">
   <div v-for="tab in panelData.tabs" :key="tab.id" v-show="panelData.activeId === tab.id" style="width:100%;height:100%">
      <KeepAlive>
          <DockTabRenderer :tab="tab" />
      </KeepAlive>
   </div>
</div>
    
    <div v-if="dropZone" :class="['dock-drop-layer', dropZone]"></div>
  </div>
</template>

<style>
.dock-panel {
  display: flex;
  flex-direction: column;
  position: relative;
  background: #1e1e1e;
  border: 1px solid #333;
  overflow: hidden;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.dock-panel-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: #1e1e1e;
}
.dock-drop-layer {
  position: absolute;
  top: 0; bottom: 0; left: 0; right: 0;
  z-index: 100;
  pointer-events: none;
  background: rgba(0, 128, 255, 0.3);
  transition: all 0.2s;
}
.dock-drop-layer.left { width: 30%; }
.dock-drop-layer.right { left: 70%; width: 30%; }
.dock-drop-layer.top { height: 30%; }
.dock-drop-layer.bottom { top: 70%; height: 30%; }
.dock-drop-layer.middle { left: 30%; right: 30%; top: 30%; bottom: 30%; background: rgba(0, 128, 255, 0.1); }
</style>
