<script lang="ts">
	import type { MapData } from '$lib/services/maps';
	import ModalShell from '$lib/components/ModalShell.svelte';
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import { CircleAlert, RefreshCw } from '@lucide/svelte';

	interface Props {
		mapData?: MapData;
		show: boolean;
		position: { x: number; y: number };
		key?: string;
		onClose?: () => void;
	}

	let { mapData, show, onClose }: Props = $props();

	let imageLoading = $state(true);
	let imageError = $state(false);

	function closeModal() {
		if (onClose) {
			onClose();
		}
	}

	function handleImageLoad(event: Event) {
		imageLoading = false;
		imageError = false;

		// Add successfully loaded image to cache
		if (mapData?.path) {
			imageCache.set(mapData.path, true);
		}
	}

	function handleImageError(event: Event) {
		imageLoading = false;
		imageError = true;

		// Mark as failed, but allow retry later
		if (mapData?.path) {
			imageCache.set(mapData.path, false);
		}
	}

	function retryImageLoad() {
		if (mapData?.path) {
			imageCache.delete(mapData.path);
			imageLoading = true;
			imageError = false;
		}
	}

	// Image cache system
	const imageCache = $state(new Map<string, boolean>());
	let imageKey = $derived(() => {
		if (mapData && show) {
			return `map_${mapData.path}`;
		}
		return '';
	});

	$effect(() => {
		if (mapData && show) {
			const path = mapData.path;
			const cacheStatus = imageCache.get(path);

			if (cacheStatus === true) {
				imageLoading = false;
				imageError = false;
			} else if (cacheStatus === false) {
				imageLoading = false;
				imageError = true;
			} else {
				imageLoading = true;
				imageError = false;
			}
		} else {
			imageLoading = false;
			imageError = false;
		}
	});
</script>

{#if mapData}
	<ModalShell
		{show}
		title={mapData.name}
		subtitle={mapData.path}
		widthClass="max-w-6xl"
		contentClass="max-h-[70vh] w-full p-4"
		onClose={closeModal}
	>
		{#if imageLoading}
			<div class="flex flex-col items-center justify-center p-8">
				<span class="loading loading-dots loading-lg mb-4"></span>
				<p class="text-base-content/70 text-center text-sm">
					<TranslatedText key="app.map.loading" />
				</p>
			</div>
		{:else if imageError}
			<div class="flex max-w-[65ch] flex-col items-center justify-center p-8 text-center">
				<CircleAlert class="text-error mb-4 size-8" />
				<p class="text-base-content/70 mb-4 text-sm">
					<TranslatedText key="app.map.loadError" />
				</p>
				<button class="btn btn-outline btn-sm" onclick={retryImageLoad} type="button">
					<RefreshCw class="mr-1 size-4" />
					<TranslatedText key="app.map.retry" />
				</button>
			</div>
		{:else}
			{#key imageKey}
				<img
					src={mapData.image}
					alt="Map: {mapData.name}"
					class="max-h-[66vh] max-w-full rounded object-contain"
					onload={handleImageLoad}
					onerror={handleImageError}
				/>
			{/key}
		{/if}

		{#snippet footer()}
			<button class="btn btn-secondary w-full" onclick={closeModal} type="button">
				<TranslatedText key="app.map.close" />
			</button>
		{/snippet}
	</ModalShell>
{/if}
