<script lang="ts">
import { defineComponent, h, isVNode, provide } from "vue";
import { useDock } from "./DockData";
import type { DockTab } from "./types";

export default defineComponent({
  name: "DockTabRenderer",
  props: {
    tab: {
      type: Object as () => DockTab,
      required: true,
    },
  },
  setup(props) {
    const { getTabComponent } = useDock();
    provide("dock-tab-id", props.tab.id);

    return () => {
      const component = getTabComponent(props.tab.id) || props.tab.component;
      if (component) return h(component);

      const content = typeof props.tab.content === "function"
        ? (props.tab.content as (tab: DockTab) => unknown)(props.tab)
        : props.tab.content;

      if (isVNode(content)) return content;
      if (typeof content === "object" && content) return h(content as any);
      return h("div", { class: "dock-tab-empty" }, content == null ? undefined : String(content));
    };
  },
});
</script>
