<template>
  <div>
    <!-- Character Section container -->
    <div
      class="relative z-10 mb-16 flex flex-col items-center gap-8 md:mt-6 md:mb-24 md:flex-row md:items-start md:gap-16"
    >
      <!-- Character Switcher -->
      <div class="z-10 flex items-center gap-4 md:gap-6">
        <button class="p-2 text-3xl opacity-20 transition-opacity select-none hover:opacity-100" @click="prevChar">
          〈
        </button>
        <div class="relative flex h-[220px] w-20 items-center justify-center md:h-[300px] md:w-24">
          <Transition name="char-name" mode="out-in">
            <div
              :key="activeChar.name"
              :class="
                'absolute leading-none tracking-[0.2em] font-medium select-none writing-vertical-rl ' +
                nameSize.mobile +
                ' ' +
                nameSize.desktop
              "
            >
              {{ activeChar.name }}
            </div>
          </Transition>
        </div>
        <button class="p-2 text-3xl opacity-20 transition-opacity select-none hover:opacity-100" @click="nextChar">
          〉
        </button>
      </div>

      <!-- Character Details & Affairs -->
      <div
        class="relative z-10 flex min-h-[170px] w-full max-w-md flex-col justify-start md:min-h-[280px] md:justify-center"
      >
        <Transition name="char-details" mode="out-in">
          <div
            :key="activeChar.name"
            class="absolute flex w-full flex-col items-center gap-3 text-base tracking-widest opacity-80 select-none md:items-start md:gap-4 md:text-xl"
          >
            <div class="flex items-center gap-4">
              <span>{{ trustStageName }}</span>
              <span class="font-serif text-xl md:text-2xl">{{ activeChar.trust }}</span>
            </div>
            <div>{{ activeChar.sect }}</div>
            <div>{{ activeChar.relationship }}</div>

            <div
              v-if="activeChar.affairs && activeChar.affairs.length > 0"
              class="scroll-fade-mask mt-4 flex max-h-[100px] flex-col items-center gap-1 overflow-y-auto px-4 text-center text-sm tracking-wider opacity-70 md:mt-6 md:max-h-[130px] md:items-start md:gap-2 md:px-0 md:text-left md:text-base"
            >
              <div v-for="(affair, idx) in activeChar.affairs" :key="idx" class="flex items-start gap-1">
                <span class="opacity-40 select-none"> · </span>
                <span>
                  {{ affair.content }}
                  <span class="ml-2 text-xs opacity-50 md:text-sm"> {{ affair.timeLimit }} | {{ affair.status }} </span>
                </span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Affair {
  content: string;
  timeLimit: string;
  status: string;
}

interface Character {
  name: string;
  trust: number;
  sect: string;
  relationship: string;
  affairs: Affair[];
}

const props = defineProps<{
  activeChar: Character;
  prevChar: () => void;
  nextChar: () => void;
}>();

// 动态字号
function getNameSize(name: string) {
  const len = name.length;
  if (len <= 3) return { mobile: 'text-[60px]', desktop: 'md:text-[80px]' };
  if (len === 4) return { mobile: 'text-[45px]', desktop: 'md:text-[62px]' };
  if (len === 5) return { mobile: 'text-[36px]', desktop: 'md:text-[50px]' };
  if (len === 6) return { mobile: 'text-[30px]', desktop: 'md:text-[42px]' };
  return { mobile: 'text-[26px]', desktop: 'md:text-[36px]' };
}

const nameSize = computed(() => getNameSize(props.activeChar.name));

// 信赖阶段名称映射（-100 ~ 100，左闭右开，共 10 阶）
function getTrustStageName(trust: number): string {
  const t = Math.max(-100, Math.min(100, trust));
  if (t < -80) return '血海深仇';
  if (t < -60) return '势若水火';
  if (t < -40) return '冷眼相待';
  if (t < -20) return '形同陌路';
  if (t < 0) return '泛泛之交';
  if (t < 20) return '萍水相逢';
  if (t < 40) return '相谈甚欢';
  if (t < 60) return '引为知己';
  if (t < 80) return '八拜之交';
  return '生死相托';
}
const trustStageName = computed(() => getTrustStageName(props.activeChar.trust));
</script>
