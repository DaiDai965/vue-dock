<script setup lang="ts">
import { shallowRef } from "vue";
import DockPanel from "./DockPanel.vue";
import Divider from "./Divider.vue";
import { DropDirection, useDock } from "./DockData";
import type {
  DockBox as DockBoxType,
  DockPanel as DockPanelType,
} from "./types";

const props = defineProps<{
  boxData: DockBoxType;
}>();

// Type guard to distinguish panel nodes
// 用于区分面板节点的类型守卫
const isPanel = (item: DockBoxType | DockPanelType): item is DockPanelType => {
  return "tabs" in item;
};

const boxRef = shallowRef<HTMLElement | null>(null);
const { onSilentChange } = useDock();

const childMinSize = (child: DockBoxType | DockPanelType) => {
  return props.boxData.mode === "horizontal"
    ? child.minWidth ?? 30
    : child.minHeight ?? 30;
};

const childFlex = (child: DockBoxType | DockPanelType) => {
  if (typeof child.size === "number") return `0 0 ${child.size}px`;
  if (child.size) return child.size;
  return props.boxData.mode === "horizontal"
    ? child.widthFlex ?? 1
    : child.heightFlex ?? 1;
};

const childStyle = (child: DockBoxType | DockPanelType) => ({
  flex: childFlex(child),
  overflow: "hidden",
});

// Start drag resize between two siblings
// 开始拖拽调整相邻面板大小
const onResizeStart = (index: number, e: MouseEvent) => {
  const box = boxRef.value;
  if (!box) return;

  const children = Array.from(box.children).filter(
    (c) => !c.classList.contains("dock-divider"),
  );
  const prevEl = children[index];
  const nextEl = children[index + 1];

  if (!prevEl || !nextEl) return;

  const prevItem = props.boxData.children[index];
  const nextItem = props.boxData.children[index + 1];

  // Get initial sizes
  const isHorizontal = props.boxData.mode === "horizontal";
  const startX = e.clientX;
  const startY = e.clientY;

  const prevRect = prevEl.getBoundingClientRect();
  const nextRect = nextEl.getBoundingClientRect();

  const startPrevSize = isHorizontal ? prevRect.width : prevRect.height;
  const startNextSize = isHorizontal ? nextRect.width : nextRect.height;

  // Convert to explicit pixels if currently flex
  if (!prevItem.size) prevItem.size = startPrevSize;
  if (!nextItem.size) nextItem.size = startNextSize;

  const handleMove = (e: MouseEvent) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const delta = isHorizontal ? dx : dy;

    const newPrevSize = startPrevSize + delta;
    const newNextSize = startNextSize - delta;

    if (newPrevSize >= childMinSize(prevItem) && newNextSize >= childMinSize(nextItem)) {
      prevItem.size = newPrevSize;
      nextItem.size = newNextSize;
    }
  };

  const handleUp = () => {
    document.removeEventListener("mousemove", handleMove);
    document.removeEventListener("mouseup", handleUp);
    onSilentChange(undefined, DropDirection.MOVE);
  };

  document.addEventListener("mousemove", handleMove);
  document.addEventListener("mouseup", handleUp);
};
</script>

<template>
  <div class="dock-box" :class="'dock-box-' + boxData.mode" ref="boxRef">
    <template v-for="(child, index) in boxData.children" :key="child.id">
      <DockBox
        v-if="!isPanel(child)"
        :box-data="child"
        :style="childStyle(child)"
      />
      <DockPanel
        v-else
        :panel-data="child"
        :style="childStyle(child)"
      />

      <Divider
        v-if="index < boxData.children.length - 1"
        :mode="boxData.mode || 'horizontal'"
        @start-resize="(e) => onResizeStart(index, e)"
      />
    </template>
  </div>
</template>

<style>
.dock-box {
  display: flex;
  width: 100%;
  height: 100%;
}
.dock-box-vertical {
  flex-direction: column;
}
.dock-box-horizontal {
  flex-direction: row;
}
</style>
