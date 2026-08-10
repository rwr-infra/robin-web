<script lang="ts">
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { ArrowDown, Info, Share, Users } from '@lucide/svelte';
	import type { IPlayerItem, IPlayerColumn } from '$lib/models/player.model';
	import { escapeHtml } from '$lib/utils/highlight';
	import './table.css';

	interface Props {
		data: IPlayerItem[];
		playerColumns: IPlayerColumn[];
		visibleColumns: Record<string, boolean>;
		searchQuery: string;
		highlightedUsername?: string;
		sortColumn: string | null;
		onSort?: (column: string) => void;
		onShare?: (player: IPlayerItem) => void;
		onFindNeighbors?: (player: IPlayerItem) => void;
	}

	let {
		data = [],
		playerColumns = [],
		visibleColumns = {},
		searchQuery = '',
		highlightedUsername,
		sortColumn = null,
		onSort = () => {},
		onShare,
		onFindNeighbors
	}: Props = $props();

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

	// Handle column sort
	function handleColumnSort(column: string) {
		onSort?.(column);
	}

	// Get sticky class for column
	function getStickyClass(key: string): string {
		if (key === 'rowNumber') return 'sticky-row-number';
		if (key === 'username') return 'sticky-username';
		return '';
	}
</script>

{#if data.length === 0}
	<div class="alert alert-info">
		<Info class="size-6 shrink-0 stroke-current" />
		<span>
			<TranslatedText key="app.player.noPlayersFound" />
			{#if searchQuery}
				<TranslatedText key="app.player.matchingSearch" />
			{/if}.
		</span>
	</div>
{:else}
	<div class="player-table-wrapper w-full">
		<table class="table-pin-rows table-zebra bg-base-200 mb-0 table border-0">
			<thead>
				<tr class="bg-base-100">
					{#each playerColumns as column (column.key)}
						{#if visibleColumns[column.key]}
							<th
								class="border-base-300 text-base-content sticky top-0 z-10 px-1 py-1 align-middle {getStickyClass(
									column.key
								)}"
								class:sticky-row-number-header={column.key === 'rowNumber'}
								class:sticky-username-header={column.key === 'username'}
								class:action-header={column.key === 'action'}
							>
								{#if column.key === 'action' || column.key === 'rowNumber' || column.key === 'rankName'}
									<!-- No sort button for action, rowNumber and rankName -->
									<div class="px-2 py-1 text-center">
										{#if column.i18n}<TranslatedText key={column.i18n} />{:else}{column.label}{/if}
									</div>
								{:else}
									<button
										class="hover:bg-base-300 flex w-full items-center gap-2 rounded px-2 py-2 text-left transition-colors duration-200"
										onclick={() => handleColumnSort(column.key as string)}
										type="button"
										title={m['app.ariaLabel.clickToSort']()}
									>
										<span class="flex-1">
											{#if column.i18n}<TranslatedText
													key={column.i18n}
												/>{:else}{column.label}{/if}
										</span>
										{#if sortColumn !== column.key}
											<ArrowDown class="text-muted size-4" />
										{:else}
											<ArrowDown class="text-primary size-4" />
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
					{@const isHighlighted =
						highlightedUsername &&
						item.username.toLowerCase() === highlightedUsername.toLowerCase()}
					<tr
						id={`player-row-${item.id}`}
						class="border-base-300 border-b {isHighlighted
							? 'highlighted-row bg-primary/20 font-semibold'
							: 'hover hover:bg-base-300'}"
					>
						{#each playerColumns as column (column.key)}
							{#if visibleColumns[column.key]}
								<td
									class="border-base-300 px-4 py-2 {getStickyClass(
										column.key
									)} text-base-content {column.alignment === 'center'
										? 'text-center align-middle'
										: column.alignment === 'right'
											? 'text-right align-middle'
											: 'align-middle'} {column.key === 'action' ? 'action-cell' : ''}"
								>
									{#if column.key === 'action'}
										<div class="flex items-center justify-center gap-1 text-center">
											<button
												type="button"
												class="btn btn-ghost btn-xs btn-circle"
												onclick={() => onShare?.(item)}
												title={m['app.ariaLabel.sharePlayer']()}
											>
												<Share class="size-4" />
											</button>
											{#if onFindNeighbors}
												<button
													type="button"
													class="btn btn-ghost btn-xs btn-circle"
													data-testid="find-neighbors"
													onclick={() => onFindNeighbors(item)}
													title={m['app.player.neighbors.buttonTitle']()}
													aria-label={m['app.ariaLabel.findNeighbors']()}
												>
													<Users class="size-4" />
												</button>
											{/if}
										</div>
									{:else}
										{@html getDisplayValue(item, column, searchQuery)}
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
	/* PlayerTable specific widths - scoped to .player-table-wrapper */
	:global(.player-table-wrapper .sticky-row-number) {
		min-width: 4rem;
		width: 4rem;
	}

	:global(.player-table-wrapper .sticky-row-number-header) {
		min-width: 4rem;
		width: 4rem;
	}

	:global(.player-table-wrapper .sticky-username) {
		min-width: 10rem;
	}

	:global(.player-table-wrapper .sticky-username-header) {
		min-width: 10rem;
	}

	:global(.player-table-wrapper .action-cell) {
		min-width: 6.5rem;
		width: 6.5rem;
	}

	:global(.player-table-wrapper .action-header) {
		min-width: 6.5rem;
		width: 6.5rem;
	}

	/* Mobile responsive adjustments for PlayerTable */
	@media (max-width: 768px) {
		:global(.player-table-wrapper .sticky-row-number),
		:global(.player-table-wrapper .sticky-row-number-header) {
			min-width: 3rem;
		}

		:global(.player-table-wrapper .sticky-username),
		:global(.player-table-wrapper .sticky-username-header) {
			min-width: 3rem;
			left: 3rem;
		}
	}
</style>
