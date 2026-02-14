<script lang="ts">
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import LoadingState from '$lib/components/LoadingState.svelte';
	import PaginationPrevNext from '$lib/components/PaginationPrevNext.svelte';
	import PlayerTable from '$lib/components/PlayerTable.svelte';
	import MobileInfiniteScroll from '$lib/components/MobileInfiniteScroll.svelte';
	import PageSizeSelector from '$lib/components/PageSizeSelector.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { ArrowDown, CircleX, Info, Share } from '@lucide/svelte';
	import type { IPlayerItem, IPlayerColumn } from '$lib/models/player.model';
	import { escapeHtml } from '$lib/utils/highlight';

	interface Props {
		loading: boolean;
		error: string | null;
		searchQuery: string;
		highlightedUsername?: string;
		paginatedPlayers: IPlayerItem[];
		mobilePaginatedPlayers: IPlayerItem[];
		mobileHasMore: boolean;
		mobileLoadingMore: boolean;
		playerColumns: IPlayerColumn[];
		visibleColumns: Record<string, boolean>;
		currentPage: number;
		pageSize: number;
		sortColumn: string | null;
		mobileExpandedCards: Record<string, boolean>;
		layoutMode: 'fullPage' | 'tableOnly';
		hasNext: boolean;
		hasPrevious: boolean;
		onSort: (column: string) => void;
		onPageChange: (page: number) => void;
		onPageSizeChange: (size: number) => void;
		onLoadMore: () => void;
		onToggleMobileCard: (playerId: string) => void;
		onShare?: (player: IPlayerItem) => void;
	}

	let {
		loading,
		error,
		searchQuery,
		highlightedUsername,
		paginatedPlayers,
		mobilePaginatedPlayers,
		mobileHasMore,
		mobileLoadingMore,
		playerColumns,
		visibleColumns,
		currentPage,
		pageSize,
		sortColumn,
		mobileExpandedCards,
		layoutMode,
		hasNext,
		hasPrevious,
		onSort,
		onPageChange,
		onPageSizeChange,
		onLoadMore,
		onToggleMobileCard,
		onShare
	}: Props = $props();

	// Helper function to get the display value for a column
	function getDisplayValue(
		item: IPlayerItem,
		column: IPlayerColumn,
		searchQuery?: string
	): string {
		// If there's a search query and the column supports highlighting, use that
		if (searchQuery && column.getValueWithHighlight) {
			return column.getValueWithHighlight(item, searchQuery);
		}

		// Otherwise use the regular getValue or fallback to the raw value
		if (column.getValue) {
			return column.getValue(item);
		}

		const itemRecord = item as unknown as Record<string, unknown>;
		return escapeHtml(String(itemRecord[column.key] ?? '-'));
	}

	// Toast state for load more success feedback
	let showLoadMoreToast = $state(false);
	let wasPreviouslyLoadingMore = $state(false);
	let hasLoadedPlayersOnce = $state(false);

	// Monitor loading state changes to show toast
	$effect(() => {
		// Check if loading just finished (transitioned from true to false)
		const loadingJustFinished = wasPreviouslyLoadingMore && !mobileLoadingMore;

		// Update tracking state
		wasPreviouslyLoadingMore = mobileLoadingMore;

		// Track if we've had data at least once
		if (mobilePaginatedPlayers.length > 0) {
			hasLoadedPlayersOnce = true;
		}

		// Show toast only after initial load, when load more completes
		if (loadingJustFinished && hasLoadedPlayersOnce) {
			showLoadMoreToast = true;
			setTimeout(() => {
				showLoadMoreToast = false;
			}, 2000);
		}
	});

	const tableOnlyContainerClasses = 'md:flex-1 md:min-h-0 md:overflow-hidden';
	const tableOnlyScrollClasses = 'md:flex-1 md:min-h-0 md:overflow-auto';
	const fullPageScrollClasses = 'md:overflow-x-auto';
</script>

