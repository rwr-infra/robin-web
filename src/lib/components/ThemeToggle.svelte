<script lang="ts">
	import { Moon, Sun, Palette } from '@lucide/svelte';
	import { theme } from '$lib/stores/theme';
	import { getCurrentTheme } from '$lib/stores/theme';
	import analytics from '$lib/utils/analytics';

	const themes = [
		{ value: 'light', icon: Sun, label: 'Light' },
		{ value: 'dark', icon: Moon, label: 'Dark' },
		{ value: 'system', icon: Palette, label: 'System' }
	] as const;

	let currentTheme = $state<'light' | 'dark' | 'system'>('system');
	let resolvedTheme = $state<'light' | 'dark'>('light');

	// Subscribe to theme changes
	$effect(() => {
		const unsubscribe = theme.subscribe((value) => {
			currentTheme = value;
			resolvedTheme = value === 'system' ? getCurrentTheme() : value;
		});
		return unsubscribe;
	});

	function toggleTheme() {
		const currentIndex = themes.findIndex((t) => t.value === currentTheme);
		const nextIndex = (currentIndex + 1) % themes.length;
		const newTheme = themes[nextIndex].value;
		theme.set(newTheme);
		analytics.trackThemeChange(newTheme);
	}
</script>

<button
	type="button"
	class="btn btn-ghost btn-circle"
	onclick={toggleTheme}
	title="Toggle theme (Current: {currentTheme})"
	aria-label="Toggle theme"
>
	<div class="relative">
		{#if currentTheme === 'light'}
			<Sun class="size-5" />
		{:else if currentTheme === 'dark'}
			<Moon class="size-5" />
		{:else}
			<Palette class="size-5" />
		{/if}
	</div>
</button>
