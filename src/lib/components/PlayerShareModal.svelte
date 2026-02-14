<script lang="ts">
	import PlayerShareCard from '$lib/components/PlayerShareCard.svelte';
	import PlayerShareCardMobile from '$lib/components/PlayerShareCardMobile.svelte';
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import { playerShareService } from '$lib/services/player-share';
	import { analytics } from '$lib/utils/analytics';
	import { m } from '$lib/paraglide/messages.js';
	import type { IPlayerItem } from '$lib/models/player.model';
	import { Download, Copy, Check, CircleAlert, LoaderCircle, Trophy } from '@lucide/svelte';

	interface Props {
		player?: IPlayerItem;
		show: boolean;
		onClose?: () => void;
		// Query timestamp for data freshness
		queryTimestamp?: number;
		// Callback to fetch rankings - returns field key to ranking position mapping
		onFetchRankings?: () => Promise<Record<string, number>>;
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
	let isGenerating = $state(false);
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

	function handleEditStart() {
		// Extensibility hook for future image editor
		if (onEditStart) {
			onEditStart();
		}
	}

	// Check if clipboard is supported
	const canCopy = $derived(playerShareService.canCopyToClipboard());
</script>

{#if player}
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
				<div class="flex items-center justify-between border-b border-base-300 p-4">
					<div>
						<h3 class="font-semibold text-lg">
							<TranslatedText key="app.player.shareModal.title" />
						</h3>
						<p class="text-base-content/60 text-sm">{player.username}</p>
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
				<div class="flex items-center justify-center bg-base-200/30 p-6">
					<!-- Error state -->
					{#if errorMessage}
						<div class="flex flex-col items-center gap-4">
							<CircleAlert class="text-error h-16 w-16" />
							<div class="text-center">
								<p class="text-base-content/70 text-sm mb-2">
									<TranslatedText key="app.player.shareModal.error" />
								</p>
								<p class="text-error text-sm">{errorMessage}</p>
							</div>
							<button
								class="btn btn-outline btn-sm"
								onclick={handleDownload}
								type="button"
							>
								<TranslatedText key="app.player.shareModal.retry" />
							</button>
						</div>
					{:else if isLoadingRankings}
						<!-- Loading rankings state -->
						<div class="flex flex-col items-center gap-4">
							<LoaderCircle class="text-primary h-16 w-16 animate-spin" />
							<p class="text-base-content/70 text-center text-sm">
								<TranslatedText key="app.player.shareModal.loadingRankings" />
							</p>
						</div>
					{:else}
						<!-- Share Card Preview -->
						<div class="flex w-full justify-center overflow-auto">
							<div bind:this={cardElement} class="inline-block p-3 bg-base-200 rounded-xl">
								{#if isMobile}
									<PlayerShareCardMobile
										{player}
										queryTimestamp={displayTimestamp}
										{rankings}
										{customTheme}
										{showWatermark}
										{watermarkText}
										{customSections}
										{hiddenFields}
									/>
								{:else}
									<PlayerShareCard
										{player}
										queryTimestamp={displayTimestamp}
										{rankings}
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
				<div class="border-t border-base-300 p-4">
					<div class="flex flex-wrap items-center justify-center gap-3">
						<!-- Download button -->
						<button
							class="btn btn-primary flex-1 min-w-[140px]"
							onclick={handleDownload}
							disabled={isDownloading || isCopying || isLoadingRankings}
							type="button"
						>
							{#if isDownloading}
								<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
								<TranslatedText key="app.player.shareModal.downloading" />
							{:else}
								<Download class="mr-2 h-4 w-4" />
								<TranslatedText key="app.player.shareModal.download" />
							{/if}
						</button>

						<!-- Copy button (only if supported) -->
						{#if canCopy}
							<button
								class="btn btn-secondary flex-1 min-w-[140px]"
								onclick={handleCopy}
								disabled={isCopying || isDownloading || isLoadingRankings}
								type="button"
							>
								{#if isCopying}
									<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
									<TranslatedText key="app.player.shareModal.copying" />
								{:else if copySuccess}
									<Check class="mr-2 h-4 w-4" />
									<TranslatedText key="app.player.shareModal.copied" />
								{:else}
									<Copy class="mr-2 h-4 w-4" />
									<TranslatedText key="app.player.shareModal.copy" />
								{/if}
							</button>
						{/if}

						<!-- Edit button placeholder for future image editor -->
						<!-- Hidden for now, but structure is in place
						{#if onEditStart}
							<button
								class="btn btn-outline"
								onclick={handleEditStart}
								type="button"
							>
								<TranslatedText key="app.player.shareModal.edit" />
							</button>
						{/if}
						-->
					</div>

					<!-- Help text -->
					<p class="text-base-content/50 mt-3 text-center text-xs">
						<TranslatedText key="app.player.shareModal.help" />
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
