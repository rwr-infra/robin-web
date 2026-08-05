<script lang="ts">
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import LoadingState from '$lib/components/LoadingState.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ServerTable from '$lib/components/ServerTable.svelte';
	import MapPreview from '$lib/components/MapPreview.svelte';
	import MobileInfiniteScroll from '$lib/components/MobileInfiniteScroll.svelte';
	import QuickFilterButtons from '$lib/components/QuickFilterButtons.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { ArrowDownUp, ArrowUp, ArrowDown, Eye, CircleX, Info, Share } from '@lucide/svelte';
	import type { IDisplayServerItem, IColumn } from '$lib/models/server.model';
	import type { MapData } from '$lib/services/maps';
	import { escapeHtml } from '$lib/utils/highlight';

	interface Props {
		loading: boolean;
		refreshing?: boolean;
		error: string | null;
		searchQuery: string;
		paginatedServers: IDisplayServerItem[];
		mobilePaginatedServers: IDisplayServerItem[];
		mobileHasMore: boolean;
		mobileLoadingMore: boolean;
		totalPages: number;
		filteredServersCount: number;
		columns: IColumn[];
		maps: MapData[];
		visibleColumns: Record<string, boolean>;
		activeFilters: string[];
		isMultiSelect: boolean;
		currentPage: number;
		sortColumn: string | null;
		sortDirection: 'asc' | 'desc' | null;
		mobileExpandedCards: Record<string, boolean>;
		layoutMode: 'fullPage' | 'tableOnly';
		isManualRefresh?: boolean;
		onQuickFilter: (filterId: string) => void;
		onMultiSelectChange: (checked: boolean) => void;
		onSort: (column: string) => void;
		onPageChange: (page: number) => void;
		onLoadMore: () => void;
		onRowAction: (event: { item: IDisplayServerItem; action: string }) => void;
		onColumnToggle: (column: IColumn, visible: boolean) => void;
		onToggleMobileCard: (serverId: string) => void;
		onMapView: (mapData: MapData) => void;
		onMapPreviewClose: () => void;
		onShare?: (server: IDisplayServerItem) => void;
	}

	let {
		loading,
		refreshing = false,
		error,
		searchQuery,
		paginatedServers,
		mobilePaginatedServers,
		mobileHasMore,
		mobileLoadingMore,
		totalPages,
		filteredServersCount,
		columns,
		maps,
		visibleColumns,
		activeFilters,
		isMultiSelect,
		currentPage,
		sortColumn,
		sortDirection,
		mobileExpandedCards,
		layoutMode,
		isManualRefresh = false,
		onQuickFilter,
		onMultiSelectChange,
		onSort,
		onPageChange,
		onLoadMore,
		onRowAction,
		onColumnToggle,
		onToggleMobileCard,
		onMapView,
		onMapPreviewClose,
		onShare
	}: Props = $props();

	// Helper function to get the display value for a column
	function getDisplayValue(
		item: IDisplayServerItem,
		column: IColumn,
		searchQuery?: string
	): string {
		// If there's a search query and the column supports highlighting, use that
		if (searchQuery && column.getValueWithHighlight) {
			return column.getValueWithHighlight(item, searchQuery, maps);
		}

		// Otherwise use the regular getValue or fallback to the raw value
		if (column.getValue) {
			return column.getValue(item, maps);
		}

		const itemRecord = item as unknown as Record<string, unknown>;
		return escapeHtml(String(itemRecord[column.key] ?? '-'));
	}

	// Toast state for refresh success feedback
	let showRefreshToast = $state(false);
	let wasPreviouslyRefreshing = $state(false);

	// Monitor refreshing state changes to show toast
	$effect(() => {
		// Check if refreshing just finished (transitioned from true to false)
		const refreshingJustFinished = wasPreviouslyRefreshing && !refreshing;

		// Update tracking state
		wasPreviouslyRefreshing = refreshing;

		// Show toast when refresh completes
		if (refreshingJustFinished) {
			showRefreshToast = true;
			setTimeout(() => {
				showRefreshToast = false;
			}, 2000);
		}
	});

	const tableOnlyContainerClasses = 'md:flex-1 md:min-h-0 md:overflow-hidden';
	const tableOnlyScrollClasses = 'md:flex-1 md:min-h-0 md:overflow-auto';
	const fullPageScrollClasses = 'md:overflow-x-auto';
