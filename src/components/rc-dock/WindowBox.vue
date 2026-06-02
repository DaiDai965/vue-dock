<script setup lang="ts">
import WindowPanel from "./WindowPanel.vue";
import type { DockBox, DockPanel as DockPanelType } from "./types";

defineProps<{
  boxData: DockBox;
}>();

const isPanel = (child: DockBox | DockPanelType): child is DockPanelType => {
  return "tabs" in child;
};
</script>

<template>
  <WindowPanel
    v-for="child in boxData.children.filter(isPanel)"
    :key="child.id"
    :panel-data="child"
  />
</template>