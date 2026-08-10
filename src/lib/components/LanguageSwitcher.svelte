<script lang="ts">
	import { setLocale, getLocale, locales } from '$lib/paraglide/runtime';
	import analytics from '$lib/utils/analytics';

	const languageNames: Record<string, { name: string; shortName: string }> = {
		'en-us': { name: 'English', shortName: 'EN' },
		'zh-cn': { name: '中文', shortName: 'CN' }
	};

	const currentLocale = $derived(getLocale());

	function handleLanguageChange(locale: string) {
		setLocale(locale as 'en-us' | 'zh-cn');
		analytics.trackLanguageChange(locale);
	}
</script>

<div class="dropdown dropdown-bottom dropdown-end">
	<div tabindex="-1" role="button" class="btn btn-sm btn-ghost">
		{languageNames[currentLocale]?.shortName || currentLocale.toUpperCase()}
	</div>
	<ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box shadow-e3 z-50 w-48 p-2">
		{#each locales as locale}
			<li>
				<div
					tabindex={currentLocale === locale ? 0 : -1}
					role="button"
					class="flex items-center justify-between {currentLocale === locale
						? 'active bg-primary text-primary-content'
						: ''}"
					onclick={() => handleLanguageChange(locale)}
					onkeydown={(e) => e.key === 'Enter' && handleLanguageChange(locale)}
					aria-label={`Switch to ${languageNames[locale]?.name || locale}`}
					title={`Switch to ${languageNames[locale]?.name || locale}`}
				>
					<span>{languageNames[locale]?.name || locale}</span>
					{#if currentLocale === locale}
						<span class="text-xs">✓</span>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</div>

<style>
</style>
