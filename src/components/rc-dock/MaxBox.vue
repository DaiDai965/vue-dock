<script setup lang="ts">
import DockPanel from "./DockPanel.vue";
import type { DockBox, DockPanel as DockPanelType } from "./types";

const props = defineProps<{
  boxData: DockBox;
}>();

const panel = () => props.boxData.children.find((child): child is DockPanelType => "tabs" in child);
</script>

<template>
  <div class="dock-box dock-mbox" :class="{ 'dock-mbox-show': panel() }">
    <DockPanel v-if="panel()" :panel-data="panel()!" />
  </div>
</template>

<style>
.dock-mbox {
  position: absolute;
  inset: 0;
  z-index: 1000;
  background: #1e1e1e;
}
.dock-mbox:not(.dock-mbox-show) {
  display: none;
}
</style>