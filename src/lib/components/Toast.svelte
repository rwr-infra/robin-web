<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Check, Info, TriangleAlert, CircleX } from '@lucide/svelte';

	interface Props {
		message: string;
		type?: 'success' | 'info' | 'warning' | 'error';
		duration?: number;
	}

	let { message, type = 'success', duration = 2000 }: Props = $props();

	let visible = $state(true);

	// Auto-dismiss
	$effect(() => {
		if (duration > 0) {
			const timer = setTimeout(() => {
				visible = false;
			}, duration);
			return () => clearTimeout(timer);
		}
	});

	// Icon component mapping
	const iconComponents = {
		success: Check,
		info: Info,
		warning: TriangleAlert,
		error: CircleX
	};

	const IconComponent = $derived(iconComponents[type]);
</script>

{#if visible}
	<div transition:fade={{ duration: 300 }}>
		<div class="alert alert-{type} shadow-e3" role="status" aria-live="polite">
			{#if IconComponent}
				<IconComponent class="size-5 shrink-0" />
			{/if}
			<span>{message}</span>
		</div>
	</div>
{/if}
