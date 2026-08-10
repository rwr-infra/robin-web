<script lang="ts">
	import DataField from '$lib/components/DataField.svelte';
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import LoadingState from '$lib/components/LoadingState.svelte';
	import PaginationPrevNext from '$lib/components/PaginationPrevNext.svelte';
	import PlayerTable from '$lib/components/PlayerTable.svelte';
	import MobileInfiniteScroll from '$lib/components/MobileInfiniteScroll.svelte';
	import PageSizeSelector from '$lib/components/PageSizeSelector.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { ArrowDown, CircleX, Info, Share, TriangleAlert, Users, X } from '@lucide/svelte';
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
		/** Username the SID window is anchored on, null when not in neighbor mode */
		sidAnchor?: string | null;
		/** SID ordering is active (with or without an anchor) */
		sidSortActive?: boolean;
		/** Anchor was not found in this database and neighbor mode was left */
		sidAnchorMissing?: boolean;
		onSort: (column: string) => void;
		onPageChange: (page: number) => void;
		onPageSizeChange: (size: number) => void;
		onLoadMore: () => void;
		onToggleMobileCard: (playerId: string) => void;
		onShare?: (player: IPlayerItem) => void;
		onFindNeighbors?: (player: IPlayerItem) => void;
		onExitSidMode?: () => void;
		onShiftSidWindow?: (direction: 1 | -1) => void;
		onDismissSidAnchorMissing?: () => void;
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
		sidAnchor = null,
		sidSortActive = false,
		sidAnchorMissing = false,
		onSort,
		onPageChange,
		onPageSizeChange,
		onLoadMore,
		onToggleMobileCard,
		onShare,
		onFindNeighbors,
		onExitSidMode,
		onShiftSidWindow,
		onDismissSidAnchorMissing
	}: Props = $props();

	// Absolute rank range of the loaded window, read from the upstream row numbers
	const windowRangeStart = $derived(paginatedPlayers[0]?.rowNumber ?? 0);
	const windowRangeEnd = $derived(paginatedPlayers[paginatedPlayers.length - 1]?.rowNumber ?? 0);
	const canShiftBackward = $derived(windowRangeStart > 1);

	// Helper function to get the display value for a column
	function getDisplayValue(item: IPlayerItem, column: IPlayerColumn, searchQuery?: string): string {
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

	// The anchored player usually sits below the fold (row 11 of the window on desktop, an even
	// taller stack of cards on mobile). Bring it into view once per loaded window - keyed on the
	// window's first rank as well, because the anchor is already on screen in the previous
	// window when neighbor mode is entered.
	// Plain let: writing it must not re-trigger the effect.
	let lastScrolledKey: string | null = null;

	$effect(() => {
		if (!sidAnchor) {
			lastScrolledKey = null;
			return;
		}
		// Rows and cards are unmounted while loading, so wait for the new window to render
		if (loading) return;

		const windowTop = paginatedPlayers[0] ?? mobilePaginatedPlayers[0];
		if (!windowTop) return;

		const key = `${sidAnchor}@${windowTop.rowNumber}`;
		if (lastScrolledKey === key) return;

		const anchorLower = sidAnchor.toLowerCase();
		const matchesAnchor = (player: IPlayerItem) => player.username.toLowerCase() === anchorLower;
		const desktopTarget = paginatedPlayers.find(matchesAnchor);
		const mobileTarget = mobilePaginatedPlayers.find(matchesAnchor);

		// Both trees are mounted; the one hidden by the breakpoint has no box, so scrolling it
		// is a no-op and this stays viewport-agnostic.
		const targets = [
			desktopTarget && document.getElementById(`player-row-${desktopTarget.id}`),
			mobileTarget && document.getElementById(`player-mobile-card-${mobileTarget.id}`)
		].filter((element): element is HTMLElement => Boolean(element));

		// Not rendered yet: leave the key unset so a later update retries
		if (targets.length === 0) return;

		lastScrolledKey = key;
		requestAnimationFrame(() => {
			for (const element of targets) {
				// Absent where scrollIntoView is unimplemented (jsdom)
				if (typeof element.scrollIntoView === 'function') {
					element.scrollIntoView({ block: 'center', behavior: 'smooth' });
				}
			}
		});
	});

	const tableOnlyContainerClasses = 'md:flex-1 md:min-h-0 md:overflow-hidden';
	const tableOnlyScrollClasses = 'md:flex-1 md:min-h-0 md:overflow-auto';
	const fullPageScrollClasses = 'md:overflow-x-auto';
</script>

{#if loading}
	<LoadingState type="players" />
{:else if error}
	<div class="alert alert-error">
		<CircleX class="size-6 shrink-0 stroke-current" />
		<span>{error}</span>
	</div>
{:else}
	<!-- Anchor player missing in this database: upstream silently answered with the first page -->
	{#if sidAnchorMissing}
		<div class="alert alert-warning mb-3" data-testid="sid-anchor-missing">
			<TriangleAlert class="size-5 shrink-0 stroke-current" />
			<span><TranslatedText key="app.player.neighbors.notFound" /></span>
			<button
				type="button"
				class="btn btn-ghost btn-xs btn-circle"
				onclick={() => onDismissSidAnchorMissing?.()}
				aria-label={m['app.player.neighbors.dismiss']()}
			>
				<X class="size-4" />
			</button>
		</div>
	{/if}

	<!-- SID ordering has no table column, so its state is surfaced here -->
	{#if sidSortActive}
		<div
			class="border-base-300 bg-base-100 mb-3 flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2 text-sm"
			data-testid="sid-mode-banner"
		>
			<div class="flex flex-wrap items-center gap-2">
				<Users class="size-4 shrink-0" />
				{#if sidAnchor}
					<span class="font-medium">
						{m['app.player.neighbors.bannerAnchored']({ username: sidAnchor })}
					</span>
				{:else}
					<span class="font-medium"
						><TranslatedText key="app.player.neighbors.bannerSortOnly" /></span
					>
				{/if}
				{#if windowRangeStart > 0}
					<span class="text-base-content/70">
						{m['app.player.neighbors.range']({ start: windowRangeStart, end: windowRangeEnd })}
					</span>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				<span class="text-base-content/70 hidden lg:inline"
					><TranslatedText key="app.player.neighbors.hint" /></span
				>
				<button type="button" class="btn btn-xs" onclick={() => onExitSidMode?.()}>
					<TranslatedText key="app.player.neighbors.exit" />
				</button>
			</div>
		</div>
	{/if}

	<!-- Desktop scrollable table container -->
	<div
		class={`hidden md:flex md:flex-col ${layoutMode === 'tableOnly' ? tableOnlyContainerClasses : ''}`}
	>
		<!-- Desktop table with scroll -->
		<div
			class={`w-full ${layoutMode === 'tableOnly' ? tableOnlyScrollClasses : fullPageScrollClasses}`}
		>
			<PlayerTable
				data={paginatedPlayers}
				{playerColumns}
				{visibleColumns}
				{searchQuery}
				{highlightedUsername}
				{sortColumn}
				{onSort}
				{onShare}
				{onFindNeighbors}
			/>
		</div>

		{#if sidAnchor}
			<!-- Anchored requests cannot be paginated upstream: browse by absolute row offset -->
			<div
				class="border-base-300 bg-base-100 flex items-center justify-between border-t px-3 py-2"
				data-testid="sid-window-nav"
			>
				<div class="join">
					<button
						type="button"
						class="join-item btn btn-sm"
						disabled={!canShiftBackward}
						onclick={() => onShiftSidWindow?.(-1)}
					>
						‹ {m['app.player.neighbors.previousWindow']({ count: pageSize })}
					</button>
					<button
						type="button"
						class="join-item btn btn-sm"
						data-testid="sid-window-next"
						disabled={!hasNext}
						onclick={() => onShiftSidWindow?.(1)}
					>
						{m['app.player.neighbors.nextWindow']({ count: pageSize })} ›
					</button>
				</div>
				<PageSizeSelector currentSize={pageSize} onSizeChange={onPageSizeChange} />
			</div>
		{:else}
			<!-- Desktop pagination - fixed at bottom, hidden when no pagination needed -->
			<div
				class="border-base-300 bg-base-100 flex items-center justify-between border-t px-3 py-2"
				class:hidden={!hasNext && !hasPrevious}
			>
				<PaginationPrevNext {currentPage} {hasNext} {hasPrevious} {onPageChange} />
				<PageSizeSelector currentSize={pageSize} onSizeChange={onPageSizeChange} />
			</div>
		{/if}
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
							<ArrowDown class="text-muted size-4" />
						{:else}
							<ArrowDown class="text-primary size-4" />
						{/if}
					</button>
				{/each}
			</div>

			{#if sidAnchor && canShiftBackward}
				<!-- Mobile browses forward with infinite scroll, backward needs an explicit step -->
				<button
					type="button"
					class="btn btn-sm btn-outline mb-4 w-full"
					onclick={() => onShiftSidWindow?.(-1)}
				>
					‹ {m['app.player.neighbors.previousWindow']({ count: pageSize })}
				</button>
			{/if}

			{#each mobilePaginatedPlayers as item (item.id)}
				{@const isHighlighted =
					highlightedUsername && item.username.toLowerCase() === highlightedUsername.toLowerCase()}
				<div
					id={`player-mobile-card-${item.id}`}
					class="collapse-arrow collapse mb-3 border {isHighlighted
						? 'highlighted-card border-primary bg-primary/20 font-semibold'
						: 'bg-base-100 border-base-300'}"
				>
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
						class="collapse-title min-h-12 cursor-pointer px-4 py-4 font-semibold"
					>
						<div class="mr-6 flex items-center justify-between gap-2">
							<div class="text-base-content flex-1 truncate text-base font-medium">
								{@html getDisplayValue(
									item,
									playerColumns.find((col) => col.key === 'username')!,
									searchQuery
								)}
							</div>
							<span class="text-base-content/70 text-sm">
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
									<DataField labelKey={column.i18n} label={column.label}>
										{@html getDisplayValue(item, column, searchQuery)}
									</DataField>
								{/each}
							</div>

							<DataField labelKey="app.player.share" divider>
								<button
									class="btn btn-primary btn-sm"
									onclick={(e) => {
										e.stopPropagation();
										onShare?.(item);
									}}
									type="button"
								>
									<Share class="mr-1 size-4" />
									<TranslatedText key="app.player.buttonShare" />
								</button>
							</DataField>

							{#if onFindNeighbors}
								<!-- Similar accounts entry point (mobile equivalent of the table action) -->
								<DataField labelKey="app.player.neighbors.label" divider>
									<button
										class="btn btn-outline btn-sm"
										onclick={(e) => {
											e.stopPropagation();
											onFindNeighbors(item);
										}}
										type="button"
									>
										<Users class="mr-1 size-4" />
										<TranslatedText key="app.player.neighbors.button" />
									</button>
								</DataField>
							{/if}
						</div>
					</div>
				</div>
			{/each}

			{#if mobilePaginatedPlayers.length === 0}
				<div class="alert alert-info">
					<Info class="size-6 shrink-0 stroke-current" />
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
			{onLoadMore}
			loadingTextKey="app.player.loading.text"
		/>
	</div>
{/if}

<style>
	/* Component-specific styles - loading animations are in LoadingState.svelte */
</style>
