<script lang="ts">
	import { tick } from 'svelte';
	import ModalShell from '$lib/components/ModalShell.svelte';
	import PlayerShareCard from '$lib/components/PlayerShareCard.svelte';
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import { playerShareService } from '$lib/services/player-share';
	import { analytics } from '$lib/utils/analytics';
	import { m } from '$lib/paraglide/messages.js';
	import type { IPlayerItem } from '$lib/models/player.model';
	import { Download, Copy, Check, CircleAlert, LoaderCircle } from '@lucide/svelte';

	interface Props {
		player?: IPlayerItem;
		show: boolean;
		onClose?: () => void;
		// Query timestamp for data freshness
		queryTimestamp?: number;
		// Callback to fetch rankings - returns field key to ranking position mapping
		onFetchRankings?: () => Promise<Record<string, number>>;
		customTheme?: 'default' | 'dark' | 'light';
		showWatermark?: boolean;
		watermarkText?: string;
		// Extensibility: Allow custom sections
		customSections?: Array<{
			id: string;
			position: 'top' | 'bottom' | 'left' | 'right';
			render: (player: IPlayerItem) => string;
		}>;
		// Extensibility: Allow hiding specific fields
		hiddenFields?: (keyof IPlayerItem | 'rankIcon')[];
	}

	let {
		player,
		show,
		onClose,
		queryTimestamp,
		onFetchRankings,
		customTheme = 'default',
		showWatermark = false,
		watermarkText = '',
		customSections = [],
		hiddenFields = []
	}: Props = $props();

	// State
	let cardElement = $state<HTMLElement | undefined>(undefined);
	let isCopying = $state(false);
	let isDownloading = $state(false);
	let copySuccess = $state(false);
	let errorMessage = $state<string | undefined>(undefined);
	let isLoadingRankings = $state(false);
	let rankings = $state<Record<string, number>>({});
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

	// Load rankings when modal opens
	$effect(() => {
		if (!(show && player && onFetchRankings)) {
			return;
		}

		let isCancelled = false;
		isLoadingRankings = true;

		const loadRankings = async () => {
			try {
				const data = await onFetchRankings();
				if (!isCancelled) {
					rankings = data;
				}
			} catch (error) {
				if (!isCancelled) {
					console.error('Failed to load rankings:', error);
					rankings = {};
				}
			} finally {
				if (!isCancelled) {
					isLoadingRankings = false;
				}
			}
		};

		void loadRankings();

		return () => {
			isCancelled = true;
		};
	});

	// Set display timestamp when modal opens
	$effect(() => {
		if (show) {
			displayTimestamp = queryTimestamp ?? playerShareService.getCurrentTimestamp();
			// Track share modal open
			analytics.trackShareModalOpen(isMobile ? 'mobile' : 'desktop');
		}
	});

	function closeModal() {
		if (onClose) {
			onClose();
		}
		// Reset states
		copySuccess = false;
		errorMessage = undefined;
		rankings = {};
		displayTimestamp = undefined;
	}

	async function handleDownload() {
		if (!player || !cardElement) return;

		isDownloading = true;
		errorMessage = undefined;

		try {
			const blob = await playerShareService.generateImage(cardElement, {
				format: 'png',
				quality: 0.95,
				scale: 2
			});

			const filename = playerShareService.generateFilename(player.username);
			await playerShareService.downloadImage(blob, filename);

			// Track successful download
			analytics.trackShareDownload(isMobile ? 'mobile' : 'desktop', true);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Download failed';

			// Track failed download
			analytics.trackShareDownload(isMobile ? 'mobile' : 'desktop', false);
		} finally {
			isDownloading = false;
		}
	}

	async function handleCopy() {
		if (!player || !cardElement) return;

		isCopying = true;
		copySuccess = false;
		errorMessage = undefined;

		try {
			const blob = await playerShareService.generateImage(cardElement, {
				format: 'png',
				quality: 0.95,
				scale: 2
			});

			await playerShareService.copyToClipboard(blob);
			copySuccess = true;

			// Track successful copy
			analytics.trackShareCopy(isMobile ? 'mobile' : 'desktop', true);

			// Reset success message after 2 seconds
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Copy failed';

			// Track failed copy
			analytics.trackShareCopy(isMobile ? 'mobile' : 'desktop', false);
		} finally {
			isCopying = false;
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
	const canCopy = $derived(playerShareService.canCopyToClipboard());
</script>

{#if player}
	<ModalShell
		{show}
		title={m['app.player.shareModal.title']()}
		subtitle={player.username}
		dismissible
		onClose={closeModal}
	>
		{#if errorMessage}
			<div class="flex max-w-[65ch] flex-col items-center gap-4 text-center">
				<CircleAlert class="text-error size-8" />
				<div>
					<p class="text-base-content/70 mb-2 text-sm">
						<TranslatedText key="app.player.shareModal.error" />
					</p>
					<p class="text-error text-sm">{errorMessage}</p>
				</div>
				<button class="btn btn-outline btn-sm" onclick={handleRetry} type="button">
					<TranslatedText key="app.player.shareModal.retry" />
				</button>
			</div>
		{:else if isLoadingRankings}
			<div class="flex max-w-[65ch] flex-col items-center gap-4">
				<LoaderCircle class="text-primary size-8 animate-spin" />
				<p class="text-base-content/70 text-center text-sm">
					<TranslatedText key="app.player.shareModal.loadingRankings" />
				</p>
			</div>
		{:else}
			<!-- Share Card Preview -->
			<div class="flex w-full justify-center overflow-auto">
				<div bind:this={cardElement} class="bg-base-200 inline-block rounded p-3">
					<PlayerShareCard
						{player}
						variant={isMobile ? 'mobile' : 'desktop'}
						queryTimestamp={displayTimestamp}
						{rankings}
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
					disabled={isDownloading || isCopying || isLoadingRankings}
					type="button"
				>
					{#if isDownloading}
						<LoaderCircle class="mr-2 size-4 animate-spin" />
						<TranslatedText key="app.player.shareModal.downloading" />
					{:else}
						<Download class="mr-2 size-4" />
						<TranslatedText key="app.player.shareModal.download" />
					{/if}
				</button>

				{#if canCopy}
					<button
						class="btn btn-outline min-w-32 flex-1"
						onclick={handleCopy}
						disabled={isCopying || isDownloading || isLoadingRankings}
						type="button"
					>
						{#if isCopying}
							<LoaderCircle class="mr-2 size-4 animate-spin" />
							<TranslatedText key="app.player.shareModal.copying" />
						{:else if copySuccess}
							<Check class="mr-2 size-4" />
							<TranslatedText key="app.player.shareModal.copied" />
						{:else}
							<Copy class="mr-2 size-4" />
							<TranslatedText key="app.player.shareModal.copy" />
						{/if}
					</button>
				{/if}
			</div>

			<p class="text-muted mx-auto mt-3 max-w-[65ch] text-center text-xs">
				<TranslatedText key="app.player.shareModal.help" />
			</p>
		{/snippet}
	</ModalShell>
{/if}
