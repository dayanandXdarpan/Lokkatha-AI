import { writable } from 'svelte/store';

export interface Notification {
	id: string;
	type: 'success' | 'error' | 'info';
	message: string;
	duration?: number;
	action?: { label: string; onClick: () => void };
}

function createNotificationStore() {
	const { subscribe, update } = writable<Notification[]>([]);

	return {
		subscribe,
		success: (message: string, options: Partial<Notification> = {}) => {
			const id = Date.now().toString() + Math.random();
			const notification: Notification = {
				id,
				type: 'success',
				message,
				duration: 5000,
				...options
			};
			update((notifications) => {
				// Keep max 3 notifications
				const newNotifications = [...notifications, notification];
				return newNotifications.slice(-3);
			});
		},
		error: (message: string, options: Partial<Notification> = {}) => {
			const id = Date.now().toString() + Math.random();
			const notification: Notification = {
				id,
				type: 'error',
				message,
				duration: 5000,
				...options
			};
			update((notifications) => {
				const newNotifications = [...notifications, notification];
				return newNotifications.slice(-3);
			});
		},
		info: (message: string, options: Partial<Notification> = {}) => {
			const id = Date.now().toString() + Math.random();
			const notification: Notification = {
				id,
				type: 'info',
				message,
				duration: 5000,
				...options
			};
			update((notifications) => {
				const newNotifications = [...notifications, notification];
				return newNotifications.slice(-3);
			});
		},
		remove: (id: string) => {
			update((notifications) => notifications.filter((n) => n.id !== id));
		},
		clear: () => {
			update(() => []);
		}
	};
}

export const notifications = createNotificationStore();
