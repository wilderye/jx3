<template>
  <div class="w-full max-w-3xl">
    <!-- Year Tabs -->
    <div
      class="mb-4 flex justify-center gap-8 border-b border-black/10 pb-4 text-lg tracking-widest select-none md:justify-start"
    >
      <button
        v-for="year in yearItems"
        :key="year"
        class="relative px-2 transition-opacity"
        :class="eventsYear === year ? 'opacity-100' : 'opacity-30 hover:opacity-60'"
        @click="setEventsYear(year)"
      >
        {{ year }}
        <div v-if="eventsYear === year" class="absolute right-0 -bottom-[17px] left-0 h-[2px] bg-black" />
      </button>
    </div>

    <!-- Sect Carousel & Content -->
    <EventCarousel
      :events="currentEvents"
      :active-index="activeEventIndex"
      :on-change="setActiveEventIndex"
      :year-key="eventsYear"
    />
  </div>
</template>

<script setup lang="ts">
import EventCarousel from './EventCarousel.vue';

const props = defineProps<{
  events: Record<string, Array<{ tag: string; content: string }>>;
  eventsYear: string;
  setEventsYear: (year: string) => void;
  activeEventIndex: number;
  setActiveEventIndex: (idx: number) => void;
}>();

const yearItems = ['往岁', '今岁', '来岁'];

const currentEvents = computed(() => props.events[props.eventsYear] || []);
</script>
