<script lang="ts">
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { ArrowDownUp, ArrowUp, ArrowDown, Eye, Info, Share } from '@lucide/svelte';
	import type { IDisplayServerItem } from '$lib/models/server.model';
	import type { IColumn } from '$lib/models/server.model';
	import type { MapData } from '$lib/services/maps';
	import { escapeHtml } from '$lib/utils/highlight';
	import './table.css';

	interface Props {
		data: IDisplayServerItem[];
		columns: IColumn[];
		visibleColumns: Record<string, boolean>;
		searchQuery: string;
		maps?: MapData[];
		onRowAction: (event: { item: IDisplayServerItem; action: string }) => void;
		onSort?: (column: string) => void;
		sortColumn?: string | null;
		sortDirection?: 'asc' | 'desc' | null;
		onMapView?: (mapData: MapData) => void;
		onShare?: (server: IDisplayServerItem) => void;
	}

	let {
		data = [],
		columns = [],
		searchQuery = '',
		maps = [],
		onRowAction = () => {},
		visibleColumns = {},
		onSort = () => {},
		sortColumn = null,
		sortDirection = null,
		onMapView,
		onShare
	}: Props = $props();

	// Helper function to get the display value for a column
	function getDisplayValue(item: IDisplayServerItem, column: IColumn): string {
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

	// Handle row action
	function handleAction(item: IDisplayServerItem, action: string) {
		onRowAction({ item, action });
	}

	// Helper function to get alignment class based on column configuration
	function getAlignmentClass(column: IColumn): string {
		switch (column.alignment) {
			case 'top':
				return 'align-top';
			case 'center':
				return 'align-middle text-center';
			case 'right':
				return 'align-middle text-right';
			case 'left':
			default:
				return 'align-middle';
		}
	}

	// Handle column sort
	function handleColumnSort(column: string) {
		onSort(column);
	}

	// Get sticky class for column
	function getStickyClass(key: string): string {
		if (key === 'name') return 'sticky-name';
		return '';
	}
</script>

{#if data.length === 0}
	<div class="alert alert-info">
		<Info class="size-6 shrink-0 stroke-current" />
		<span
			><TranslatedText key="app.server.noDataFound" />{#if searchQuery}
				<TranslatedText key="app.server.matchingSearch" />{/if}.</span
		>
	</div>
{:else}
	<!-- Desktop table view (hidden on mobile) -->
	<div class="server-table-wrapper w-full">
		<table class="table-pin-rows table-zebra bg-base-200 mb-0 table border-0">
			<thead>
				<tr class="bg-base-100">
					{#each columns as column (column.key)}
						{#if visibleColumns[column.key]}
							<th
								class="border-base-300 text-base-content sticky top-0 z-10 px-1 py-1 align-middle {getStickyClass(
									column.key
								)} {column.headerClass || ''}"
								class:action-header={column.key === 'action'}
								class:sticky-name-header={column.key === 'name'}
							>
								{#if column.key === 'action'}
									<div class="text-center">
										{#if column.i18n}<TranslatedText key={column.i18n} />{:else}{column.label}{/if}
									</div>
								{:else}
									<button
										class="hover:bg-base-300 flex w-full items-center gap-2 rounded px-2 py-2 text-left transition-colors duration-200"
										onclick={() => handleColumnSort(column.key)}
										type="button"
										title={m['app.ariaLabel.clickToSort']()}
									>
										<span class="flex-1">
											{#if column.i18n}<TranslatedText
													key={column.i18n}
												/>{:else}{column.label}{/if}
										</span>
										{#if sortColumn !== column.key || !sortDirection}
											<ArrowDownUp class="text-muted size-4" />
										{:else if sortDirection === 'desc'}
											<ArrowDown class="text-primary size-4" />
										{:else if sortDirection === 'asc'}
											<ArrowUp class="text-primary size-4" />
										{/if}
									</button>
								{/if}
							</th>
						{/if}
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each data as item (item.id)}
					<!-- Row height comes from cell padding (8px top/bottom) rather than a
					     fixed off-scale height, which keeps the density but stays on the
					     spacing scale. min-h on a <tr> never did anything. -->
					<tr class="hover hover:bg-base-300 border-base-300 border-b">
						{#each columns as column (column.key)}
							{#if visibleColumns[column.key]}
								<td
									class="border-base-300 text-base-content px-4 py-2 {getStickyClass(
										column.key
									)} {getAlignmentClass(column)} {column.cellClass || ''} {column.key ===
									'playerList'
										? 'align-top'
										: ''}"
									class:action-cell={column.key === 'action'}
								>
									{#if column.key === 'action'}
										<div class="flex items-center justify-center gap-1">
											<button
												type="button"
												class="btn btn-sm btn-primary flex-1"
												onclick={() => handleAction(item, 'join')}
											>
												{m['app.button.join']()}
											</button>
											{#if onShare}
												<button
													type="button"
													class="btn btn-sm btn-outline flex-1"
													onclick={() => onShare(item)}
												>
													<Share class="size-4" />
												</button>
											{/if}
										</div>
									{:else if column.key === 'mapId'}
										<div class="flex items-center gap-2">
											<span class="truncate">{@html getDisplayValue(item, column)}</span>
											{#if maps && maps.find((m) => m.path === item.mapId) && onMapView}
												<button
													type="button"
													class="btn btn-ghost btn-xs btn-circle"
													onclick={() => onMapView(maps.find((m) => m.path === item.mapId)!)}
													title={m['app.ariaLabel.previewMap']()}
												>
													<Eye class="size-4" />
												</button>
											{/if}
										</div>
									{:else if column.key === 'url' && item.url}
										<a
											href={item.url}
											target="_blank"
											rel="noopener noreferrer"
											class="link link-primary inline-flex min-h-6 items-center underline-offset-4 hover:underline"
											title={item.url}
										>
											{item.url.length > 50 ? item.url.substring(0, 47) + '...' : item.url}
										</a>
									{:else}
										{@html getDisplayValue(item, column)}
									{/if}
								</td>
							{/if}
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	/* ServerTable specific widths - scoped to .server-table-wrapper */
	:global(.server-table-wrapper .sticky-name) {
		min-width: 14rem;
	}

	:global(.server-table-wrapper .sticky-name-header) {
		min-width: 14rem;
	}

	:global(.server-table-wrapper .action-cell) {
		min-width: 12rem;
		width: 12rem;
	}

	:global(.server-table-wrapper .action-header) {
		min-width: 12rem;
		width: 12rem;
	}

	/* ServerTable specific mobile adjustments */
	@media (max-width: 768px) {
		:global(.server-table-wrapper .min-w-96) {
			min-width: 20rem;
		}
	}
</style>
