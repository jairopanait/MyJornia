import * as SecureStore from 'expo-secure-store'
import type { SupportedStorage } from '@supabase/supabase-js'

const memoryFallback = new Map<string, string>()
const secureStoreTimeoutMs = 3500

async function withTimeout<T>(promise: Promise<T>, fallback: T) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), secureStoreTimeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

async function canUseSecureStore() {
  try {
    return await withTimeout(SecureStore.isAvailableAsync(), false)
  } catch {
    return false
  }
}

export const secureStorage: SupportedStorage = {
  async getItem(key) {
    if (await canUseSecureStore()) {
      return withTimeout(SecureStore.getItemAsync(key), null)
    }

    return memoryFallback.get(key) ?? null
  },
  async setItem(key, value) {
    if (await canUseSecureStore()) {
      await withTimeout(
        SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        }),
        undefined,
      )
      return
    }

    memoryFallback.set(key, value)
  },
  async removeItem(key) {
    if (await canUseSecureStore()) {
      await withTimeout(SecureStore.deleteItemAsync(key), undefined)
      return
    }

    memoryFallback.delete(key)
  },
}
