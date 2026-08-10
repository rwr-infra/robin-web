<script lang="ts">
	import BrandIcon from '$lib/components/icons/BrandIcon.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import analytics from '$lib/utils/analytics';

	// One definition for all four external links. These are tertiary actions:
	// they rest at secondary contrast so the title reads as the primary element
	// (Refactoring UI p.39 — emphasize by de-emphasizing), and only reach full
	// contrast on hover.
	const linkClass =
		'btn-tactical text-base-content/70 hover:text-primary-content inline-flex items-center justify-center px-2 py-1 text-xs no-underline transition-all sm:px-3 sm:py-2 sm:text-sm';

	function handleGitHubClick() {
		analytics.trackGitHubClick();
	}

	function handleDiscordClick() {
		analytics.trackDiscordClick();
	}

	function handleSteam1Click() {
		analytics.trackSteamRwr1Click();
	}

	function handleSteam2Click() {
		analytics.trackSteamRwr2Click();
	}
</script>

<!-- .header-stripe already draws a 2px primary bottom border — a second
     border-b would only be overridden (p.206, use fewer borders). -->
<header class="header-stripe bg-base-100 flex w-full justify-center">
	<div class="container px-4 py-3">
		<div class="flex w-full items-center justify-between gap-3">
			<div class="flex flex-col gap-1">
				<div class="flex items-center gap-2">
					<button
						class="cursor-pointer border-none bg-transparent p-0 text-left transition-transform hover:scale-105 active:scale-95"
						aria-label="App title"
					>
						<TranslatedText
							tag="h1"
							key="app.title"
							className="font-display text-xl md:text-2xl font-bold uppercase tracking-wider text-base-content"
						></TranslatedText>
					</button>
				</div>
				<!-- 12px until sm: at 400px the four link buttons squeeze this column to
				     ~100px, and 14px copy wraps to five lines there. -->
				<TranslatedText
					tag="p"
					key="app.subtitle"
					className="font-mono text-xs sm:text-sm tracking-wider text-base-content/70"
				></TranslatedText>
			</div>

			<div class="flex items-center gap-1 sm:gap-2 md:gap-3">
				<a
					href="https://github.com/Kreedzt/rwrs-another-page-v2"
					class={linkClass}
					target="_blank"
					rel="noopener noreferrer"
					title="View on GitHub"
					onclick={handleGitHubClick}
				>
					<BrandIcon name="github" class="size-4" />
					<span class="ml-1 hidden sm:inline md:ml-2">GITHUB</span>
				</a>

				<a
					href="https://discord.gg/runningwithrifles"
					class={linkClass}
					target="_blank"
					rel="noopener noreferrer"
					title="Join Official Discord"
					onclick={handleDiscordClick}
				>
					<BrandIcon name="discord" class="size-4" />
					<span class="ml-1 hidden sm:inline md:ml-2">DISCORD</span>
				</a>

				<a
					href="https://store.steampowered.com/app/270150/RUNNING_WITH_RIFLES/"
					class={linkClass}
					target="_blank"
					rel="noopener noreferrer"
					title="Buy Running with Rifles on Steam"
					onclick={handleSteam1Click}
				>
					<BrandIcon name="steam" class="size-4" />
					<span class="ml-1 hidden sm:inline md:ml-2">RWR 1</span>
				</a>

				<!-- Not released yet, so it sits one step below the other three -->
				<a
					href="https://store.steampowered.com/app/3948470/RUNNING_WITH_RIFLES_2/"
					class="{linkClass} opacity-60"
					target="_blank"
					rel="noopener noreferrer"
					title="Running with Rifles 2 - Coming Soon on Steam"
					onclick={handleSteam2Click}
				>
					<BrandIcon name="steam" class="size-4" />
					<span class="ml-1 hidden sm:inline md:ml-2">RWR 2</span>
				</a>

				<div class="bg-base-content/20 h-4 w-px md:hidden"></div>

				<ThemeToggle />
				<LanguageSwitcher />
			</div>
		</div>
	</div>
</header>
