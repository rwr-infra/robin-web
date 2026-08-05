<script lang="ts">
	import BrandIcon from '$lib/components/icons/BrandIcon.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import analytics from '$lib/utils/analytics';

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

<header class="header-stripe border-mil bg-mil-secondary flex w-full justify-center border-b">
	<div class="container px-4 py-2 md:py-3">
		<div class="flex w-full items-center justify-between">
			<div class="flex flex-col gap-0.5">
				<div class="flex items-center gap-2">
					<button
						class="cursor-pointer transition-transform hover:scale-105 active:scale-95"
						aria-label="App title"
					>
						<TranslatedText
							tag="h1"
							key="app.title"
							className="text-lg md:text-xl font-bold uppercase tracking-wider font-display text-mil-primary"
						></TranslatedText>
					</button>
				</div>
				<TranslatedText
					tag="p"
					key="app.subtitle"
					className="text-xs font-mono text-mil-secondary"
					style="letter-spacing: 0.05em;"
				></TranslatedText>
			</div>

			<div class="flex items-center gap-1 sm:gap-2 md:gap-3">
				<a
					href="https://github.com/Kreedzt/rwrs-another-page-v2"
					class="header-link btn-tactical inline-flex items-center justify-center px-1.5 py-1 text-xs transition-all sm:px-2 sm:py-1.5 sm:text-sm md:px-3 md:py-2"
					target="_blank"
					rel="noopener noreferrer"
					title="View on GitHub"
					onclick={handleGitHubClick}
				>
					<BrandIcon name="github" size={16} class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
					<span class="ml-1 hidden sm:inline md:ml-2">GITHUB</span>
				</a>

				<a
					href="https://discord.gg/runningwithrifles"
					class="header-link btn-tactical inline-flex items-center justify-center px-1.5 py-1 text-xs transition-all sm:px-2 sm:py-1.5 sm:text-sm md:px-3 md:py-2"
					target="_blank"
					rel="noopener noreferrer"
					title="Join Official Discord"
					onclick={handleDiscordClick}
				>
					<BrandIcon name="discord" size={16} class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
					<span class="ml-1 hidden sm:inline md:ml-2">DISCORD</span>
				</a>

				<a
					href="https://store.steampowered.com/app/270150/RUNNING_WITH_RIFLES/"
					class="header-link btn-tactical inline-flex items-center justify-center px-1.5 py-1 text-xs transition-all sm:px-2 sm:py-1.5 sm:text-sm md:px-3 md:py-2"
					target="_blank"
					rel="noopener noreferrer"
					title="Buy Running with Rifles on Steam"
					onclick={handleSteam1Click}
				>
					<BrandIcon name="steam" size={16} class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
					<span class="ml-1 hidden sm:inline md:ml-2">RWR 1</span>
				</a>

				<a
					href="https://store.steampowered.com/app/3948470/RUNNING_WITH_RIFLES_2/"
					class="header-link btn-tactical inline-flex items-center justify-center px-1.5 py-1 text-xs opacity-60 transition-all sm:px-2 sm:py-1.5 sm:text-sm md:px-3 md:py-2"
					target="_blank"
					rel="noopener noreferrer"
					title="Running with Rifles 2 - Coming Soon on Steam"
					onclick={handleSteam2Click}
				>
					<BrandIcon name="steam" size={16} opacity={0.6} class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
					<span class="ml-1 hidden sm:inline md:ml-2">RWR 2</span>
				</a>

				<div class="bg-mil-primary/20 h-4 w-px md:hidden"></div>

				<ThemeToggle />
				<LanguageSwitcher />
			</div>
		</div>
	</div>
</header>

<style>
	/* Header link styling - override DaisyUI defaults */
	.header-link {
		text-decoration: none;
	}

	/* Title button style reset */
	header button {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: inherit;
		outline: inherit;
	}
</style>
