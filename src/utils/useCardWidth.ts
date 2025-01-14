import {computed, onMounted, onUnmounted, ref} from 'vue'

export function useCardWidth() {
    const windowWidth = ref(window.innerWidth)

    const cardWidth = computed(() => {
        if (windowWidth.value <= 800) {
            return `${windowWidth.value - 32}px` // 手機版減去 padding 和邊距
        }
        return '800px' // 桌面版固定寬度
    })

    const handleResize = () => {
        windowWidth.value = window.innerWidth
    }

    onMounted(() => {
        window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', handleResize)
    })

    return {cardWidth}
}
