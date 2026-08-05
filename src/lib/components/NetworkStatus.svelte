<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { cacheStorage } from '$lib/services/cache-storage';
	import TranslatedText from './TranslatedText.svelte';

	let isOnline = $state(true);
	let lastUpdate = $state<Date | null>(null);

	onMount(() => {
		if (!browser) return;

		isOnline = navigator.onLine;

		// Check for cached data timestamp
		checkCacheTimestamp();

		const handleOnline = () => {
			isOnline = true;
			checkCacheTimestamp();
		};

		const handleOffline = () => {
			isOnline = false;
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});

	async function checkCacheTimestamp() {
		try {
			// Try to get cache info to show last update time
			// This is optional - the actual timestamp would be stored with cached data
			const cachedData = await cacheStorage.get<number | string>('cache', 'server-list-timestamp');
			if (cachedData) {
				lastUpdate = new Date(cachedData);
			}
		} catch {
			// Ignore errors
		}
	}
</script>

<div class="flex items-center gap-2 text-xs">
	<div class="flex items-center gap-1">
		<span class="inline-block h-2 w-2 rounded-full {isOnline ? 'bg-success' : 'bg-error'}"></span>
		<span class="text-mil-secondary">
			{#if isOnline}
				<TranslatedText key="app.pwa.status.online" />
			{:else}
				<TranslatedText key="app.pwa.status.offline" />
			{/if}
		</span>
	</div>
	{#if lastUpdate && !isOnline}
		<span class="text-mil-muted"
			><TranslatedText key="app.pwa.status.updated" /> {lastUpdate.toLocaleTimeString()}</span
		>
	{/if}
</div>
