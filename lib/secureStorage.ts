import * as SecureStore from 'expo-secure-store'
import type { SupportedStorage } from '@supabase/supabase-js'

const memoryFallback = new Map<string, string>()

async function canUseSecureStore() {
  try {
    return await SecureStore.isAvailableAsync()
  } catch {
    return false
  }
}

export const secureStorage: SupportedStorage = {
  async getItem(key) {
    if (await canUseSecureStore()) {
      return SecureStore.getItemAsync(key)
    }

    return memoryFallback.get(key) ?? null
  },
  async setItem(key, value) {
    if (await canUseSecureStore()) {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      })
      return
    }

    memoryFallback.set(key, value)
  },
  async removeItem(key) {
    if (await canUseSecureStore()) {
      await SecureStore.deleteItemAsync(key)
      return
    }

    memoryFallback.delete(key)
  },
}
