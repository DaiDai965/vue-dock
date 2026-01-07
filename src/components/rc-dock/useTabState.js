import { inject, reactive, watch, onMounted } from 'vue'
import { getTabState, saveTabState } from './DockData'

/**
 * Composition API for persistent tab state
 * 用于持久化标签页状态的组合式 API
 * 
 * @param {Object} initialState - Default state values (默认状态值)
 * @returns {Object} - Reactive state object that auto-saves (自动保存的响应式状态对象)
 */
export function useTabState(initialState = {}) {
  const tabId = inject('dock-tab-id')
  
  if (!tabId) {
    console.warn('useTabState called outside of a DockTab')
    return reactive(initialState)
  }
  
  // Get persistent state object from global store
  // 从全局存储获取持久化状态对象
  const savedState = getTabState(tabId)
  
  // Initialize default values if not present
  // 如果不存在则初始化默认值
  for (const key in initialState) {
      if (savedState[key] === undefined) {
          savedState[key] = initialState[key]
      }
  }
  
  // Create a reactive proxy directly to the saved state
  // 直接为保存的状态创建响应式代理
  const state = reactive(savedState)
  
  // Watch for changes and trigger save
  // 监听变化并触发保存
  watch(state, () => {
      saveTabState()
  }, { deep: true })
  
  return state
}
