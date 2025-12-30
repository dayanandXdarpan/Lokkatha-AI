import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// Database schema
interface LokKathaDB extends DBSchema {
	lessons: {
		key: string;
		value: LessonData;
		indexes: {
			'by-created': Date;
			'by-subject': string;
			'by-language': string;
		};
	};
}

export interface LessonData {
	id: string;
	title: string;
	subject: string;
	gradeLevel: string;
	language: string;
	videoBlob: Blob;
	thumbnailBlob?: Blob;
	videoUrl?: string; // For remote/public URLs
	subtitleUrl?: string; // For remote/public URLs
	subtitleBlob?: Blob;
	thumbnailUrl?: string;
	description?: string;
	isPublic?: boolean;
	duration: number;
	fileSize: number;
	size?: number; // Alias for fileSize if needed, or prefer fileSize
	createdAt: Date;
	lastAccessedAt: Date;
}

const DB_NAME = 'lokkatha-lessons';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<LokKathaDB>> | null = null;

// Initialize database
async function getDB(): Promise<IDBPDatabase<LokKathaDB>> {
	if (!dbPromise) {
		dbPromise = openDB<LokKathaDB>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				// Create object store
				const lessonsStore = db.createObjectStore('lessons', {
					keyPath: 'id'
				});

				// Create indexes for filtering
				lessonsStore.createIndex('by-created', 'createdAt');
				lessonsStore.createIndex('by-subject', 'subject');
				lessonsStore.createIndex('by-language', 'language');
			}
		});
	}
	return dbPromise;
}

/**
 * Save a lesson to IndexedDB
 */
export async function saveLesson(lesson: LessonData): Promise<void> {
	const db = await getDB();
	await db.put('lessons', lesson);
}

/**
 * Get a specific lesson by ID
 */
export async function getLesson(id: string): Promise<LessonData | undefined> {
	const db = await getDB();
	const lesson = await db.get('lessons', id);

	if (lesson) {
		// Update last accessed time
		lesson.lastAccessedAt = new Date();
		await db.put('lessons', lesson);
	}

	return lesson;
}

/**
 * Get all lessons sorted by creation date (newest first)
 */
export async function getAllLessons(): Promise<LessonData[]> {
	const db = await getDB();
	const lessons = await db.getAllFromIndex('lessons', 'by-created');
	return lessons.reverse(); // Newest first
}

/**
 * Delete a lesson
 */
export async function deleteLesson(id: string): Promise<void> {
	const db = await getDB();
	await db.delete('lessons', id);
}

/**
 * Get storage usage statistics
 */
export async function getStorageUsage(): Promise<{
	used: number;
	quota: number;
	percentage: number;
}> {
	if ('storage' in navigator && 'estimate' in navigator.storage) {
		const estimate = await navigator.storage.estimate();
		const used = estimate.usage || 0;
		const quota = estimate.quota || 0;
		const percentage = quota > 0 ? (used / quota) * 100 : 0;

		return {
			used: Math.round(used / (1024 * 1024)), // Convert to MB
			quota: Math.round(quota / (1024 * 1024)),
			percentage: Math.round(percentage)
		};
	}

	return { used: 0, quota: 0, percentage: 0 };
}

/**
 * Get total size of all lessons
 */
export async function getTotalLessonsSize(): Promise<number> {
	const lessons = await getAllLessons();
	const totalBytes = lessons.reduce((sum, lesson) => sum + lesson.fileSize, 0);
	return Math.round(totalBytes / (1024 * 1024)); // Convert to MB
}

/**
 * Clear all lessons (for storage management)
 */
export async function clearAllLessons(): Promise<void> {
	const db = await getDB();
	await db.clear('lessons');
}
