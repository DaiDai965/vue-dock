<script setup lang="ts">
import DockPanel from "./DockPanel.vue";
import type { DockBox, DockPanel as DockPanelType } from "./types";

const props = defineProps<{
  boxData: DockBox;
}>();

const isPanel = (child: DockBox | DockPanelType): child is DockPanelType => {
  return "tabs" in child;
};

const panelStyle = (panel: DockPanelType) => ({
  left: `${panel.x ?? 100}px`,
  top: `${panel.y ?? 80}px`,
  width: `${panel.w ?? 320}px`,
  height: `${panel.h ?? 240}px`,
  zIndex: panel.z ?? 1,
});
</script>

<template>
  <div class="dock-box dock-fbox">
    <DockPanel
      v-for="child in props.boxData.children.filter(isPanel)"
      :key="child.id"
      :panel-data="child"
      :style="panelStyle(child)"
      floating
    />
  </div>
</template>

<style>
.dock-fbox {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.dock-fbox > .dock-panel {
  position: absolute;
  pointer-events: auto;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}
</style>