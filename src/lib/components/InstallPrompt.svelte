<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Download } from '@lucide/svelte';
	import TranslatedText from './TranslatedText.svelte';

	interface BeforeInstallPromptEvent extends Event {
		prompt: () => Promise<void> | void;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
	}

	let deferredPrompt: BeforeInstallPromptEvent | null = null;
	let showInstallPrompt = $state(false);

	onMount(() => {
		if (!browser) return;

		// Check if app is already installed
		const iosNavigator = window.navigator as Navigator & { standalone?: boolean };
		const isInstalled =
			window.matchMedia('(display-mode: standalone)').matches || iosNavigator.standalone === true;

		if (isInstalled) {
			return;
		}

		// Check if user has dismissed the prompt
		const dismissed = localStorage.getItem('pwa-install-prompt-dismissed');
		if (dismissed === 'true') {
			return;
		}

		const handler = (e: Event) => {
			// Prevent Chrome 67 and earlier from automatically showing the prompt
			e.preventDefault();
			deferredPrompt = e as BeforeInstallPromptEvent;
			showInstallPrompt = true;
		};

		window.addEventListener('beforeinstallprompt', handler);

		return () => {
			window.removeEventListener('beforeinstallprompt', handler);
		};
	});

	async function installApp() {
		if (!deferredPrompt) return;

		// Show the install prompt
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			showInstallPrompt = false;
		}

		deferredPrompt = null;
	}

	function dismiss() {
		showInstallPrompt = false;
		localStorage.setItem('pwa-install-prompt-dismissed', 'true');
	}
</script>

{#if showInstallPrompt}
	<div
		class="alert alert-success fixed right-4 bottom-4 z-50 flex max-w-sm items-center gap-4 shadow-lg transition-all"
	>
		<Download class="h-8 w-8 shrink-0" />
		<div class="flex-1">
			<p class="font-bold"><TranslatedText key="app.pwa.install.title" /></p>
			<p class="text-sm opacity-90"><TranslatedText key="app.pwa.install.description" /></p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-sm btn-ghost" onclick={dismiss}
				><TranslatedText key="app.pwa.install.later" /></button
			>
			<button class="btn btn-sm btn-primary" onclick={installApp}
				><TranslatedText key="app.pwa.install.button" /></button
			>
		</div>
	</div>
{/if}
