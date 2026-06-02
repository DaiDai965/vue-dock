<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { DropDirection, useDock } from "./DockData";
import DockDropEdge from "./DockDropEdge.vue";
import DockDropLayer from "./DockDropLayer.vue";
import DockTabs from "./DockTabs.vue";
import DockTabRenderer from "./DockTabRenderer.vue";
import { getDockDragData, type DockDragData } from "./dragdrop/DragManager";
import type { DockPanel, DropDirectionType, FloatPosition } from "./types";

const props = withDefaults(
  defineProps<{
    panelData: DockPanel;
    floating?: boolean;
  }>(),
  { floating: false },
);

const { findNode, getDockId, getGroup, onDockMove, setDropRect, useEdgeDrop } = useDock();
const dropZone = ref<DropDirectionType | null>(null);
const dragging = ref(false);
const panelRef = ref<HTMLElement | null>(null);

const activeTabId = computed(() => props.panelData.activeId ?? props.panelData.tabs[0]?.id);
const panelGroup = computed(() => getGroup(props.panelData.group));
const visitedTabIds = ref(new Set<string>());

const isPanelNode = (node: unknown): node is DockPanel => {
  return !!node && typeof node === "object" && Array.isArray((node as DockPanel).tabs);
};

watchEffect(() => {
  if (activeTabId.value) {
    visitedTabIds.value.add(activeTabId.value);
  }
});

const shouldRenderCachedTab = (tabId: string) => {
  return activeTabId.value === tabId || visitedTabIds.value.has(tabId);
};

const canDrop = (source: DockDragData, direction: DropDirectionType) => {
  const sourceGroup = getGroup(source.group);
  if (source.panelId === props.panelData.id && direction === DropDirection.MIDDLE) return false;
  if (panelGroup.value.disableDock && direction !== DropDirection.FLOAT) return false;
  if (source.tabId && sourceGroup.tabLocked && direction !== DropDirection.MIDDLE) return false;
  if (direction === DropDirection.FLOAT && sourceGroup.floatable === false) return false;
  if (
    direction === DropDirection.MIDDLE &&
    sourceGroup.floatable === "singleTab" &&
    props.panelData.parent?.mode === "float"
  ) {
    return false;
  }
  if (source.group && props.panelData.group && source.group !== props.panelData.group && direction === DropDirection.MIDDLE) return false;
  return true;
};

const floatPosition = (event: DragEvent): FloatPosition => {
  const rect = panelRef.value?.getBoundingClientRect();
  return {
    left: event.clientX - 160,
    top: Math.max(event.clientY - 20, 0),
    width: rect?.width ?? props.panelData.w ?? 320,
    height: rect?.height ?? props.panelData.h ?? 240,
  };
};

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  dragging.value = true;

  const rect = panelRef.value?.getBoundingClientRect();
  if (!rect) return;

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const threshold = 0.25;

  if (x < rect.width * threshold) dropZone.value = DropDirection.LEFT;
  else if (x > rect.width * (1 - threshold)) dropZone.value = DropDirection.RIGHT;
  else if (y < rect.height * threshold) dropZone.value = DropDirection.TOP;
  else if (y > rect.height * (1 - threshold)) dropZone.value = DropDirection.BOTTOM;
  else dropZone.value = DropDirection.MIDDLE;

  const source = getDockDragData(event, getDockId());
  setDropRect(panelRef.value, dropZone.value, props.panelData, event, source?.panelSize);
};

const onDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();

  const zone = dropZone.value;
  dropZone.value = null;
  dragging.value = false;
  setDropRect(null, DropDirection.REMOVE);

  if (!zone) return;
  const source = getDockDragData(event, getDockId());
  if (!source || !canDrop(source, zone)) return;

  const position = zone === DropDirection.FLOAT ? floatPosition(event) : undefined;
  if (source.tabId) onDockMove({ id: source.tabId, title: "" }, props.panelData.id, zone, position);
  else if (source.panelId) onDockMove({ id: source.panelId, tabs: [] }, props.panelData.id, zone, position);
};

const onDragLeave = () => {
  dropZone.value = null;
  dragging.value = false;
  setDropRect(null, DropDirection.REMOVE);
};

const onPanelPointerDown = () => {
  if (props.floating) {
    onDockMove(props.panelData, null, DropDirection.FRONT);
  }
};

