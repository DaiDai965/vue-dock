<script setup>
import { defineProps, ref, onUnmounted } from 'vue'
import DockPanel from './DockPanel.vue'
import Divider from './Divider.vue'

const props = defineProps({
  boxData: {
    type: Object,
    required: true
  }
})

const isPanel = (item) => {
  return !!item.tabs
}

const boxRef = ref(null)

const onResizeStart = (index, e) => {
    const box = boxRef.value
    if (!box) return

    const children = Array.from(box.children).filter(c => !c.classList.contains('dock-divider'))
    const prevEl = children[index]
    const nextEl = children[index + 1]
    
    if (!prevEl || !nextEl) return
    
    const prevItem = props.boxData.children[index]
    const nextItem = props.boxData.children[index + 1]
    
    // Get initial sizes
    const isHorizontal = props.boxData.mode === 'horizontal'
    const startX = e.clientX
    const startY = e.clientY
    
    const prevRect = prevEl.getBoundingClientRect()
    const nextRect = nextEl.getBoundingClientRect()
    
    const startPrevSize = isHorizontal ? prevRect.width : prevRect.height
    const startNextSize = isHorizontal ? nextRect.width : nextRect.height
    
    // Convert to explicit pixels if currently flex
    if (!prevItem.size) prevItem.size = startPrevSize
    if (!nextItem.size) nextItem.size = startNextSize
    
    const handleMove = (e) => {
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        const delta = isHorizontal ? dx : dy
        
        const newPrevSize = startPrevSize + delta
        const newNextSize = startNextSize - delta
        
        if (newPrevSize > 30 && newNextSize > 30) {
             prevItem.size = newPrevSize
             nextItem.size = newNextSize
        }
    }
    
    const handleUp = () => {
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleUp)
    }
    
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
}
</script>

<template>
  <div class="dock-box" :class="'dock-box-' + boxData.mode" ref="boxRef">
    <template v-for="(child, index) in boxData.children" :key="child.id">
      <DockBox v-if="!isPanel(child)" :box-data="child" :style="{ flex: typeof child.size === 'number' ? `0 0 ${child.size}px` : (child.size || 1), overflow: 'hidden' }" />
      <DockPanel v-else :panel-data="child" :style="{ flex: typeof child.size === 'number' ? `0 0 ${child.size}px` : (child.size || 1), overflow: 'hidden' }" />
      
      <Divider 
        v-if="index < boxData.children.length - 1" 
        :mode="boxData.mode" 
        @start-resize="(e) => onResizeStart(index, e)"
      />
    </template>
  </div>
</template>

<style>
.dock-box {
  display: flex;
  width: 100%;
  height: 100%;
}
.dock-box-vertical {
  flex-direction: column;
}
.dock-box-horizontal {
  flex-direction: row;
}
</style>
