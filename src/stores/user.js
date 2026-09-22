import { defineStore } from 'pinia'
import { read, write } from '@/utils/storage'

const KEY = 'user'

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: read(KEY, { name: '我的家庭', avatar: '👨‍👩‍👧', points: 0 }),
  }),

  getters: {
    name: (state) => state.profile.name,
    avatar: (state) => state.profile.avatar,
    points: (state) => state.profile.points,
  },

  actions: {
    persist() {
      write(KEY, this.profile)
    },
    setName(name) {
      this.profile.name = name
      this.persist()
    },
    setAvatar(avatar) {
      this.profile.avatar = avatar
      this.persist()
    },
    addPoints(n) {
      this.profile.points += n
      this.persist()
    },
  },
})