const onPanelHeaderDragStart = (event: PointerEvent) => {
  if (!props.floating || event.button !== 0) return;
  event.stopPropagation();
  onDockMove(props.panelData, null, DropDirection.FRONT);

  const movingPanel = findNode(props.panelData.id);
  const panelData = isPanelNode(movingPanel) ? movingPanel : props.panelData;

  const startX = event.clientX;
  const startY = event.clientY;
  const initialX = panelData.x ?? 100;
  const initialY = panelData.y ?? 80;

  const onMove = (moveEvent: PointerEvent) => {
    panelData.x = initialX + moveEvent.clientX - startX;
    panelData.y = Math.max(0, initialY + moveEvent.clientY - startY);
  };

  const onUp = () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    onDockMove(panelData, null, DropDirection.MOVE);
  };

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
};

const onResizeStart = (event: PointerEvent) => {
  event.preventDefault();
  event.stopPropagation();
  onDockMove(props.panelData, null, DropDirection.FRONT);

  const resizingPanel = findNode(props.panelData.id);
  const panelData = isPanelNode(resizingPanel) ? resizingPanel : props.panelData;
  const startX = event.clientX;
  const startY = event.clientY;
  const initialW = panelData.w ?? panelRef.value?.offsetWidth ?? 320;
  const initialH = panelData.h ?? panelRef.value?.offsetHeight ?? 240;

  const onMove = (moveEvent: PointerEvent) => {
    panelData.w = Math.max(panelData.minWidth ?? 120, initialW + moveEvent.clientX - startX);
    panelData.h = Math.max(panelData.minHeight ?? 80, initialH + moveEvent.clientY - startY);
  };

  const onUp = () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    onDockMove(panelData, null, DropDirection.MOVE);
  };

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
};
</script>

<template>
  <div
    ref="panelRef"
    class="dock-panel"
    :class="{ 'dock-panel-float': floating }"
    :data-panel-id="panelData.id"
    tabindex="-1"
    @pointerdown="onPanelPointerDown"
    @dragover="onDragOver"
    @drop="onDrop"
    @dragleave="onDragLeave"
  >
    <DockTabs
      :panel-data="panelData"
      @start-panel-drag="onPanelHeaderDragStart"
    />

    <div class="dock-panel-content">
      <div
        v-for="tab in panelData.tabs"
        :key="tab.id"
        v-show="activeTabId === tab.id"
        class="dock-panel-tab-content"
      >
        <KeepAlive v-if="tab.cached !== false">
          <DockTabRenderer
            v-if="shouldRenderCachedTab(tab.id)"
            :key="tab.id"
            :tab="tab"
          />
        </KeepAlive>
        <DockTabRenderer
          v-else-if="activeTabId === tab.id"
          :key="tab.id"
          :tab="tab"
        />
      </div>
    </div>

    <DockDropEdge v-if="dragging && useEdgeDrop()" :panel-data="panelData" />
    <DockDropLayer v-else-if="dragging" :panel-data="panelData" />
    <div v-if="dropZone" :class="['dock-drop-layer', dropZone]"></div>
    <div v-if="floating" class="dock-panel-resize dock-panel-resize-br" @pointerdown="onResizeStart"></div>
  </div>
</template>

<style>
.dock-panel {
  display: flex;
  flex-direction: column;
  position: relative;
  background: #1e1e1e;
  border: 1px solid #333;
  overflow: hidden;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.dock-panel-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: #1e1e1e;
}
.dock-panel-tab-content {
  width: 100%;
  height: 100%;
}
.dock-drop-layer {
  position: absolute;
  inset: 0;
  z-index: 100;
  pointer-events: none;
  background: rgba(0, 128, 255, 0.3);
  transition: all 0.2s;
}
.dock-drop-layer.left { width: 30%; }
.dock-drop-layer.right { left: 70%; width: 30%; }
.dock-drop-layer.top { height: 30%; }
.dock-drop-layer.bottom { top: 70%; height: 30%; }
.dock-drop-layer.middle {
  left: 30%;
  right: 30%;
  top: 30%;
  bottom: 30%;
  background: rgba(0, 128, 255, 0.1);
}
.dock-drop-layer-grid,
.dock-drop-edge {
  position: absolute;
  inset: 0;
  z-index: 120;
}
.dock-drop-square {
  position: absolute;
  border: 1px solid rgba(0, 127, 212, 0.8);
  background: rgba(0, 127, 212, 0.14);
}
.dock-drop-top { left: 35%; top: 8%; width: 30%; height: 18%; }
.dock-drop-bottom { left: 35%; bottom: 8%; width: 30%; height: 18%; }
.dock-drop-left { left: 8%; top: 35%; width: 18%; height: 30%; }
.dock-drop-right { right: 8%; top: 35%; width: 18%; height: 30%; }
.dock-drop-middle { left: 38%; top: 38%; width: 24%; height: 24%; }
.dock-drop-float { right: 8%; top: 8%; width: 18%; height: 18%; }
.dock-panel-resize-br {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
  z-index: 2;
}
</style>
