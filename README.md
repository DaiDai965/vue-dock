# Vue Dock Layout / Vue 停靠布局系统

A high-performance, flexible dock layout system for Vue 3, inspired by Visual Studio Code. It allows you to build complex IDE-like interfaces with ease.

一个基于 Vue 3 的高性能、灵活的停靠布局系统，灵感来源于 Visual Studio Code。它可以让你轻松构建类似 IDE 的复杂界面。

## Features / 特性

- **Flexible Layout / 灵活布局**: Supports unlimited nesting of horizontal and vertical split containers.
  - **无限嵌套**: 支持水平和垂直分割容器的无限嵌套。
- **Drag & Drop / 拖拽支持**: Intuitive drag-and-drop interface to move tabs, reorder them, or create new split panels.
  - **拖拽交互**: 直观的拖拽界面，可移动标签页、重新排序或创建新的拆分面板。
- **State Persistence / 状态持久化**: Automatically saves and restores the layout structure and internal state of components (via `useTabState`).
  - **状态保持**: 自动保存和恢复布局结构以及组件的内部状态（通过 `useTabState`）。
- **Resizable / 可调整大小**: Draggable splitters to resize panels.
  - **调整尺寸**: 可拖动的分割线以调整面板大小。
- **Customizable / 可定制**: Fully customizable tab components and content.
  - **高度定制**: 完全可定制的标签页组件和内容。

## Getting Started / 快速开始

### Installation / 安装

```bash
npm install
```

### Run Development Server / 运行开发服务器

```bash
npm run dev
```

## Usage / 使用说明

### Basic Layout / 基本布局

```vue
<script setup>
import DockLayout from './components/rc-dock/DockLayout.vue'

const defaultLayout = {
  mode: 'horizontal',
  children: [
    {
      mode: 'vertical',
      size: 200,
      children: [
        { tabs: [{ id: 'explorer', title: 'Explorer', component: 'FileExplorer' }] }
      ]
    },
    {
      tabs: [{ id: 'welcome', title: 'Welcome', component: 'HelloWorld' }]
    }
  ]
}
</script>

<template>
  <DockLayout :default-layout="defaultLayout" />
</template>
```

### Component State Persistence / 组件状态持久化

Use the `useTabState` composable to persist state within your dockable components.
使用 `useTabState` 组合式函数在可停靠组件中持久化状态。

```javascript
import { useTabState } from '../rc-dock/useTabState'

// This state will be saved to localStorage and restored automatically
// 此状态将保存到 localStorage 并自动恢复
const state = useTabState({
  count: 0,
  query: ''
})
```

## Project Structure / 项目结构

- `src/components/rc-dock/`: Core library files (核心库文件)
  - `DockLayout.vue`: Main container (主容器)
  - `DockBox.vue`: Recursive layout node (递归布局节点)
  - `DockTabs.vue`: Tab header container (标签页头部容器)
  - `Algorithm.js`: Layout manipulation logic (布局操作逻辑)
  - `useTabState.js`: State persistence hook (状态持久化钩子)

## License / 许可

MIT
