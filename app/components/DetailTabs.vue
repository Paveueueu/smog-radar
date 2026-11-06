<script setup lang="ts">
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import type { AirReport } from '#shared/types/air'
import type { Assessment } from '~/utils/verdict'

// One detail section at a time, instead of everything stacked down the page.
defineProps<{ report: AirReport, assessment: Assessment }>()
const { t } = useI18n()

const TABS = ['forecast', 'pollutants'] as const
const active = ref<(typeof TABS)[number]>('forecast')
</script>

<template>
  <TabsRoot v-model="active" class="rounded-card border border-line bg-surface shadow-card">
    <TabsList :aria-label="t('tabs.label')" class="relative flex gap-1 border-b border-line px-3 sm:px-4">
      <TabsIndicator
        class="absolute bottom-0 left-0 h-0.5 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position) rounded-full bg-ink transition-[width,translate] duration-200 motion-reduce:transition-none"
      />
      <TabsTrigger
        v-for="tab in TABS"
        :key="tab"
        :value="tab"
        class="cursor-pointer px-2 py-3 text-sm font-medium text-muted hover:text-ink data-[state=active]:text-ink"
      >
        {{ t(`tabs.${tab}`) }}
      </TabsTrigger>
    </TabsList>

    <TabsContent value="forecast" class="p-4 focus-visible:outline-offset-[-3px] sm:p-5">
      <ForecastTimeline :report="report" :assessment="assessment" />
    </TabsContent>
    <TabsContent value="pollutants" class="p-4 focus-visible:outline-offset-[-3px] sm:p-5">
      <PollutantBreakdown :sample="report.current" />
    </TabsContent>
  </TabsRoot>
</template>
