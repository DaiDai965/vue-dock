<script setup>
import { markRaw } from 'vue'
import DockLayout from './components/rc-dock/DockLayout.vue'
import FileExplorer from './components/FileExplorer.vue'
import HomeView from './views/HomeView.vue'
import AboutView from './views/AboutView.vue'
import SettingsView from './views/SettingsView.vue'

const componentRegistry = {
  'FileExplorer': markRaw(FileExplorer),
  'HomeView.vue': markRaw(HomeView),
  'AboutView.vue': markRaw(AboutView),
  'SettingsView.vue': markRaw(SettingsView)
}

const defaultLayout = {
  dockbox: {
    id: 'root-box',
    mode: 'horizontal',
    children: [
      {
        id: 'sidebar-panel',
        tabs: [
          { 
            id: 'explorer', 
            title: 'EXPLORER', 
            componentName: 'FileExplorer',
            component: markRaw(FileExplorer),
            closable: false // Prevent closing sidebar
          }
        ],
        activeId: 'explorer',
        size: 200
      },
      {
        id: 'editor-box',
        mode: 'horizontal',
        // size undefined means flex: 1
        children: [] // Start with empty editor area
      }
    ]
  }
}
</script>

<template>
  <div class="app-container">
    <DockLayout :default-layout="defaultLayout" :component-registry="componentRegistry" />
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  background-color: #1e1e1e;
  color: #cccccc;
  font-size: 13px;
}
</style>
