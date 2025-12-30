import { writable } from 'svelte/store';

// Network status store for demo purposes
// In production, this would detect actual network status
// For demo, it's manually toggleable to show offline functionality

function createNetworkStore() {
	const { subscribe, set, update } = writable(true);

	return {
		subscribe,
		toggle: () => update(n => !n),
		setOnline: () => set(true),
		setOffline: () => set(false)
	};
}

export const isOnline = createNetworkStore();

// Optional: Detect actual browser online/offline status
// Uncomment for production use
/*
if (typeof window !== 'undefined') {
	window.addEventListener('online', () => isOnline.setOnline());
	window.addEventListener('offline', () => isOnline.setOffline());
	
	// Set initial state
	isOnline.set(navigator.onLine);
}
*/