{#if loading}
	<LoadingState type="players" />
{:else if error}
	<div class="alert alert-error">
		<CircleX class="h-6 w-6 shrink-0 stroke-current" />
		<span>{error}</span>
	</div>
{:else}
	<!-- Desktop scrollable table container -->
	<div class={`hidden md:flex md:flex-col ${layoutMode === 'tableOnly' ? tableOnlyContainerClasses : ''}`}>
		<!-- Desktop table with scroll -->
		<div class={`w-full ${layoutMode === 'tableOnly' ? tableOnlyScrollClasses : fullPageScrollClasses}`}>
			<PlayerTable
				data={paginatedPlayers}
				{playerColumns}
				{visibleColumns}
				{searchQuery}
				{highlightedUsername}
				{sortColumn}
				onSort={onSort}
				onShare={onShare}
			/>
		</div>

		<!-- Desktop pagination - fixed at bottom, hidden when no pagination needed -->
		<div class="flex items-center justify-between border-t border-mil bg-mil-secondary px-3 py-2" class:hidden={!hasNext && !hasPrevious}>
			<PaginationPrevNext
				{currentPage}
				{hasNext}
				{hasPrevious}
				onPageChange={onPageChange}
			/>
			<PageSizeSelector currentSize={pageSize} onSizeChange={onPageSizeChange} />
		</div>
	</div>

	<!-- Mobile content area - 保持原有行为 -->
	<div class="flex w-full flex-col md:hidden">
		<!-- Toast container for mobile only -->
		<div class="toast toast-top toast-end z-50">
			{#if showLoadMoreToast}
				<Toast message={m['app.toast.loadMoreSuccess.title']()} type="success" />
			{/if}
		</div>
		<!-- Mobile table cards -->
		<div class="md:hidden">
			<!-- Mobile sort controls -->
			<div class="mb-4 flex flex-wrap gap-2">
				{#each playerColumns.filter((col) => col.key !== 'rowNumber' && col.key !== 'rankName') as column (column.key)}
					<button
						class="btn btn-sm btn-outline flex items-center gap-2"
						onclick={() => onSort(column.key as string)}
						type="button"
					>
						{#if column.i18n}<TranslatedText key={column.i18n} />{:else}{column.label}{/if}
						{#if sortColumn !== column.key}
							<ArrowDown class="w-4 h-4 opacity-30" />
						{:else}
							<ArrowDown class="w-4 h-4 text-primary" />
						{/if}
					</button>
				{/each}
			</div>

				{#each mobilePaginatedPlayers as item (item.id)}
					<div class="collapse collapse-arrow bg-base-100 border-base-300 mb-3 border">
						<input
							id={`player-mobile-collapse-${item.id}`}
							type="checkbox"
							checked={mobileExpandedCards[item.id]}
							onchange={() => onToggleMobileCard(item.id)}
							aria-label={m['app.ariaLabel.togglePlayerDetails']()}
							aria-expanded={mobileExpandedCards[item.id] ? 'true' : 'false'}
						/>
						<label
							for={`player-mobile-collapse-${item.id}`}
							class="collapse-title min-h-14 cursor-pointer px-4 py-5 font-semibold"
						>
							<div class="flex items-center justify-between gap-2 mr-6">
								<div class="text-base-content flex-1 truncate text-base font-medium">
									{@html getDisplayValue(
										item,
										playerColumns.find((col) => col.key === 'username')!,
										searchQuery
									)}
								</div>
								<span class="text-base-content/60 text-sm">
								#{@html getDisplayValue(
									item,
									playerColumns.find((col) => col.key === 'rowNumber')!
								)}
								</span>
							</div>
						</label>
					<div class="collapse-content">
						<div class="border-base-200 border-t">
							<div class="space-y-2 pt-3">
								{#each playerColumns.filter((col) => !['username', 'rowNumber', 'action'].includes(col.key as string)) as column (column.key)}
									<div class="flex items-center justify-between py-1">
										<span class="text-base-content/60 min-w-20 flex-shrink-0 text-sm">
											{#if column.i18n}<TranslatedText
													key={column.i18n}
												/>{:else}{column.label}{/if}:
										</span>
										<div class="text-base-content ml-3 flex-1 text-right text-sm">
											{@html getDisplayValue(item, column, searchQuery)}
										</div>
									</div>
								{/each}
							</div>

							<!-- Share button section (similar to ServerView Preview Map) -->
							<div class="border-base-200 mt-4 pt-3 border-t">
								<div class="flex items-center justify-between">
									<span class="text-base-content/70 min-w-20 flex-shrink-0 text-sm">
										<TranslatedText key="app.player.share" />:
									</span>
									<button
										class="btn btn-success btn-sm text-white"
										onclick={(e) => {
											e.stopPropagation();
											onShare?.(item);
										}}
										type="button"
									>
										<Share class="w-3 h-3 mr-1" />
										<TranslatedText key="app.player.buttonShare" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}

			{#if mobilePaginatedPlayers.length === 0}
				<div class="alert alert-info">
					<Info class="h-6 w-6 shrink-0 stroke-current" />
					<span>
						<TranslatedText key="app.player.noPlayersFound" />
						{#if searchQuery}
							<TranslatedText key="app.player.matchingSearch" />
						{/if}.
					</span>
				</div>
			{/if}
		</div>

		<!-- Mobile infinite scroll -->
		<MobileInfiniteScroll
			hasMore={mobileHasMore}
			isLoading={mobileLoadingMore}
			onLoadMore={onLoadMore}
			loadingTextKey="app.player.loading.text"
		/>
	</div>
{/if}

<style>
	/* Component-specific styles - loading animations are in LoadingState.svelte */
</style>
