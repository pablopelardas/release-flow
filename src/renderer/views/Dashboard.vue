<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
      ReleaseFlow Dashboard
    </h1>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Repositorios
        </h2>
        <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {{ repositoriesCount }}
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Templates
        </h2>
        <p class="text-3xl font-bold text-green-600 dark:text-green-400">
          {{ templatesCount }}
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Releases
        </h2>
        <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
          {{ releasesCount }}
        </p>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Bienvenido a ReleaseFlow Desktop
      </h2>
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        Tu herramienta de gestión automatizada de releases migrada a Electron + Vue 3.
      </p>
      <div class="flex space-x-4">
        <router-link to="/repositories"
                     class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          Gestionar Repositorios
        </router-link>
        <router-link to="/templates"
                     class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
          Editar Templates
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useAppStore } from '../store'

export default {
  name: 'Dashboard',
  setup() {
    const store = useAppStore()

    return {
      repositoriesCount: computed(() => store.repositoriesCount),
      templatesCount: computed(() => store.templatesCount),
      releasesCount: computed(() => store.releasesCount),
    }
  },
}
</script>