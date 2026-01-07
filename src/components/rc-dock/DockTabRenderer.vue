<script setup>
import { inject, provide, toRef } from 'vue'
import { DockContext } from './DockData'

const props = defineProps({
  tab: {
    type: Object,
    required: true
  }
})

const { getTabComponent } = inject(DockContext)

// Provide the current Tab ID to the inner component
provide('dock-tab-id', props.tab.id)

</script>

<template>
  <component :is="getTabComponent(tab.id) || tab.component" />
</template>
