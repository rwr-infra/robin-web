<script lang="ts">
	import { confetti } from '@neoconfetti/svelte';

	// Interactive Christmas confetti effect component
	// Uses @neoconfetti/svelte (already installed)

	let showConfetti = $state(false);

	export function trigger() {
		showConfetti = true;
		setTimeout(() => {
			showConfetti = false;
		}, 3000);
	}
</script>

{#if showConfetti}
	<div
		class="confetti-container pointer-events-none fixed top-16 left-1/2 z-[60]"
		use:confetti={{
			particleCount: 50,
			force: 0.5,
			stageWidth: window.innerWidth,
			stageHeight: window.innerHeight,
			colors: ['#bae6fd', '#e0f2fe', '#ffffff', '#7dd3fc', '#38bdf8'],
			destroyAfterDone: true,
			duration: 3000
		}}
	></div>
{/if}

<style>
	.confetti-container {
		transform: translateX(-50%);
	}
</style>
