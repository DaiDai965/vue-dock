import type { InjectionKey } from 'vue'
import type { DropDirectionType, TabState, DockContextType } from './types'

export const DockContext: InjectionKey<DockContextType> = Symbol('DockContext')
export const DockProvider: InjectionKey<any> = Symbol('DockProvider')

/**
 * Drop directions
 * 放置方向枚举
 */
export const DropDirection: Record<string, DropDirectionType> = {
  LEFT: 'left',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  TOP: 'top',
  MIDDLE: 'middle',
  REMOVE: 'remove',
  BEFORE: 'before',
  AFTER: 'after',
  FLOAT: 'float',
  FRONT: 'front',
  MAXIMIZE: 'maximize',
  NEW_WINDOW: 'new-window',
  MOVE: 'move', // Special internal (内部特殊状态)
  ACTIVE: 'active', // Special internal (内部特殊状态)
  UPDATE: 'update' // Special internal (内部特殊状态)
}

export const LayoutType = {
  Box: 'box',
  Panel: 'panel'
}

// Global state storage for tabs
// 标签页的全局状态存储
const tabStateStorage = new Map<string, TabState>()

// Load initial state
// 加载初始状态
try {
    const saved = localStorage.getItem('dock-state')
    if (saved) {
        const parsed = JSON.parse(saved)
        for (const [key, value] of Object.entries(parsed)) {
            tabStateStorage.set(key, value as TabState)
        }
    }
} catch(e) {
    console.error('Failed to load dock state', e)
}

/**
 * Save all tab states to localStorage
 * 保存所有标签页状态到 localStorage
 */
export function saveTabState() {
    try {
        const obj = Object.fromEntries(tabStateStorage)
        localStorage.setItem('dock-state', JSON.stringify(obj))
    } catch(e) {
        console.error('Failed to save dock state', e)
    }
}

/**
 * Get state object for a specific tab
 * 获取指定标签页的状态对象
 * @param {string} tabId 
 * @returns {Object}
 */
export function getTabState(tabId: string): TabState {
    if (!tabStateStorage.has(tabId)) {
        tabStateStorage.set(tabId, {})
    }
    return tabStateStorage.get(tabId)!
}

/**
 * Generate a random ID
 * 生成随机 ID
 */
export function nextId(): string {
  return 'dock-' + Math.random().toString(36).substr(2, 9)
}
