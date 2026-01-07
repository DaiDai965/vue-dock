import { nextId, DropDirection } from './DockData'

/**
 * Deep clone utility
 * 深度克隆工具函数
 * @param {any} obj 
 * @returns {any}
 */
function clone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(clone)
  
  const copy = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Prevent deep cloning of Vue components or raw objects
      // 防止深度克隆 Vue 组件或原始对象
      if (key === 'component' || key === 'content' || key === 'icon') {
          copy[key] = obj[key]
      } else {
          copy[key] = clone(obj[key])
      }
    }
  }
  return copy
}

/**
 * Find a node in the layout by ID
 * 根据 ID 在布局中查找节点
 * @param {Object} layout - The layout root object (布局根对象)
 * @param {string} id - The node ID to find (要查找的节点 ID)
 * @param {Function} [filter] - Optional filter function (可选的过滤函数)
 * @returns {Object|undefined} - The found node or undefined (找到的节点或 undefined)
 */
export function find(layout, id, filter) {
  const result = findInBox(layout.dockbox, id, filter)
  if (result) return result
  if (layout.floatbox) {
     const floatResult = findInBox(layout.floatbox, id, filter)
     if (floatResult) return floatResult
  }
  return undefined
}

/**
 * Recursive search helper
 * 递归查找辅助函数
 */
function findInBox(box, id, filter) {
  if (!box) return undefined
  if (box.id === id && (!filter || filter(box))) return box
  
  if (box.children) {
    for (const child of box.children) {
      if (child.id === id && (!filter || filter(child))) return child
      if (child.tabs) {
        if (child.id === id && (!filter || filter(child))) return child
        const tab = child.tabs.find(t => t.id === id)
        if (tab && (!filter || filter(tab))) return tab
      } else {
        const result = findInBox(child, id, filter)
        if (result) return result
      }
    }
  }
  return undefined
}

/**
 * Update a tab's properties
 * 更新标签页属性
 */
export function updateTab(layout, id, newTab) {
  const tab = find(layout, id)
  if (!tab) return false
  Object.assign(tab, newTab)
  return true
}

/**
 * Main function to handle drag and drop moves
 * 处理拖拽移动的主要函数
 * 
 * @param {Object} layout - Current layout state (当前布局状态)
 * @param {Object} source - Source tab/panel being moved (被移动的源标签页/面板)
 * @param {Object} target - Target node/id to drop onto (放置的目标节点/ID)
 * @param {string} direction - Drop direction (e.g., 'left', 'right', 'middle', 'remove') (放置方向)
 * @returns {Object} - New layout state (新的布局状态)
 */
