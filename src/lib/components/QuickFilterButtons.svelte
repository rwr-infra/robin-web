<script lang="ts">
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import { filters } from '$lib/utils/quick-filters';

	interface Props {
		isLoading: boolean;
		onQuickFilter: (filterId: string) => void;
		activeFilters: string[];
		isMultiSelect: boolean;
		onMultiSelectChange: (checked: boolean) => void;
	}

	let {
		isLoading = false,
		onQuickFilter = () => {},
		activeFilters = [],
		isMultiSelect = false,
		onMultiSelectChange = () => {}
	}: Props = $props();

	function handleQuickFilter(filterId: string) {
		onQuickFilter(filterId);
	}

	function handleMultiSelectChange(event: Event) {
		const target = event.target as HTMLInputElement;
		onMultiSelectChange(target.checked);
	}
</script>

<div class="mt-2 mb-3 flex flex-wrap items-center gap-3 md:mb-2">
	<label class="flex cursor-pointer items-center gap-2">
		<input
			type="checkbox"
			checked={isMultiSelect}
			onchange={handleMultiSelectChange}
			disabled={isLoading}
			class="toggle toggle-md sm:toggle-sm"
			aria-label="Toggle multiple selection"
			name="multiple-select"
		/>
		<span class="text-sm">
			<TranslatedText key="app.switch.multipleSelect" />
		</span>
	</label>

	<div class="flex flex-wrap gap-2" id="quick-filter-buttons">
		{#each filters as filter (filter.id)}
			<button
				class="btn btn-sm {activeFilters.includes(filter.id) ? 'btn-primary' : 'btn-outline'}"
				class:font-bold={activeFilters.includes(filter.id)}
				class:border-2={activeFilters.includes(filter.id)}
				class:border-primary={activeFilters.includes(filter.id)}
				class:shadow-xs={activeFilters.includes(filter.id)}
				disabled={isLoading}
				onclick={() => handleQuickFilter(filter.id)}
				type="button"
			>
				<TranslatedText key={filter.labelKey} />
			</button>
		{/each}
	</div>
</div>
