<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { DropDirection, useDock } from "./DockData";
import DockPanel from "./DockPanel.vue";
import type { DockPanel as DockPanelType } from "./types";

const props = defineProps<{
  panelData: DockPanelType;
}>();

const container = ref<HTMLElement | null>(null);
const { getRootElement, onDockMove } = useDock();
let panelWindow: Window | null = null;
let closingFromUnmount = false;

const windowFloatPosition = () => {
  const rootRect = getRootElement()?.getBoundingClientRect();
  const opener = window;
  const popup = panelWindow;

  if (!popup) {
    return {
      left: props.panelData.x ?? 120,
      top: props.panelData.y ?? 80,
      width: props.panelData.w ?? 640,
      height: props.panelData.h ?? 480,
    };
  }

  return {
    left: Math.max((popup.screenX - opener.screenX) - (rootRect?.left ?? 0), 0),
    top: Math.max((popup.screenY - opener.screenY) - (rootRect?.top ?? 0), 0),
    width: popup.innerWidth || props.panelData.w || 640,
    height: popup.innerHeight || props.panelData.h || 480,
  };
};

const moveBackToFloat = () => {
  if (closingFromUnmount) return;
  onDockMove(props.panelData, null, DropDirection.FLOAT, windowFloatPosition());
};

onMounted(() => {
  if (typeof window === "undefined") return;
  panelWindow = window.open("", props.panelData.id, `width=${props.panelData.w ?? 640},height=${props.panelData.h ?? 480},left=${props.panelData.x ?? 120},top=${props.panelData.y ?? 80}`);
  if (!panelWindow) {
    moveBackToFloat();
    return;
  }
  panelWindow.document.title = String(props.panelData.activeId ?? props.panelData.id);
  for (const styleNode of Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))) {
    panelWindow.document.head.appendChild(styleNode.cloneNode(true));
  }
  panelWindow.document.body.style.margin = "0";
  const mount = panelWindow.document.createElement("div");
  mount.style.width = "100vw";
  mount.style.height = "100vh";
  panelWindow.document.body.appendChild(mount);
  container.value = mount;
  panelWindow.addEventListener("beforeunload", moveBackToFloat);
});

onBeforeUnmount(() => {
  closingFromUnmount = true;
  panelWindow?.removeEventListener("beforeunload", moveBackToFloat);
  panelWindow?.close();
  panelWindow = null;
});
</script>

<template>
  <Teleport v-if="container" :to="container">
    <DockPanel :panel-data="panelData" />
  </Teleport>
</template>
