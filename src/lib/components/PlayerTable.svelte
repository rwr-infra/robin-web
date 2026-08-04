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
		<Info class="h-6 w-6 shrink-0 stroke-current" />
		<span>
			<TranslatedText key="app.player.noPlayersFound" />
			{#if searchQuery}
				<TranslatedText key="app.player.matchingSearch" />
			{/if}.
		</span>
	</div>
{:else}
	<div class="w-full player-table-wrapper">
		<table class="table-pin-rows mb-0 table table-zebra border-0 bg-mil-primary">
			<thead>
				<tr class="bg-mil-secondary">
					{#each playerColumns as column (column.key)}
						{#if visibleColumns[column.key]}
							<th
								class="sticky top-0 z-10 h-12 border-mil px-1 py-1 align-middle text-mil-primary {getStickyClass(column.key)}"
								class:sticky-row-number-header={column.key === 'rowNumber'}
								class:sticky-username-header={column.key === 'username'}
								class:action-header={column.key === 'action'}
							>
								{#if column.key === 'action' || column.key === 'rowNumber' || column.key === 'rankName'}
									<!-- No sort button for action, rowNumber and rankName -->
									<div class="text-center px-2 py-1">
										{#if column.i18n}<TranslatedText
												key={column.i18n}
											/>{:else}{column.label}{/if}
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
											<ArrowDown class="w-4 h-4 opacity-30" />
										{:else}
											<ArrowDown class="w-4 h-4 text-primary" />
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
					{@const isHighlighted = highlightedUsername && item.username.toLowerCase() === highlightedUsername.toLowerCase()}
					<tr class="min-h-12 border-b border-mil {isHighlighted ? 'highlighted-row bg-primary/20 font-semibold' : 'hover hover:bg-base-300'}">
						{#each playerColumns as column (column.key)}
							{#if visibleColumns[column.key]}
								<td
									class="border-mil px-4 py-2 {getStickyClass(column.key)} text-mil-primary {column.alignment === 'center'
										? 'align-middle text-center'
										: column.alignment === 'right'
											? 'align-middle text-right'
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
												<Share class="w-4 h-4" />
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
													<Users class="w-4 h-4" />
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
