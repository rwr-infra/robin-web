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
	<label class="input input-bordered relative w-full focus-within:outline-none">
		<Search class="h-[1em] opacity-50" />
		<input
			bind:this={inputElement}
			type="search"
			{placeholder}
			class="grow pr-8 focus:outline-none"
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
			<X class="h-4 w-4" />
		</button>
	</label>
</div>

<style>
	/* 彻底移除浏览器默认的聚焦样式 */
	.input:focus-within {
		outline: none !important;
		box-shadow: none !important;
		border-color: hsl(var(--bc) / 0.3) !important;
	}

	.input input:focus {
		outline: none !important;
		box-shadow: none !important;
		border: none !important;
	}

	/* 移除 search 输入框的特殊样式 */
	input[type='search']:focus {
		outline: none !important;
		box-shadow: none !important;
		border: none !important;
		-webkit-appearance: none !important;
		-moz-appearance: none !important;
		appearance: none !important;
	}

	/* 移除 WebKit 浏览器的默认样式 */
	input[type='search']::-webkit-search-decoration,
	input[type='search']::-webkit-search-cancel-button,
	input[type='search']::-webkit-search-results-button,
	input[type='search']::-webkit-search-results-decoration {
		-webkit-appearance: none !important;
	}
</style>
