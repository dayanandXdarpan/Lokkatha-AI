import axios, { type AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
	baseURL: API_BASE_URL,
	timeout: 30000,
	headers: {
		'Content-Type': 'application/json'
	}
});

// Request/Response types
export interface CreateLessonRequest {
	topic: string;
	gradeLevel: string;
	language: string;
	duration: number;
	useImages?: boolean;
	includeSubtitles?: boolean;
	dialect?: string;
	state?: string;
	accentPreference?: string;
}

export interface JobStatus {
	jobId: string;
	status: 'queued' | 'processing' | 'completed' | 'failed';
	progress: number;
	currentStep?: string;
	error?: string;
	createdAt: string;
	completedAt?: string;
}

export interface JobResult {
	videoUrl: string;
	duration: number;
	fileSize: number;
	title: string;
	scenes: number;
}

export interface ValidatedText {
	correctedText: string;
	isValid: boolean;
	confidence: number;
	language?: string;
	issues?: string[];
	qualityScore: number;
	changesMade: string[];
}

export interface ValidateTextParams {
	ocrText: string;
	language: string;
	dialect?: string;
	context?: string;
	confidence: number;
}

export async function validateText(params: ValidateTextParams | string): Promise<ValidatedText> {
	// Handle both string (legacy) and object (new) arguments
	const text = typeof params === 'string' ? params : params.ocrText;

	// Simple mock validation for now
	return {
		correctedText: text,
		isValid: text.length > 10,
		confidence: 0.9,
		issues: text.length <= 10 ? ['Text is too short'] : [],
		qualityScore: 85,
		changesMade: []
	};
}

/**
 * Create a new lesson
 */
export async function createLesson(params: CreateLessonRequest): Promise<string> {
	const response = await apiClient.post('/create/story', params);
	return response.data.data.jobId;
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
	const response = await apiClient.get(`/jobs/${jobId}/status`);
	return response.data.data;
}

/**
 * Download video with progress tracking
 */
export async function downloadVideo(
	jobId: string,
	onProgress?: (progress: number) => void
): Promise<Blob> {
	const response = await apiClient.get(`/jobs/${jobId}/download`, {
		responseType: 'blob',
		onDownloadProgress: (progressEvent: any) => {
			if (onProgress && progressEvent.total) {
				const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
				onProgress(percentCompleted);
			}
		}
	});
	return response.data;
}

/**
 * Delete a job
 */
export async function deleteJob(jobId: string): Promise<void> {
	await apiClient.delete(`/jobs/${jobId}`);
}

/**
 * Check if API is available
 */
export async function checkHealth(): Promise<boolean> {
	try {
		await apiClient.get('/health');
		return true;
	} catch {
		return false;
	}
}

/**
 * Poll job status until complete or failed
 */
export async function pollJobUntilComplete(
	jobId: string,
	onProgress?: (status: JobStatus) => void,
	pollInterval = 3000
): Promise<JobStatus> {
	return new Promise((resolve, reject) => {
		const poll = async () => {
			try {
				const status = await getJobStatus(jobId);

				if (onProgress) {
					onProgress(status);
				}

				if (status.status === 'completed') {
					resolve(status);
				} else if (status.status === 'failed') {
					reject(new Error(status.error || 'Job failed'));
				} else {
					// Continue polling
					setTimeout(poll, pollInterval);
				}
			} catch (error) {
				reject(error);
			}
		};

		poll();
	});
}
