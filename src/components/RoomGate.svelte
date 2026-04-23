<script lang="ts">
  import { sha256 } from '../lib/crypto'
  import { joinRoom, createRoom } from '../lib/roomStore'
  import type { RoomSession } from '../lib/types'

  type Mode = 'join' | 'create'

  let { onJoined }: { onJoined: (session: RoomSession) => void } = $props()

  let mode = $state<Mode>('join')
  let slug = $state('')
  let password = $state('')
  let displayName = $state('')
  let error = $state<string | null>(null)
  let loading = $state(false)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!slug.trim() || !password.trim()) return
    error = null
    loading = true
    try {
      const hash = await sha256(password)
      const room = mode === 'join'
        ? await joinRoom(slug.trim(), hash)
        : await createRoom(slug.trim(), hash)

      if (!room) {
        error = mode === 'join'
          ? 'Rum hittades inte eller fel lösenord.'
          : 'Kunde inte skapa rum — rum-ID:t kan redan vara taget.'
        return
      }

      onJoined({ room, displayName: displayName.trim() || 'Anonym' })
    } finally {
      loading = false
    }
  }

  function switchMode(next: Mode) {
    mode = next
    error = null
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
  <div class="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
    <h1 class="text-xl font-semibold text-gray-900 mb-1">
      {mode === 'join' ? 'Gå med i ett rum' : 'Skapa ett rum'}
    </h1>
    <p class="text-sm text-gray-500 mb-6">
      {mode === 'join'
        ? 'Ange rum-ID och lösenord för att börja spåra händelser.'
        : 'Välj ett unikt rum-ID och sätt ett delat lösenord.'}
    </p>

    <form onsubmit={handleSubmit} class="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Rum-ID (t.ex. brba-fredagskväll)"
        bind:value={slug}
        required
        class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        type="password"
        placeholder="Lösenord"
        bind:value={password}
        required
        class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        type="text"
        placeholder="Visningsnamn (valfritt)"
        bind:value={displayName}
        class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {#if error}
        <p role="alert" class="text-sm text-red-600">{error}</p>
      {/if}

      <button
        type="submit"
        disabled={loading}
        class="mt-1 w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Laddar…' : mode === 'join' ? 'Gå med' : 'Skapa rum'}
      </button>
    </form>

    <div class="mt-4 text-center text-sm text-gray-500">
      {#if mode === 'join'}
        Inget rum ännu?
        <button onclick={() => switchMode('create')} class="text-indigo-600 hover:underline ml-1">
          Skapa ett
        </button>
      {:else}
        Har du redan ett rum?
        <button onclick={() => switchMode('join')} class="text-indigo-600 hover:underline ml-1">
          Gå med istället
        </button>
      {/if}
    </div>
  </div>
</div>
