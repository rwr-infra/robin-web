<script lang="ts">
	import { Snowflake } from '@lucide/svelte';

	// Christmas header decoration component
	// Holiday theme blended with military style
</script>

<div class="christmas-decoration inline-flex items-center gap-2">
	<!-- Left snowflake decoration -->
	<Snowflake
		class="snowflake-icon-left size-4 text-blue-300 md:size-5 dark:text-blue-200"
		aria-hidden="true"
	/>

	<!-- Right snowflake decoration -->
	<Snowflake
		class="snowflake-icon-right size-4 text-cyan-300 dark:text-cyan-200"
		aria-hidden="true"
	/>
</div>

<style>
	/* :global — the class reaches the <svg> through a component prop, so
	   Svelte's scoper cannot see it and would strip these rules. */
	.christmas-decoration :global(.snowflake-icon-left) {
		animation: spin 8s linear infinite;
	}

	.christmas-decoration :global(.snowflake-icon-right) {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
