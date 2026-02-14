<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	let {
		key,
		params = {},
		tag = 'span',
		className = '',
		style = ''
	} = $props<{
		key: string;
		params?: Record<string, unknown>;
		tag?: keyof HTMLElementTagNameMap;
		className?: string;
		style?: string;
	}>();

	const hasKey = $derived(key in m);

	// Type-safe access to messages function
	const getMessage = $derived(
		hasKey
			? (m as unknown as Record<string, (params?: Record<string, unknown>) => string>)[key]
			: () => key
	);
</script>

{#if hasKey}
	<svelte:element this={tag} class={className} style={style}>
		{@html getMessage(params)}
	</svelte:element>
{:else}
	<svelte:element this={tag} class={`${className} text-red-500`} title="Missing translation key">
		{key}
	</svelte:element>
{/if}
