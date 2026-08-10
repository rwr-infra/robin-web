<script lang="ts">
	import type { Snippet } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		show: boolean;
		title: string;
		/** Secondary line under the title — de-emphasized, never the same weight. */
		subtitle?: string;
		/** Max width of the dialog box. */
		widthClass?: string;
		/** Padding of the content well. */
		contentClass?: string;
		/** Renders the ✕ in the header. Off when the footer already closes it. */
		dismissible?: boolean;
		onClose?: () => void;
		children: Snippet;
		footer?: Snippet;
	}

	let {
		show,
		title,
		subtitle,
		widthClass = 'max-w-4xl',
		contentClass = 'p-6',
		dismissible = false,
		onClose,
		children,
		footer
	}: Props = $props();

	function close() {
		onClose?.();
	}
</script>

<!--
	Shared chrome for every dialog in the app: header / content well / footer,
	plus the backdrop. Elevation is the top step of the shadow ladder — modals are
	the only thing allowed to use it (Refactoring UI p.160).
	The content well is *darker* than the box, so it reads as recessed (p.149).
-->
{#if show}
	<dialog class="modal modal-open" onclose={close}>
		<div
			class="modal-box shadow-e5 flex flex-col p-0 {widthClass}"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === 'Escape') close();
			}}
		>
			<div class="border-base-300 flex shrink-0 items-start justify-between gap-3 border-b p-4">
				<div class="min-w-0">
					<h3 class="text-base-content truncate text-lg font-semibold">{title}</h3>
					{#if subtitle}
						<p class="text-base-content/70 truncate text-sm">{subtitle}</p>
					{/if}
				</div>
				{#if dismissible}
					<button
						class="btn btn-circle btn-ghost btn-sm shrink-0"
						onclick={close}
						type="button"
						aria-label={m['app.map.close']()}
					>
						✕
					</button>
				{/if}
			</div>

			<div class="bg-base-200/30 flex items-center justify-center {contentClass}">
				{@render children()}
			</div>

			{#if footer}
				<div class="border-base-300 shrink-0 border-t p-4">
					{@render footer()}
				</div>
			{/if}
		</div>

		<!-- daisyUI's backdrop control: intentionally invisible and full-bleed, so
		     it carries no hover treatment of its own. -->
		<form method="dialog" class="modal-backdrop">
			<button class="cursor-default" aria-label={m['app.map.close']()}>close</button>
		</form>
	</dialog>
{/if}
