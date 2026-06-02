import { inject, reactive, watch } from "vue";
import { getTabState, saveTabState } from "./DockData";

export function useTabState<T extends object>(
  initialState: T = {} as T,
): T {
  const tabId = inject<string>("dock-tab-id");

  if (!tabId) {
    console.warn("useTabState called outside of a DockTab");
    return reactive(initialState) as T;
  }

  const savedState = getTabState(tabId);
  for (const key in initialState) {
    if (savedState[key] === undefined) {
      savedState[key] = initialState[key as keyof T];
    }
  }

  const state = reactive(savedState) as T;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  watch(
    state,
    () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(saveTabState, 300);
    },
    { deep: true },
  );

  return state;
}
