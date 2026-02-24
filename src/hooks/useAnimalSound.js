import soundData from '../data/animal_sounds.json'

const audioCache = {}

export function useAnimalSound() {
  const playSound = (animal) => {
    try {
      const isMuted = localStorage.getItem('animalGlobe_muted') === 'true'
      if (isMuted) return

      // Look up by animal ID first, then by category fallback
      const soundInfo =
        soundData.sounds[animal.id] ||
        soundData.categoryFallbacks[animal.category]

      if (!soundInfo?.url) return

      // Cache Audio objects to avoid re-creating them on every click
      if (!audioCache[soundInfo.url]) {
        audioCache[soundInfo.url] = new Audio(soundInfo.url)
        audioCache[soundInfo.url].volume = 0.6
      }

      const audio = audioCache[soundInfo.url]
      audio.currentTime = 0
      audio.play().catch(() => {
        // Silently ignore autoplay policy errors and network failures
      })
    } catch (e) {
      // Never crash the UI due to a sound failure
    }
  }

  return { playSound }
}
