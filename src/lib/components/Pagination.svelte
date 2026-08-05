<script lang="ts">
	import TranslatedText from './TranslatedText.svelte';

	interface Props {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		maxVisiblePages?: number;
		pageChange: (page: number) => void;
	}

	let {
		currentPage = 1,
		totalPages = 1,
		totalItems = 0,
		maxVisiblePages = 5,
		pageChange = () => {}
	}: Props = $props();

	// Generate an array of page numbers to display
	function generatePageNumbers(current: number, total: number, maxVisible: number): number[] {
		// If we have fewer pages than the max we want to show, just return all pages
		if (total <= maxVisible) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}

		// Calculate the start and end of the visible page range
		let start = Math.max(1, current - Math.floor(maxVisible / 2));
		let end = start + maxVisible - 1;

		// Adjust if we're near the end
		if (end > total) {
			end = total;
			start = Math.max(1, end - maxVisible + 1);
		}

		// Generate the array of page numbers
		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	}

	// Computed page numbers - reactive to page changes
	const pageNumbers = $derived(generatePageNumbers(currentPage, totalPages, maxVisiblePages));

	// Navigate to a specific page
	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			pageChange(page);
		}
	}
</script>

{#if totalPages > 1}
	<div class="flex items-center justify-center space-x-2">
		<div class="join">
			<!-- First page button -->
			<button class="join-item btn btn-sm" disabled={currentPage === 1} onclick={() => goToPage(1)}>
				«
			</button>

			<!-- Previous page button -->
			<button
				class="join-item btn btn-sm"
				disabled={currentPage === 1}
				onclick={() => goToPage(currentPage - 1)}
			>
				‹
			</button>

			<!-- Page number buttons -->
			{#each pageNumbers as pageNum}
				<button
					class="join-item btn btn-sm {currentPage === pageNum ? 'btn-active' : ''}"
					onclick={() => goToPage(pageNum)}
				>
					{pageNum}
				</button>
			{/each}

			<!-- Next page button -->
			<button
				class="join-item btn btn-sm"
				disabled={currentPage === totalPages}
				onclick={() => goToPage(currentPage + 1)}
			>
				›
			</button>

			<!-- Last page button -->
			<button
				class="join-item btn btn-sm"
				disabled={currentPage === totalPages}
				onclick={() => goToPage(totalPages)}
			>
				»
			</button>
		</div>

		<!-- Page info -->
		<span class="text-base-content/70 text-sm">
			<TranslatedText key="app.pagination.info" params={{ currentPage, totalPages, totalItems }} />
		</span>
	</div>
{/if}
