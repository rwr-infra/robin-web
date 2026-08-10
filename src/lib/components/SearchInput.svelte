<script lang="ts">
	import { Search, X } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		placeholder?: string;
		value?: string;
		oninput?: (value: string) => void;
		onEnter?: (value: string) => void;
		onRef?: (input: HTMLInputElement) => void;
		onClear?: () => void;
	}

	let {
		placeholder = 'Search...',
		value = $bindable(''),
		oninput,
		onEnter,
		onRef,
		onClear
	}: Props = $props();

	let inputElement: HTMLInputElement;

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		oninput?.(target.value);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			const target = e.target as HTMLInputElement;
			onEnter?.(target.value);
		}
	}

	function handleClear() {
		value = '';
		onClear?.();
	}

	// Expose the input element to parent
	$effect(() => {
		if (inputElement && onRef) {
			onRef(inputElement);
		}
	});

	// Expose methods to parent component
	export const focus = () => inputElement?.focus();
	export const blur = () => inputElement?.blur();
	export const element = () => inputElement;
</script>

<div class="form-control flex-1">
	<!--
		The focus ring lives on the .input wrapper (daisyUI draws it there, and
		app.css suppresses the inner control's own ring so there is only one).
		The magnifier is de-emphasized with colour rather than opacity — p.187.
	-->
	<label class="input input-bordered relative w-full">
		<Search class="text-base-content/70 size-4 shrink-0" />
		<input
			bind:this={inputElement}
			type="search"
			{placeholder}
			class="grow pr-8"
			bind:value
			oninput={handleInput}
			onkeydown={handleKeydown}
		/>
		<button
			class="hover:bg-base-300 btn btn-ghost btn-circle btn-xs absolute right-1"
			class:hidden={!value || value.length === 0}
			onclick={handleClear}
			type="button"
			aria-label={m['app.search.clearAria']()}
		>
			<X class="size-4" />
		</button>
	</label>
</div>

<style>
	/* Drop the native search affordances — this component ships its own
	   clear button, and the WebKit one duplicates it. */
	input[type='search']::-webkit-search-decoration,
	input[type='search']::-webkit-search-cancel-button,
	input[type='search']::-webkit-search-results-button,
	input[type='search']::-webkit-search-results-decoration {
		-webkit-appearance: none;
	}
</style>
