<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	export let type: 'success' | 'error' | 'info' = 'info';
	export let message: string;
	export let duration = 5000;
	export let action: { label: string; onClick: () => void } | null = null;
	export let onClose: () => void;

	let visible = true;
	let progress = 100;
	let interval: number;

	onMount(() => {
		if (duration > 0) {
			interval = setInterval(() => {
				progress -= (100 / duration) * 100;
				if (progress <= 0) {
					close();
				}
			}, 100);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	});

	function close() {
		visible = false;
		setTimeout(() => {
			onClose();
		}, 300);
	}

	const icons = {
		success: '✅',
		error: '❌',
		info: 'ℹ️'
	};

	const colors = {
		success: '#10B981',
		error: '#EF4444',
		info: '#3B82F6'
	};
</script>

{#if visible}
	<div
		class="toast toast-{type}"
		role="alert"
		aria-live="polite"
		transition:fly={{ y: 50, duration: 300 }}
	>
		<div class="toast-icon" aria-hidden="true">
			{icons[type]}
		</div>
		<div class="toast-content">
			<p class="toast-message">{message}</p>
			{#if action}
				<button class="toast-action" on:click={action.onClick} type="button">
					{action.label}
				</button>
			{/if}
		</div>
		<button class="toast-close" on:click={close} aria-label="Close notification" type="button">
			×
		</button>
		{#if duration > 0}
			<div class="toast-progress" style="width: {progress}%; background-color: {colors[type]}"></div>
		{/if}
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		bottom: 80px;
		left: 50%;
		transform: translateX(-50%);
		width: calc(100% - 32px);
		max-width: 500px;
		padding: 16px;
		background: white;
		border-radius: 12px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: flex-start;
		gap: 12px;
		z-index: 9999;
		border-left: 4px solid;
	}

	.toast-success {
		border-left-color: #10b981;
	}

	.toast-error {
		border-left-color: #ef4444;
	}

	.toast-info {
		border-left-color: #3b82f6;
	}

	.toast-icon {
		font-size: 24px;
		line-height: 1;
		flex-shrink: 0;
	}

	.toast-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.toast-message {
		margin: 0;
		font-size: 15px;
		line-height: 1.5;
		color: #1f2937;
	}

	.toast-action {
		align-self: flex-start;
		padding: 6px 12px;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.toast-action:hover {
		background: #2563eb;
	}

	.toast-action:active {
		background: #1d4ed8;
	}

	.toast-close {
		background: none;
		border: none;
		font-size: 28px;
		line-height: 1;
		color: #9ca3af;
		cursor: pointer;
		padding: 0;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.toast-close:hover {
		background: #f3f4f6;
		color: #6b7280;
	}

	.toast-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 3px;
		transition: width 0.1s linear;
		border-radius: 0 0 0 12px;
	}

	@media (max-width: 640px) {
		.toast {
			bottom: 60px;
			width: calc(100% - 24px);
		}

		.toast-icon {
			font-size: 20px;
		}

		.toast-message {
			font-size: 14px;
		}
	}
</style>
