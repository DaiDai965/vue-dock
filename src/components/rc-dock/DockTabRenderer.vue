<script setup lang="ts">
import { inject, provide } from 'vue'
import { DockContext } from './DockData'
import type { DockTab } from './types'

const props = defineProps<{
  tab: DockTab
}>()

const { getTabComponent } = inject(DockContext)!

// Provide the current Tab ID to the inner component
// 向内部组件提供当前标签页 ID
provide('dock-tab-id', props.tab.id)

</script>

<template>
  <component :is="getTabComponent(tab.id) || tab.component" />
</template>
