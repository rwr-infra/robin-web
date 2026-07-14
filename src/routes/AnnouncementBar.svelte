<script lang="ts">
	import { onMount } from 'svelte';
	import { X } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { AnnouncementService } from '$lib/services/announcement';
	import type { IAnnouncement } from '$lib/models/announcement.model';

	const STORAGE_KEY = 'announcement_dismissed_hash';

	let data = $state<IAnnouncement | null>(null);
	let dismissed = $state(false);
	let contentEl = $state<HTMLElement | null>(null);

	// Visible only when backend enabled, html present, and not dismissed for this content
	let visible = $derived(!!data?.enabled && !!data.html && !dismissed);

	// djb2 hash of the html string - identifies a specific announcement content
	function hashContent(str: string): string {
		let hash = 5381;
		for (let i = 0; i < str.length; i++) {
			hash = (hash * 33) ^ str.charCodeAt(i);
		}
		// Force unsigned 32-bit and stringify in base36
		return (hash >>> 0).toString(36);
	}

	onMount(async () => {
		try {
			const res = await AnnouncementService.get();
			data = res;

			if (res.enabled && res.html) {
				const stored = localStorage.getItem(STORAGE_KEY);
				if (stored && stored === hashContent(res.html)) {
					// Same content already dismissed
					dismissed = true;
				}
			}
		} catch (error) {
			// Silent failure - announcement is non-critical, do not surface an error UI
			console.error('Failed to load announcement:', error);
		}
	});

	function handleClose() {
		if (data?.html) {
			localStorage.setItem(STORAGE_KEY, hashContent(data.html));
		}
		dismissed = true;
	}

	// Harden links inside the rendered rich text: open in new tab safely.
	// Only adds missing attributes; never changes href or text content.
	$effect(() => {
		if (!visible || !contentEl) return;
		const links = contentEl.querySelectorAll('a');
		links.forEach((a) => {
			if (!a.getAttribute('target')) a.setAttribute('target', '_blank');
			if (!a.getAttribute('rel')) a.setAttribute('rel', 'noopener noreferrer');
		});
	});
</script>

{#if visible && data}
	<div
		class="announcement-bar flex w-full justify-center border-b border-mil bg-mil-secondary"
		role="region"
		aria-label="Site announcement"
	>
		<div class="container flex items-center justify-between gap-3 px-4 py-2">
			<div bind:this={contentEl} class="announcement-content min-w-0 flex-1 text-sm text-mil-primary">
				<!-- Rich text from backend, rendered directly (trusted source) -->
				{@html data.html}
			</div>
			<button
				type="button"
				class="btn-tactical inline-flex shrink-0 items-center justify-center p-1"
				aria-label={m['app.announcement.close']()}
				onclick={handleClose}
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	</div>
{/if}

<style>
	/* Base bar styling only - inner markup keeps its own backend-provided classes */
	.announcement-content :global(a) {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
