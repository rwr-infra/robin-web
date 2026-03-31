<script lang="ts">
import { onMount } from 'svelte';
import '../app.css';
import TranslatedText from '$lib/components/TranslatedText.svelte';
import Header from './Header.svelte';
import { getLayoutMode, syncLayoutMode } from '$lib/stores/layout-mode.svelte';

	let { children } = $props();

	// Layout mode from global store - reactive via derived
	let layoutMode = $derived(getLayoutMode());

	// Copyright year range - project launched in 2025, dynamic end year
	const launchYear = 2025;
	const currentYear = $derived(new Date().getFullYear());
	const copyrightYear = $derived(currentYear > launchYear ? `${launchYear}-${currentYear}` : `${launchYear}`);

	const tableOnlyRootClasses = 'md:h-screen md:overflow-hidden';
	const tableOnlyMainClasses = 'md:flex-1 md:overflow-hidden md:min-h-0';

	// Listen for storage changes to sync layout mode across tabs
	onMount(() => {
		const handleStorageChange = () => {
			syncLayoutMode();
		};

		window.addEventListener('storage', handleStorageChange);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
		};
	});

	// Hide loading screen when SvelteKit hydrates
	onMount(() => {
		const loading = document.getElementById('svelte-loading');
		if (loading) {
			loading.style.opacity = '0';
			setTimeout(() => loading.remove(), 300);
		}

		// Replace URL placeholders for community builds
		// This allows runtime replacement of meta tag URLs without breaking SvelteKit prerendering
		const siteUrl = import.meta.env.VITE_SITE_URL;
		const cdnImageUrl = import.meta.env.VITE_CDN_IMAGE_URL || siteUrl;

		if (siteUrl === '__USE_CURRENT_ORIGIN__') {
			// Community build: use current domain
			const currentOrigin = window.location.origin;
			replaceMetaUrls(currentOrigin, currentOrigin);
		} else if (siteUrl && siteUrl !== '__USE_CURRENT_ORIGIN__') {
			// Production build: use configured URL
			replaceMetaUrls(siteUrl, cdnImageUrl);
		}
	});

	function replaceMetaUrls(siteUrl: string, cdnImageUrl: string) {
		// Replace canonical URLs
		document
			.querySelectorAll('link[rel="canonical"]')
			.forEach((el) => el.setAttribute('href', `${siteUrl}/`));

		// Replace alternate language links
		document
			.querySelectorAll('link[rel="alternate"][hreflang]')
			.forEach((el) => el.setAttribute('href', `${siteUrl}/`));

		// Replace OG URLs
		document
			.querySelectorAll('meta[property="og:url"]')
			.forEach((el) => el.setAttribute('content', `${siteUrl}/`));

		// Replace Twitter URLs
		document
			.querySelectorAll('meta[name="twitter:url"]')
			.forEach((el) => el.setAttribute('content', `${siteUrl}/`));

		// Replace OG images
		if (cdnImageUrl !== siteUrl) {
			document
				.querySelectorAll('meta[property="og:image"], meta[property="og:image:url"]')
				.forEach((el) => {
					const src = el.getAttribute('content');
					if (src && src.includes('__VITE_CDN_IMAGE_URL__')) {
						el.setAttribute('content', src.replace(/__VITE_CDN_IMAGE_URL__/g, cdnImageUrl));
					}
				});

			document
				.querySelectorAll('meta[name="twitter:image"]')
				.forEach((el) => {
					const src = el.getAttribute('content');
					if (src && src.includes('__VITE_CDN_IMAGE_URL__')) {
						el.setAttribute('content', src.replace(/__VITE_CDN_IMAGE_URL__/g, cdnImageUrl));
					}
				});
		}
	}
</script>



<!-- PC端: 固定高度布局; 移动端: 正常流式布局 -->
<div
	class={`flex min-h-screen flex-col ${layoutMode === 'tableOnly' ? tableOnlyRootClasses : ''}`}
>
	<Header />

	<main
		class={`flex w-full flex-col flex-1 ${layoutMode === 'tableOnly' ? tableOnlyMainClasses : ''}`}
	>
		{@render children()}
	</main>

	<footer class="footer sm:footer-horizontal footer-center border-t border-mil bg-mil-secondary px-4 py-4 md:py-3">
		<aside class="flex flex-col items-center gap-2 md:gap-1">
			<p class="text-sm md:text-xs text-mil-primary">
				<TranslatedText key="app.footer.developedBy" />
				<a href="https://www.kreedzt.com" target="_blank" rel="noopener noreferrer" class="link link-hover font-bold hover:underline text-mil-primary">
					Kreedzt
				</a>
			</p>
			<p class="text-xs text-mil-secondary">
				<TranslatedText key="app.footer.dataSourced" />
				<a href="http://rwr.runningwithrifles.com/rwr_stats/view_players.php" target="_blank" rel="noopener noreferrer" class="link link-hover underline-offset-4 text-mil-secondary">
					<TranslatedText key="app.footer.rwrStatsApi" />
				</a>
				&bull;
				<a href="http://rwr.runningwithrifles.com/rwr_server_list/view_servers.php" target="_blank" rel="noopener noreferrer" class="link link-hover underline-offset-4 text-mil-secondary">
					<TranslatedText key="app.footer.serverList" />
				</a>
			</p>
			<p class="text-xs text-mil-secondary">
				<TranslatedText key="app.footer.robinWeb" />
				&bull;
				<TranslatedText key="app.footer.copyright" params={{ year: copyrightYear }} />
			</p>
		</aside>
	</footer>
</div>

<style>
</style>
