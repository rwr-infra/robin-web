<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { Maximize2, Minimize2 } from '@lucide/svelte';

	interface Props {
		layoutMode: 'fullPage' | 'tableOnly';
		onToggleChange: (mode: 'fullPage' | 'tableOnly') => void;
	}

	let { layoutMode = 'fullPage', onToggleChange }: Props = $props();

	function handleToggle() {
		const newMode = layoutMode === 'fullPage' ? 'tableOnly' : 'fullPage';
		onToggleChange(newMode);
	}
</script>

<button
	type="button"
	class="btn btn-outline flex-shrink-0"
	onclick={handleToggle}
	title={m['app.layoutMode.tooltip']()}
>
	{#if layoutMode === 'fullPage'}
		<Maximize2 class="h-4 w-4" />
	{:else}
		<Minimize2 class="h-4 w-4" />
	{/if}
	<span class="hidden sm:inline">
		{m['app.layoutMode.button']()}
	</span>
</button>