export function dockMove(layout, source, target, direction) {
  let currentLayout = clone(layout)
  
  // 1. Find and Remove Source
  // 1. 查找并移除源节点
  let sourceTab
  let sourcePanel
  
  // Helper to find parent panel of a tab
  // 查找标签页所属父面板的辅助函数
  const findParentPanel = (box, tabId) => {
    if (!box || !box.children) return null
    for (const child of box.children) {
       if (child.tabs) {
         if (child.tabs.find(t => t.id === tabId)) return child
       } else {
         const found = findParentPanel(child, tabId)
         if (found) return found
       }
    }
    return null
  }
  
  // If source has id, try to find it in layout
  // 如果源有 ID，尝试在布局中查找它
  if (source.id) {
     sourcePanel = findParentPanel(currentLayout.dockbox, source.id)
     if (!sourcePanel && currentLayout.floatbox) {
         sourcePanel = findParentPanel(currentLayout.floatbox, source.id)
     }
  }
  
  if (sourcePanel) {
    const idx = sourcePanel.tabs.findIndex(t => t.id === source.id)
    if (idx > -1) {
      sourceTab = sourcePanel.tabs[idx]
      sourcePanel.tabs.splice(idx, 1)
      
      if (sourcePanel.activeId === source.id) {
        sourcePanel.activeId = sourcePanel.tabs[0]?.id
      }
      
      // Cleanup empty panel
      // 清理空面板
      if (sourcePanel.tabs.length === 0) {
          removeNode(currentLayout.dockbox, sourcePanel.id)
          if (currentLayout.floatbox) removeNode(currentLayout.floatbox, sourcePanel.id)
      }
    }
  } else {
      sourceTab = { ...source }
  }
  
  // ALWAYS cleanup tree after any removal operation to ensure stability
  // Run multiple passes of cleanupTree until stable
  // 任何移除操作后始终清理树以确保稳定性
  // 运行多次 cleanupTree 直到稳定
  cleanupTreeRoot(currentLayout.dockbox)
  if (currentLayout.floatbox) cleanupTreeRoot(currentLayout.floatbox)
  
  // Special case: If editor-box itself was flattened (unlikely but safety check)
  // or if editor-box is missing, we might have a problem.
  // But cleanupTree preserves 'editor-box' ID.
  // 特殊情况：如果 editor-box 本身被扁平化（不太可能，但作为安全检查）
  // 或者如果 editor-box 丢失，可能会有问题。
  // 但是 cleanupTree 会保留 'editor-box' ID。
  
  if (!sourceTab && direction !== DropDirection.REMOVE) return layout 
  
  if (direction === DropDirection.REMOVE) return currentLayout
  
  let targetNode = find(currentLayout, target.id || target)
  
  if (!targetNode && direction !== DropDirection.FLOAT) {
      // If no target and not float, maybe append to root?
      // For now, return as is
      // 如果没有目标且不是浮动，可能追加到根？
      // 目前保持原样返回
      return currentLayout
  }
  
  if (direction === DropDirection.FLOAT) {
     // Handle float (simplified)
     // Create a float panel
     // 处理浮动（简化版）
     return currentLayout
  }
  
  if (direction === DropDirection.MIDDLE || direction === DropDirection.CENTER) {
      // Drop into existing tabs
      // 放入现有的标签页中
      if (targetNode.tabs) {
          targetNode.tabs.push(sourceTab)
          targetNode.activeId = sourceTab.id
      } else if (targetNode.children) {
          // If dropping into a box (empty or not), create a panel inside it
          // 如果放入一个盒子（无论是否为空），在其中创建一个面板
          const newPanel = {
            id: nextId(),
            tabs: [sourceTab],
            activeId: sourceTab.id,
            // size undefined allows flex: 1 behavior for equal distribution
            // size undefined 允许 flex: 1 行为以实现均匀分布
            size: undefined
          }
          targetNode.children.push(newPanel)
      }
  } else {
      // Split layout
      // 分割布局
      const parentBox = findParentBox(currentLayout.dockbox, targetNode.id) || 
                        (currentLayout.floatbox ? findParentBox(currentLayout.floatbox, targetNode.id) : null)
      
      if (parentBox) {
         const newPanel = {
             id: nextId(),
             tabs: [sourceTab],
             activeId: sourceTab.id,
             // size undefined allows flex: 1 behavior for equal distribution
             // size undefined 允许 flex: 1 行为以实现均匀分布
             size: undefined, 
             group: sourceTab.group // Propagate group (传递分组)
         }
         
         const reqMode = (direction === DropDirection.LEFT || direction === DropDirection.RIGHT) ? 'horizontal' : 'vertical'
         const isFirst = (direction === DropDirection.LEFT || direction === DropDirection.TOP)
         
         if (parentBox.mode === reqMode) {
             // Same direction, just insert
             // 方向相同，直接插入
             const idx = parentBox.children.indexOf(targetNode)
             parentBox.children.splice(isFirst ? idx : idx + 1, 0, newPanel)
             
             // Also reset targetNode size to undefined to ensure they share space equally
             // 同时将 targetNode 大小重置为 undefined 以确保它们平分空间
             targetNode.size = undefined
         } else {
             // Different direction, wrap in new box
             // 方向不同，包裹在新盒子中
             const newBox = {
                 id: nextId(),
                 mode: reqMode,
                 children: isFirst ? [newPanel, targetNode] : [targetNode, newPanel],
                 size: targetNode.size
             }
             const idx = parentBox.children.indexOf(targetNode)
             parentBox.children[idx] = newBox
             // Reset target size to flex 1 inside new box?
             // 在新盒子中重置目标大小为 flex 1？
             targetNode.size = undefined 
         }
      } else if (targetNode === currentLayout.dockbox) {
          // Root split
          // 根节点分割
          const newPanel = {
            id: nextId(),
            tabs: [sourceTab],
            activeId: sourceTab.id,
            size: undefined
          }
           const reqMode = (direction === DropDirection.LEFT || direction === DropDirection.RIGHT) ? 'horizontal' : 'vertical'
           const isFirst = (direction === DropDirection.LEFT || direction === DropDirection.TOP)
           
           if (currentLayout.dockbox.mode === reqMode) {
                currentLayout.dockbox.children.splice(isFirst ? 0 : currentLayout.dockbox.children.length, 0, newPanel)
           } else {
                const newChildBox = {
                    id: nextId(),
                    mode: currentLayout.dockbox.mode,
                    children: currentLayout.dockbox.children,
                    size: undefined // Was 100, but root children should probably be flex? Or keep 100%?
                }
                // Actually root box children size depends on root box mode.
                // But newChildBox is inside dockbox. 
                
                currentLayout.dockbox.mode = reqMode
                currentLayout.dockbox.children = isFirst ? [newPanel, newChildBox] : [newChildBox, newPanel]
           }
      }
  }
  
  return currentLayout
}

