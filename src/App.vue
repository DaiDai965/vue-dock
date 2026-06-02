<script setup lang="ts">
import { markRaw, onMounted, onUnmounted } from "vue";
import type { Component } from "vue";
import DockLayout from "./components/rc-dock/DockLayout.vue";
import FileExplorer from "./components/FileExplorer.vue";
import HomeView from "./views/HomeView.vue";
import AboutView from "./views/AboutView.vue";
import SettingsView from "./views/SettingsView.vue";
import type { LayoutData, TabGroup } from "./components/rc-dock/types";

const preventContextMenu = (event: MouseEvent) => {
  event.preventDefault();
};

onMounted(() => {
  document.addEventListener("contextmenu", preventContextMenu);
});

onUnmounted(() => {
  document.removeEventListener("contextmenu", preventContextMenu);
});

const componentRegistry: Record<string, Component> = {
  FileExplorer: markRaw(FileExplorer),
  "HomeView.vue": markRaw(HomeView),
  "AboutView.vue": markRaw(AboutView),
  "SettingsView.vue": markRaw(SettingsView),
};

const groups: Record<string, TabGroup> = {
  navigation: { floatable: false, maximizable: false },
  editor: { floatable: true, maximizable: true, newWindow: true },
  tools: { floatable: true, maximizable: true },
};

const defaultLayout: LayoutData = {
  dockbox: {
    id: "root-box",
    mode: "horizontal",
    children: [
      {
        id: "sidebar-panel",
        group: "navigation",
        size: 220,
        tabs: [
          {
            id: "explorer",
            title: "EXPLORER",
            componentName: "FileExplorer",
            component: markRaw(FileExplorer),
            closable: false,
            group: "navigation",
          },
        ],
        activeId: "explorer",
      },
      {
        id: "editor-box",
        mode: "vertical",
        children: [
          {
            id: "main-editor-panel",
            group: "editor",
            tabs: [
              {
                id: "home-start",
                title: "Home",
                componentName: "HomeView.vue",
                component: markRaw(HomeView),
                closable: true,
                group: "editor",
              },
              {
                id: "about-start",
                title: "About",
                componentName: "AboutView.vue",
                component: markRaw(AboutView),
                closable: true,
                group: "editor",
              },
            ],
            activeId: "home-start",
          },
          {
            id: "tool-panel",
            group: "tools",
            size: 190,
            tabs: [
              {
                id: "settings-start",
                title: "Settings",
                componentName: "SettingsView.vue",
                component: markRaw(SettingsView),
                closable: true,
                group: "tools",
              },
            ],
            activeId: "settings-start",
          },
        ],
      },
    ],
  },
  floatbox: {
    id: "floatbox",
    mode: "float",
    children: [],
  },
  windowbox: {
    id: "windowbox",
    mode: "window",
    children: [],
  },
  maxbox: {
    id: "maxbox",
    mode: "maximize",
    children: [],
  },
};
</script>

<template>
  <div class="app-container">
    <DockLayout
      dock-id="demo-dock"
      :default-layout="defaultLayout"
      :component-registry="componentRegistry"
      :groups="groups"
      drop-mode="default"
    />
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