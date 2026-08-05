<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		currentSize: number;
		onSizeChange: (size: number) => void;
		min?: number;
		max?: number;
		options?: number[];
	}

	let {
		currentSize,
		onSizeChange,
		min = 10,
		max = 100,
		options = [10, 20, 50, 100]
	}: Props = $props();

	const filteredOptions = $derived(options.filter((size) => size >= min && size <= max));

	function handleChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		onSizeChange(Number(select.value));
	}

	// Pre-compute translation labels to avoid Svelte compilation issues with bracket notation in attributes
	const selectAriaLabel = 'Items per page';
	const pageText = m['app.pagination.page'];
</script>

<select
	class="select select-sm select-bordered w-full min-w-32 py-0 sm:w-auto"
	value={currentSize}
	onchange={handleChange}
	aria-label={selectAriaLabel}
	title={selectAriaLabel}
>
	{#each filteredOptions as size (size)}
		<option value={size}>{size} / {pageText()}</option>
	{/each}
</select>
