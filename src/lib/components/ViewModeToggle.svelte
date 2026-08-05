<script lang="ts">
	import TranslatedText from '$lib/components/TranslatedText.svelte';

	interface Props {
		currentView: 'servers' | 'players';
		onViewChange: (view: 'servers' | 'players') => void;
	}

	let { currentView, onViewChange }: Props = $props();

	function handleViewToggle() {
		onViewChange(currentView === 'servers' ? 'players' : 'servers');
	}
</script>

<button class="btn btn-neutral btn-outline" onclick={handleViewToggle} type="button">
	{#if currentView === 'servers'}
		<TranslatedText key="app.viewMode.players" />
	{:else}
		<TranslatedText key="app.viewMode.servers" />
	{/if}
</button>