</script>

{#if loading}
	<LoadingState type="servers" />
{:else if error}
	<div class="alert alert-error">
		<CircleX class="h-6 w-6 shrink-0 stroke-current" />
		<span>{error}</span>
	</div>
{:else}
	<!-- Success toast - visible on all platforms -->
	<div class="toast toast-top toast-end z-50">
		{#if showRefreshToast && isManualRefresh}
			<Toast message={m['app.toast.refreshSuccess.title']()} type="success" />
		{/if}
	</div>

	<!-- Quick filter buttons -->
	<QuickFilterButtons
		isLoading={loading}
		{onQuickFilter}
		{activeFilters}
		{isMultiSelect}
		{onMultiSelectChange}
	/>

	<!-- Desktop scrollable table container -->
	<div
		class={`hidden md:flex md:flex-col ${layoutMode === 'tableOnly' ? tableOnlyContainerClasses : ''}`}
	>
		<!-- Desktop table with scroll -->
		<div
			class={`w-full ${layoutMode === 'tableOnly' ? tableOnlyScrollClasses : fullPageScrollClasses}`}
		>
			<ServerTable
				data={paginatedServers}
				{columns}
				{searchQuery}
				{maps}
				{onRowAction}
				{visibleColumns}
				{onSort}
				{sortColumn}
				{sortDirection}
				{onMapView}
				{onShare}
			/>
		</div>

		<!-- Desktop pagination - fixed at bottom, hidden when totalPages <= 1 -->
		<div class="border-mil bg-mil-secondary border-t px-3 py-2" class:hidden={totalPages <= 1}>
			<Pagination
				{currentPage}
				{totalPages}
				totalItems={filteredServersCount}
				pageChange={onPageChange}
			/>
		</div>
	</div>

	<!-- Mobile content area -->
	<div class="flex w-full flex-col md:hidden">
		<!-- Mobile table cards -->
		<div class="md:hidden">
			<!-- Mobile sort controls -->
			<div class="mb-4 flex flex-wrap gap-2">
				{#each columns.filter( (col) => ['name', 'playerCount', 'mapId'].includes(col.key) ) as column (column.key)}
					<button
						class="btn btn-sm btn-outline flex items-center gap-2"
						onclick={() => onSort(column.key)}
						type="button"
					>
						{#if column.i18n}<TranslatedText key={column.i18n} />{:else}{column.label}{/if}
						{#if sortColumn !== column.key || !sortDirection}
							<ArrowDownUp class="h-4 w-4 opacity-30" />
						{:else if sortDirection === 'asc'}
							<ArrowUp class="text-primary h-4 w-4" />
						{:else if sortDirection === 'desc'}
							<ArrowDown class="text-primary h-4 w-4" />
						{/if}
					</button>
				{/each}
			</div>

			{#each mobilePaginatedServers as item (item.id)}
				<div class="collapse-arrow bg-base-100 border-base-300 collapse mb-3 border">
					<input
						id={`server-mobile-collapse-${item.id}`}
						type="checkbox"
						checked={mobileExpandedCards[item.id]}
						onchange={() => onToggleMobileCard(item.id)}
						aria-label={m['app.ariaLabel.toggleServerDetails']()}
						aria-expanded={mobileExpandedCards[item.id] ? 'true' : 'false'}
					/>
					<label
						for={`server-mobile-collapse-${item.id}`}
						class="collapse-title min-h-14 cursor-pointer px-4 py-5 font-semibold"
					>
						<div class="mr-6 flex items-center justify-between gap-2">
							<div class="text-base-content flex-1 truncate text-base font-medium">
								{@html getDisplayValue(
									item,
									columns.find((col) => col.key === 'name')!,
									searchQuery
								)}
							</div>
							<div class="min-w-0 flex-shrink-0">
								<div class="flex max-w-24 flex-wrap justify-end gap-1 sm:max-w-32">
									{@html getDisplayValue(
										item,
										columns.find((col) => col.key === 'playerCount')!,
										searchQuery
									)}
								</div>
							</div>
							<div class="flex-shrink-0">
								{@html getDisplayValue(
									item,
									columns.find((col) => col.key === 'mapId')!,
									searchQuery
								)}
							</div>
						</div>
					</label>
					<div class="collapse-content">
						<div class="border-base-200 border-t">
							<div class="space-y-2 pt-3">
								{#each columns.filter((col) => !['name', 'playerCount', 'mapId', 'action'].includes(col.key)) as column (column.key)}
									<div class="flex items-center justify-between py-1">
										<span class="text-base-content/60 min-w-20 flex-shrink-0 text-sm">
											{#if column.i18n}<TranslatedText
													key={column.i18n}
												/>{:else}{column.label}{/if}:
										</span>
										<div class="text-base-content ml-3 flex-1 text-right text-sm">
											{#if column.key === 'url' && item.url}
												<a
													href={item.url}
													target="_blank"
													rel="noopener noreferrer"
													class="link link-primary"
													onclick={(e) => e.stopPropagation()}
													title={item.url}
												>
													{item.url.length > 30 ? item.url.substring(0, 27) + '...' : item.url}
												</a>
											{:else if column.key === 'comment' || column.key === 'playerList'}
												<div class="text-left break-words whitespace-pre-wrap">
													{@html getDisplayValue(item, column, searchQuery)}
												</div>
											{:else}
												<div class="flex items-center justify-end">
													{@html getDisplayValue(item, column, searchQuery)}
												</div>
											{/if}
										</div>
									</div>
								{/each}
								{#if maps.find((m) => m.path === item.mapId)}
									{@const mapData = maps.find((m) => m.path === item.mapId)}
									<div class="border-base-200 mt-4 border-t pt-3">
										<div class="flex items-center justify-between">
											<span class="text-base-content/70 min-w-20 flex-shrink-0 text-sm">
												<TranslatedText key="app.map.preview" />:
											</span>
											<button
												class="btn btn-success btn-sm text-white"
												onclick={(e) => {
													e.stopPropagation();
													onMapView(mapData!);
												}}
												type="button"
											>
												<Eye class="mr-1 h-3 w-3" />
												<TranslatedText key="app.map.buttonPreviewMap" />
											</button>
										</div>
									</div>
								{/if}

								<!-- Share button section -->
								<div class="border-base-200 mt-4 border-t pt-3">
									<div class="flex items-center justify-between">
										<span class="text-base-content/70 min-w-20 flex-shrink-0 text-sm">
											<TranslatedText key="app.server.share" />:
										</span>
										<button
											class="btn btn-success btn-sm text-white"
											onclick={(e) => {
												e.stopPropagation();
												onShare?.(item);
											}}
											type="button"
										>
											<Share class="mr-1 h-3 w-3" />
											<TranslatedText key="app.server.buttonShare" />
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}

			{#if mobilePaginatedServers.length === 0}
				<div class="alert alert-info">
					<Info class="h-6 w-6 shrink-0 stroke-current" />
					<span
						><TranslatedText key="app.server.noDataFound" />{#if searchQuery}
							<TranslatedText key="app.server.matchingSearch" />{/if}.</span
					>
				</div>
			{/if}
		</div>

		<!-- Mobile infinite scroll -->
		<MobileInfiniteScroll hasMore={mobileHasMore} isLoading={mobileLoadingMore} {onLoadMore} />
	</div>
{/if}
