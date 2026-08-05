<script lang="ts">
	import ServerShareCard from '$lib/components/ServerShareCard.svelte';
	import ServerShareCardMobile from '$lib/components/ServerShareCardMobile.svelte';
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import { serverShareService } from '$lib/services/server-share';
	import { analytics } from '$lib/utils/analytics';
	import { m } from '$lib/paraglide/messages.js';
	import type { IDisplayServerItem } from '$lib/models/server.model';
	import type { MapData } from '$lib/services/maps';
	import { Download, Copy, Check, CircleAlert, LoaderCircle, Server } from '@lucide/svelte';

	interface Props {
		server?: IDisplayServerItem;
		maps?: MapData[];
		show: boolean;
		onClose?: () => void;
		// Query timestamp for data freshness
		queryTimestamp?: number;
		// Extensibility hooks for future image editor
		onEditStart?: () => void;
		onEditComplete?: (editedImage: Blob) => void;
		customTheme?: 'default' | 'dark' | 'light';
		showWatermark?: boolean;
		watermarkText?: string;
		// Extensibility: Allow custom sections
		customSections?: Array<{
			id: string;
			position: 'top' | 'bottom' | 'left' | 'right';
			render: (server: IDisplayServerItem) => string;
		}>;
		// Extensibility: Allow hiding specific fields
		hiddenFields?: (keyof IDisplayServerItem)[];
	}

	let {
		server,
		maps = [],
		show,
		onClose,
		queryTimestamp,
		onEditStart,
		onEditComplete,
		customTheme = 'default',
		showWatermark = false,
		watermarkText = '',
		customSections = [],
		hiddenFields = []
	}: Props = $props();

	// State
	let cardElement = $state<HTMLElement | undefined>(undefined);
	let captureElement = $state<HTMLElement | undefined>(undefined); // Hidden container for image generation
	let isGenerating = $state(false);
	let isCopying = $state(false);
	let isDownloading = $state(false);
	let copySuccess = $state(false);
	let errorMessage = $state<string | undefined>(undefined);
	let displayTimestamp = $state<number | undefined>(undefined);

	// Detect if mobile device (screen width < 640px)
	let isMobile = $state(false);

	function checkMobile() {
		isMobile = window.innerWidth < 640;
	}

	// Check on mount and window resize
	$effect(() => {
		checkMobile();
		const handleResize = () => checkMobile();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	// Set display timestamp when modal opens
	$effect(() => {
		if (show) {
			displayTimestamp = queryTimestamp ?? serverShareService.getCurrentTimestamp();
			// Track share modal open
			analytics.trackServerShareModalOpen(isMobile ? 'mobile' : 'desktop');
		}
	});

	function closeModal() {
		if (onClose) {
			onClose();
		}
		// Reset states
		copySuccess = false;
		errorMessage = undefined;
		displayTimestamp = undefined;
	}

	async function handleDownload() {
		if (!server || !captureElement) return;

		isDownloading = true;
		errorMessage = undefined;

		try {
			const blob = await serverShareService.generateImage(captureElement, {
				format: 'png',
				quality: 0.95,
				scale: 2
			});

			const filename = serverShareService.generateFilename(server.name);
			await serverShareService.downloadImage(blob, filename);

			// Track successful download
			analytics.trackServerShareDownload(isMobile ? 'mobile' : 'desktop', true);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Download failed';

			// Track failed download
			analytics.trackServerShareDownload(isMobile ? 'mobile' : 'desktop', false);
		} finally {
			isDownloading = false;
		}
	}

	async function handleCopy() {
		if (!server || !captureElement) return;

		isCopying = true;
		copySuccess = false;
		errorMessage = undefined;

		try {
			const blob = await serverShareService.generateImage(captureElement, {
				format: 'png',
				quality: 0.95,
				scale: 2
			});

			await serverShareService.copyToClipboard(blob);
			copySuccess = true;

			// Track successful copy
			analytics.trackServerShareCopy(isMobile ? 'mobile' : 'desktop', true);

			// Reset success message after 2 seconds
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Copy failed';

			// Track failed copy
			analytics.trackServerShareCopy(isMobile ? 'mobile' : 'desktop', false);
		} finally {
			isCopying = false;
		}
	}

	function handleEditStart() {
		// Extensibility hook for future image editor
		if (onEditStart) {
			onEditStart();
		}
	}

	// Check if clipboard is supported
	const canCopy = $derived(serverShareService.canCopyToClipboard());
</script>

{#if server}
	{#if show}
		<dialog class="modal modal-open" onclose={closeModal}>
			<div
				class="modal-box max-w-4xl p-0"
				role="dialog"
				aria-modal="true"
				tabindex="-1"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => {
					if (e.key === 'Escape') closeModal();
				}}
			>
				<!-- Header -->
				<div class="border-base-300 flex items-center justify-between border-b p-4">
					<div>
						<h3 class="text-lg font-semibold">
							<TranslatedText key="app.server.shareModal.title" />
						</h3>
						<p class="text-base-content/60 truncate text-sm">{server.name}</p>
					</div>
					<button
						class="btn btn-circle btn-ghost btn-sm"
						onclick={closeModal}
						type="button"
						aria-label={m['app.map.close']()}
					>
						✕
					</button>
				</div>

				<!-- Content -->
				<div class="bg-base-200/30 flex items-center justify-center p-6">
					<!-- Error state -->
					{#if errorMessage}
						<div class="flex flex-col items-center gap-4">
							<CircleAlert class="text-error h-16 w-16" />
							<div class="text-center">
								<p class="text-base-content/70 mb-2 text-sm">
									<TranslatedText key="app.server.shareModal.error" />
								</p>
								<p class="text-error text-sm">{errorMessage}</p>
							</div>
							<button class="btn btn-outline btn-sm" onclick={handleDownload} type="button">
								<TranslatedText key="app.server.shareModal.retry" />
							</button>
						</div>
					{:else}
						<!-- Share Card Preview -->
						<div class="flex max-h-[70vh] w-full justify-center overflow-auto">
							<div bind:this={cardElement} class="bg-base-200 inline-block rounded-xl p-3">
								{#if isMobile}
									<ServerShareCardMobile
										{server}
										{maps}
										queryTimestamp={displayTimestamp}
										{customTheme}
										{showWatermark}
										{watermarkText}
										{customSections}
										{hiddenFields}
									/>
								{:else}
									<ServerShareCard
										{server}
										{maps}
										queryTimestamp={displayTimestamp}
										{customTheme}
										{showWatermark}
										{watermarkText}
										{customSections}
										{hiddenFields}
									/>
								{/if}
							</div>
						</div>
						<!-- Hidden container for image generation (unlimited height) -->
						<div style="position: absolute; left: -9999px; top: 0; pointer-events: none;">
							<div bind:this={captureElement} class="bg-base-200 inline-block rounded-xl p-3">
								{#if isMobile}
									<ServerShareCardMobile
										{server}
										{maps}
										queryTimestamp={displayTimestamp}
										{customTheme}
										{showWatermark}
										{watermarkText}
										{customSections}
										{hiddenFields}
									/>
								{:else}
									<ServerShareCard
										{server}
										{maps}
										queryTimestamp={displayTimestamp}
										{customTheme}
										{showWatermark}
										{watermarkText}
										{customSections}
										{hiddenFields}
									/>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<!-- Footer with action buttons -->
				<div class="border-base-300 border-t p-4">
					<div class="flex flex-wrap items-center justify-center gap-3">
						<!-- Download button -->
						<button
							class="btn btn-primary min-w-[140px] flex-1"
							onclick={handleDownload}
							disabled={isDownloading || isCopying}
							type="button"
						>
							{#if isDownloading}
								<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
								<TranslatedText key="app.server.shareModal.downloading" />
							{:else}
								<Download class="mr-2 h-4 w-4" />
								<TranslatedText key="app.server.shareModal.download" />
							{/if}
						</button>

						<!-- Copy button (only if supported) -->
						{#if canCopy}
							<button
								class="btn btn-secondary min-w-[140px] flex-1"
								onclick={handleCopy}
								disabled={isCopying || isDownloading}
								type="button"
							>
								{#if isCopying}
									<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
									<TranslatedText key="app.server.shareModal.copying" />
								{:else if copySuccess}
									<Check class="mr-2 h-4 w-4" />
									<TranslatedText key="app.server.shareModal.copied" />
								{:else}
									<Copy class="mr-2 h-4 w-4" />
									<TranslatedText key="app.server.shareModal.copy" />
								{/if}
							</button>
						{/if}
					</div>

					<!-- Help text -->
					<p class="text-base-content/50 mt-3 text-center text-xs">
						<TranslatedText key="app.server.shareModal.help" />
					</p>
				</div>
			</div>

			<!-- Backdrop -->
			<form method="dialog" class="modal-backdrop">
				<button>close</button>
			</form>
		</dialog>
	{/if}
{/if}
