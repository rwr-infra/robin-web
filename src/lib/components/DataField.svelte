<script lang="ts">
	import type { Snippet } from 'svelte';
	import TranslatedText from '$lib/components/TranslatedText.svelte';

	interface Props {
		/** i18n key for the label. Takes precedence over `label`. */
		labelKey?: string;
		/** Literal label, for columns that carry no i18n key. */
		label?: string;
		/**
		 * Puts the row in its own group, separated from the field list above by a
		 * rule. Used for the action rows (preview map, share, find neighbours).
		 */
		divider?: boolean;
		/** Long values (comments, player lists) read better left-aligned and wrapped. */
		wrap?: boolean;
		children: Snippet;
	}

	let { labelKey, label, divider = false, wrap = false, children }: Props = $props();
</script>

<!--
	One label/value row. The label is deliberately the secondary element and the
	value the primary one (Refactoring UI p.41 — a label is supporting content,
	never styled like the data it labels).
	Group separation is 12px, the gap inside a group 8px, so the larger gap always
	sits between groups (p.83).
-->
{#snippet row()}
	<div class="flex items-center justify-between gap-3 py-1">
		<span class="text-base-content/70 min-w-24 shrink-0 text-sm">
			{#if labelKey}<TranslatedText key={labelKey} />{:else}{label}{/if}:
		</span>
		<div class="text-base-content flex-1 text-sm font-medium {wrap ? 'text-left' : 'text-right'}">
			{@render children()}
		</div>
	</div>
{/snippet}

{#if divider}
	<div class="border-base-200 mt-3 border-t pt-3">
		{@render row()}
	</div>
{:else}
	{@render row()}
{/if}
