<script lang="ts">
	import { onMount } from 'svelte';

	// Responsive Christmas snowfall background effect - Pure CSS implementation
	// Desktop: 50 snowflakes, Mobile: 10 snowflakes

	let snowflakeCount = $state(10); // Default mobile count
	let snowflakes = $state<
		Array<{
			id: number;
			left: number;
			animationDelay: number;
			animationDuration: number;
			size: number;
			opacity: number;
		}>
	>([]);

	function generateSnowflakes(count: number) {
		return Array.from({ length: count }, (_, i) => ({
			id: i,
			left: Math.random() * 100,
			animationDelay: Math.random() * 10,
			animationDuration: 10 + Math.random() * 10,
			size: 0.5 + Math.random() * 1.5,
			opacity: 0.3 + Math.random() * 0.4
		}));
	}

	function updateSnowflakeCount() {
		// Desktop (>= 768px): 50 snowflakes
		// Mobile (< 768px): 10 snowflakes
		const isMobile = window.innerWidth < 768;
		const newCount = isMobile ? 10 : 50;

		if (newCount !== snowflakeCount) {
			snowflakeCount = newCount;
			snowflakes = generateSnowflakes(newCount);
		}
	}

	onMount(() => {
		// Initialize
		updateSnowflakeCount();

		// Listen for window resize
		window.addEventListener('resize', updateSnowflakeCount);

		return () => {
			window.removeEventListener('resize', updateSnowflakeCount);
		};
	});
</script>

<div class="christmas-snowfall pointer-events-none fixed inset-0 z-50" aria-hidden="true">
	{#each snowflakes as flake (flake.id)}
		<div
			class="snowflake absolute"
			style="left: {flake.left}%; animation-delay: {flake.animationDelay}s; animation-duration: {flake.animationDuration}s; font-size: {flake.size}rem; opacity: {flake.opacity};"
		>
			❄
		</div>
	{/each}
</div>

<style>
	.christmas-snowfall {
		overflow: hidden;
	}

	.snowflake {
		color: #fff;
		user-select: none;
		animation: fall linear infinite;
		text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
	}

	/* Dark theme snowflakes - use :has() selector or data attribute */
	:global(html[data-theme='dark']) .snowflake {
		color: #e0f2fe;
		text-shadow: 0 0 8px rgba(224, 242, 254, 0.6);
	}

	/* Light theme snowflakes */
	:global(html[data-theme='light']) .snowflake {
		color: #bae6fd;
		text-shadow: 0 0 5px rgba(186, 230, 253, 0.4);
	}

	@keyframes fall {
		0% {
			transform: translateY(-10vh) rotate(0deg);
		}
		100% {
			transform: translateY(110vh) rotate(360deg);
		}
	}

	/* Mobile optimization: reduce blur effect */
	@media (max-width: 768px) {
		.snowflake {
			text-shadow: 0 0 3px rgba(255, 255, 255, 0.3);
		}
	}
</style>
