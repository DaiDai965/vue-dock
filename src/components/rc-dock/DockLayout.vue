<script setup>
import { provide, ref, toRef, nextTick, computed, markRaw, watchEffect, onMounted, watch } from 'vue'
import { DockContext } from './DockData'
import { dockMove, find } from './Algorithm'
import DockBox from './DockBox.vue'

const props = defineProps({
  defaultLayout: {
    type: Object,
    default: () => ({ dockbox: { mode: 'horizontal', children: [] } })
  },
  componentRegistry: {
    type: Object,
    default: () => ({})
  }
})

const layout = ref(props.defaultLayout)
const layoutVersion = ref(0) 
const renderVersion = ref(0)

// Cache for persistent components
// 持久化组件的缓存
const tabCache = ref(new Map())
const tabKeys = ref([])

// Persistence
// 持久化逻辑
const saveLayout = () => {
  try {
    // Serialize layout, excluding non-serializable Vue components
    // 序列化布局，排除不可序列化的 Vue 组件
    const json = JSON.stringify(layout.value, (key, value) => {
      if (key === 'component') return undefined
      return value
    })
    localStorage.setItem('dock-layout', json)
  } catch (e) {
    console.error('Failed to save layout', e)
  }
}

const restoreLayout = () => {
  try {
    const saved = localStorage.getItem('dock-layout')
    if (saved) {
      const parsed = JSON.parse(saved)
      
      // Re-attach Vue components based on componentName
      // 根据 componentName 重新挂载 Vue 组件
      const attachComponents = (node) => {
        if (!node) return
        if (node.tabs) {
          node.tabs.forEach(tab => {
            if (tab.componentName && props.componentRegistry[tab.componentName]) {
              tab.component = props.componentRegistry[tab.componentName]
            }
          })
        }
        if (node.children) {
          node.children.forEach(attachComponents)
        }
      }
      
      if (parsed.dockbox) attachComponents(parsed.dockbox)
      if (parsed.floatbox) attachComponents(parsed.floatbox)
      
      layout.value = parsed
      layoutVersion.value++
    }
  } catch (e) {
    console.error('Failed to restore layout', e)
  }
}

onMounted(() => {
  restoreLayout()
})

// Auto-save when layout changes
// 布局变化时自动保存
watch(layout, () => {
  saveLayout()
}, { deep: true })

const updateLayout = (newLayout) => {
  layout.value = newLayout
  layoutVersion.value++
}

const onDockMove = (source, target, direction) => {
  const newLayout = dockMove(layout.value, source, target, direction)
  updateLayout(newLayout)
}

const findNode = (id) => find(layout.value, id)

// Gather all tabs for rendering and update cache
// 收集所有标签页用于渲染并更新缓存
const getAllTabs = (node) => {
    let tabs = []
    if (node.tabs) {
       tabs = [...node.tabs]
    }
    if (node.children) {
       for (const child of node.children) {
          tabs = [...tabs, ...getAllTabs(child)]
       }
    }
    return tabs
}

// Automatically update cache when layout changes
// 布局变化时自动更新缓存
watchEffect(() => {
    const tabs = getAllTabs(layout.value.dockbox)
    // Ensure all tabs are in cache
    // 确保所有标签页都在缓存中
    for (const tab of tabs) {
        if (!tabCache.value.has(tab.id) && tab.component) {
            tabCache.value.set(tab.id, tab.component)
        }
    }
    // Force reactivity update for template
    // 强制模板的响应式更新
    tabKeys.value = Array.from(tabCache.value.keys())
})

provide(DockContext, {
  layout,
  onDockMove,
  findNode,
  layoutVersion,
  getTabComponent: (id) => tabCache.value.get(id)
})

defineExpose({
  dockMove: onDockMove,
  find: findNode,
  updateLayout
})
</script>

<template>
  <div class="dock-layout">
    <DockBox v-if="layout.dockbox" :box-data="layout.dockbox" />
  </div>
</template>

<style>
.dock-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #1e1e1e;
  color: #ccc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>
