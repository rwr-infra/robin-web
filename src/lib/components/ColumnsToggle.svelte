<script lang="ts" generics="T extends { key: string; i18n?: string; label?: string }">
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import { Check } from '@lucide/svelte';
	import type { IColumn } from '$lib/models/server.model';

	let {
		columns = [],
		onColumnToggle = () => {},
		visibleColumns = {}
	}: {
		columns: T[];
		visibleColumns: Record<string, boolean>;
		onColumnToggle: (column: T, visible: boolean) => void;
	} = $props();
</script>

<div class="dropdown dropdown-bottom dropdown-end">
	<div tabindex="-1" role="button" class="btn btn-outline flex-shrink-0">
		<TranslatedText key="app.columns.button" />
	</div>
	<ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box shadow-e3 z-50 w-48 p-2">
		{#each columns as column (column.key)}
			<li>
				<button
					type="button"
					class="hover:bg-base-200 flex w-full items-center justify-between rounded p-2 text-left"
					onclick={() => {
						onColumnToggle(column, !visibleColumns[column.key]);
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							onColumnToggle(column, !visibleColumns[column.key]);
						}
					}}
				>
					<span>
						{#if column.i18n}<TranslatedText key={column.i18n} />{:else}{column.label}{/if}
					</span>
					{#if visibleColumns[column.key]}
						<Check class="size-4" />
					{/if}
				</button>
			</li>
		{/each}
	</ul>
</div>

<style>
</style>
