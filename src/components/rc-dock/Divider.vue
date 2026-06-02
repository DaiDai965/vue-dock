<script setup lang="ts">
defineProps<{
  mode: string;
}>();

const emit = defineEmits<{
  (event: "start-resize", mouseEvent: MouseEvent): void;
}>();

const onMouseDown = (event: MouseEvent) => {
  event.preventDefault();
  emit("start-resize", event);
};
</script>

<template>
  <div
    class="dock-divider"
    :class="'dock-divider-' + mode"
    @mousedown="onMouseDown"
  />
</template>

<style>
.dock-divider {
  background: #1e1e1e;
  z-index: 1;
  position: relative;
}
.dock-divider-horizontal {
  width: 4px;
  cursor: col-resize;
  border-left: 1px solid #333;
  border-right: 1px solid #333;
}
.dock-divider-vertical {
  height: 4px;
  cursor: row-resize;
  border-top: 1px solid #333;
  border-bottom: 1px solid #333;
}
.dock-divider:hover {
  background: #007fd4;
}
</style>