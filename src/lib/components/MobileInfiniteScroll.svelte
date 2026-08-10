<script lang="ts">
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import { LoaderCircle } from '@lucide/svelte';

	interface Props {
		hasMore: boolean;
		isLoading: boolean;
		onLoadMore: () => void;
		threshold?: number; // Distance from bottom to trigger load (in pixels)
		loadingTextKey?: string; // Custom i18n key for loading text
	}

	let {
		hasMore = false,
		isLoading = false,
		onLoadMore = () => {},
		threshold = 200,
		loadingTextKey = 'app.loading.text'
	}: Props = $props();

	let containerElement: HTMLElement;
	let observer: IntersectionObserver | null = null;
	let loadMoreTrigger = $state<HTMLElement | undefined>();

	// Set up intersection observer for infinite scroll
	$effect(() => {
		if (!loadMoreTrigger) return;

		// Clean up previous observer
		if (observer) {
			observer.disconnect();
		}

		// Create new observer
		observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry.isIntersecting) {
					onLoadMore();
				}
			},
			{
				root: null,
				rootMargin: `${threshold}px`,
				threshold: 0.1
			}
		);

		if (hasMore && !isLoading) {
			observer.observe(loadMoreTrigger);
		}

		return () => {
			if (observer) {
				observer.disconnect();
			}
		};
	});
</script>

<!-- Mobile infinite scroll - hidden on desktop -->
<div class="block md:hidden">
	{#if hasMore}
		<!-- Load more trigger element -->
		<div
			bind:this={loadMoreTrigger}
			class="flex w-full items-center justify-center py-4"
			role="status"
			aria-live="polite"
		>
			{#if isLoading}
				<!-- Loading indicator -->
				<div class="flex items-center gap-3">
					<LoaderCircle class="text-primary size-5 animate-spin" />
					<span class="text-base-content/70 text-sm">
						<TranslatedText key={loadingTextKey} />
					</span>
				</div>
			{:else}
				<!-- Load more button (fallback) -->
				<button class="btn btn-outline btn-sm" onclick={onLoadMore} disabled={isLoading}>
					<TranslatedText key="app.button.loadMore" />
				</button>
			{/if}
		</div>
	{:else if isLoading}
		<!-- Final loading state -->
		<div class="flex w-full items-center justify-center py-4" role="status">
			<div class="flex items-center gap-3">
				<LoaderCircle class="text-primary size-5 animate-spin" />
				<span class="text-base-content/70 text-sm">
					<TranslatedText key={loadingTextKey} />
				</span>
			</div>
		</div>
	{:else}
		<!-- End of content indicator -->
		<div class="w-full py-2 text-center" role="status">
			<div class="text-muted text-sm">
				<TranslatedText key="app.mobile.endOfContent" />
			</div>
		</div>
	{/if}
</div>
