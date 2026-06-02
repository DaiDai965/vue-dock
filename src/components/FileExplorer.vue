<script setup lang="ts">
import { markRaw } from "vue";
import { useDock } from "./rc-dock/DockData";
import HomeView from "../views/HomeView.vue";
import AboutView from "../views/AboutView.vue";
import SettingsView from "../views/SettingsView.vue";
import type { Component } from "vue";

interface FileEntry {
  name: string;
  title: string;
  component: Component;
}

const { addComponentTab } = useDock();

const files: FileEntry[] = [
  { name: "HomeView.vue", title: "Home", component: markRaw(HomeView) },
  { name: "AboutView.vue", title: "About", component: markRaw(AboutView) },
  { name: "SettingsView.vue", title: "Settings", component: markRaw(SettingsView) },
];

const onDoubleClick = (file: FileEntry) => {
  addComponentTab(file.name, file.component, {
    title: file.title,
    direction: "middle",
    closable: true,
  });
};
</script>

<template>
  <div class="file-explorer">
    <div class="header">VIEWS</div>
    <div class="file-list">
      <button
        v-for="file in files"
        :key="file.name"
        class="file-item"
        type="button"
        @dblclick="onDoubleClick(file)"
      >
        <span class="icon">[]</span>
        <span>{{ file.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.file-explorer {
  height: 100%;
  background: #252526;
  color: #cccccc;
  font-size: 13px;
}
.header {
  padding: 10px 20px;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.08em;
}
.file-list {
  display: flex;
  flex-direction: column;
}
.file-item {
  border: 0;
  background: transparent;
  color: inherit;
  padding: 4px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  text-align: left;
  font: inherit;
}
.file-item:hover {
  background-color: #2a2d2e;
}
.icon {
  margin-right: 6px;
  color: #7aa2f7;
}
</style>
