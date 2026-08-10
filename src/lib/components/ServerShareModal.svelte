<script lang="ts">
	import { tick } from 'svelte';
	import ModalShell from '$lib/components/ModalShell.svelte';
	import ServerShareCard from '$lib/components/ServerShareCard.svelte';
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import { serverShareService } from '$lib/services/server-share';
	import { analytics } from '$lib/utils/analytics';
	import { m } from '$lib/paraglide/messages.js';
	import type { IDisplayServerItem } from '$lib/models/server.model';
	import { Download, Copy, Check, CircleAlert, LoaderCircle, Server } from '@lucide/svelte';

	interface Props {
		server?: IDisplayServerItem;
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

	/**
	 * The capture target is only rendered in the non-error branch, so the
	 * bindings are null while an error is shown and handleDownload would return
	 * early. Clear the error and let the DOM flush first.
	 */
	async function handleRetry() {
		errorMessage = undefined;
		await tick();
		await handleDownload();
	}

	// Check if clipboard is supported
	const canCopy = $derived(serverShareService.canCopyToClipboard());
</script>

{#if server}
	<ModalShell
		{show}
		title={m['app.server.shareModal.title']()}
		subtitle={server.name}
		dismissible
		onClose={closeModal}
	>
		{#if errorMessage}
			<div class="flex max-w-[65ch] flex-col items-center gap-4 text-center">
				<CircleAlert class="text-error size-8" />
				<div>
					<p class="text-base-content/70 mb-2 text-sm">
						<TranslatedText key="app.server.shareModal.error" />
					</p>
					<p class="text-error text-sm">{errorMessage}</p>
				</div>
				<button class="btn btn-outline btn-sm" onclick={handleRetry} type="button">
					<TranslatedText key="app.server.shareModal.retry" />
				</button>
			</div>
		{:else}
			<!-- Share Card Preview -->
			<div class="flex max-h-[70vh] w-full justify-center overflow-auto">
				<div bind:this={cardElement} class="bg-base-200 inline-block rounded p-3">
					<ServerShareCard
						{server}
						variant={isMobile ? 'mobile' : 'desktop'}
						queryTimestamp={displayTimestamp}
						{customTheme}
						{showWatermark}
						{watermarkText}
						{customSections}
						{hiddenFields}
					/>
				</div>
			</div>
			<!-- Off-screen copy: the preview is scroll-clipped, the capture must not be -->
			<div class="pointer-events-none absolute top-0 -left-[9999px]">
				<div bind:this={captureElement} class="bg-base-200 inline-block rounded p-3">
					<ServerShareCard
						{server}
						variant={isMobile ? 'mobile' : 'desktop'}
						queryTimestamp={displayTimestamp}
						{customTheme}
						{showWatermark}
						{watermarkText}
						{customSections}
						{hiddenFields}
					/>
				</div>
			</div>
		{/if}

		{#snippet footer()}
			<!--
				One primary action, one secondary, help text as tertiary — an
				importance pyramid rather than two equal-weight buttons (p.243).
			-->
			<div class="flex flex-wrap items-center justify-center gap-3">
				<button
					class="btn btn-primary min-w-32 flex-1"
					onclick={handleDownload}
					disabled={isDownloading || isCopying}
					type="button"
				>
					{#if isDownloading}
						<LoaderCircle class="mr-2 size-4 animate-spin" />
						<TranslatedText key="app.server.shareModal.downloading" />
					{:else}
						<Download class="mr-2 size-4" />
						<TranslatedText key="app.server.shareModal.download" />
					{/if}
				</button>

				{#if canCopy}
					<button
						class="btn btn-outline min-w-32 flex-1"
						onclick={handleCopy}
						disabled={isCopying || isDownloading}
						type="button"
					>
						{#if isCopying}
							<LoaderCircle class="mr-2 size-4 animate-spin" />
							<TranslatedText key="app.server.shareModal.copying" />
						{:else if copySuccess}
							<Check class="mr-2 size-4" />
							<TranslatedText key="app.server.shareModal.copied" />
						{:else}
							<Copy class="mr-2 size-4" />
							<TranslatedText key="app.server.shareModal.copy" />
						{/if}
					</button>
				{/if}
			</div>

			<p class="text-muted mx-auto mt-3 max-w-[65ch] text-center text-xs">
				<TranslatedText key="app.server.shareModal.help" />
			</p>
		{/snippet}
	</ModalShell>
{/if}