/**
 * Find parent box of a child ID
 * 查找子 ID 的父盒子
 */
function findParentBox(box, childId) {
  if (!box || !box.children) return null
  for (const child of box.children) {
    if (child.id === childId) return box
    const result = findParentBox(child, childId)
    if (result) return result
  }
  return null
}

/**
 * Remove a node from the tree
 * 从树中移除节点
 */
function removeNode(box, childId) {
  if (!box || !box.children) return false
  const idx = box.children.findIndex(c => c.id === childId)
  if (idx > -1) {
    box.children.splice(idx, 1)
    return true
  }
  
  for (let i = 0; i < box.children.length; i++) {
     if (removeNode(box.children[i], childId)) {
        // We don't remove empty parent here, we let cleanupTree handle it
        // 我们不在这里移除空父节点，让 cleanupTree 处理
     }
  }
  return false
}

/**
 * Clean up the layout tree (remove empty boxes, flatten nested boxes)
 * 清理布局树（移除空盒子，扁平化嵌套盒子）
 * @param {Object} box - The box to clean (要清理的盒子)
 * @returns {boolean} - Whether any changes were made (是否发生了更改)
 */
function cleanupTree(box) {
  if (!box || !box.children) return false // Return boolean indicating if changes were made

  let changed = false
  
  // We need to loop because modifying array indices can mess up iteration, 
  // and one change might enable another.
  // But a simple recursive approach that returns 'changed' and re-runs is safer.
  // 我们需要循环，因为修改数组索引会打乱迭代，
  // 并且一个更改可能会启用另一个更改。
  // 但是简单的递归方法返回 'changed' 并重新运行更安全。
  
  // Let's use a simple robust loop over children
  // 让我们使用一个简单的健壮循环遍历子节点
  for (let i = 0; i < box.children.length; i++) {
    const child = box.children[i]
    
    if (child.children) {
        // Recurse first
        // 先递归
        if (cleanupTree(child)) {
            changed = true
        }
        
        if (child.children.length === 0) {
            if (child.id === 'editor-box') {
                // Keep editor-box
                // 保留 editor-box
            } else {
                box.children.splice(i, 1)
                i--
                changed = true
            }
        } else if (child.children.length === 1) {
            if (child.id === 'editor-box') {
                const grandChild = child.children[0]
                if (grandChild.children) { // grandChild is a Box
                     // Merge Box into editor-box
                     // 将盒子合并到 editor-box 中
                     child.mode = grandChild.mode
                     child.children = grandChild.children
                     changed = true
                     // We modified child, so we should re-evaluate this child (now grandChild content)
                     // But simplest is to just flag changed=true and let the caller re-run if needed
                     // Or decrement i? No, child is still at i.
                     // But child's children changed. 
                     // We should continue processing this node?
                     // Actually, if we merged, child.children IS grandChild.children.
                     // We might need to recurse on it again?
                     // Let's just set changed=true.
                     // 我们修改了 child，所以应该重新评估这个 child（现在是 grandChild 内容）
                     // 但最简单的方法是标记 changed=true，让调用者根据需要重新运行
                }
            } else {
                const grandChild = child.children[0]
                // Preserve size if it exists, otherwise inherit from child
                // 如果存在大小则保留，否则从子节点继承
                if (child.size !== undefined) grandChild.size = child.size
                
                box.children[i] = grandChild
                changed = true
            }
        }
    }
  }
  return changed
}

// Wrapper to run until stable
// 运行直到稳定的包装器
function cleanupTreeRoot(box) {
    let maxLoops = 10
    while (cleanupTree(box) && maxLoops > 0) {
        maxLoops--
    }
}
