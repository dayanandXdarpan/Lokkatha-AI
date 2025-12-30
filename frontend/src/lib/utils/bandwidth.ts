/**
 * Bandwidth Detection Utility
 * Detects user's network connection speed and recommends optimal video quality
 */

export interface ConnectionInfo {
	speed: 'slow' | 'medium' | 'fast';
	effectiveType?: string;
	downlink?: number; // Mbps
	rtt?: number; // Round-trip time in ms
	recommendedQuality: 'low' | 'medium' | 'high';
}

/**
 * Detect bandwidth using Network Information API with fallback
 */
export async function detectBandwidth(): Promise<ConnectionInfo> {
	// Try Network Information API first (Chrome, Edge, Opera)
	if ('connection' in navigator) {
		const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
		
		if (connection) {
			const effectiveType = connection.effectiveType; // '2g', '3g', '4g', 'slow-2g'
			const downlink = connection.downlink; // Mbps
			const rtt = connection.rtt; // ms
			
			console.log('Network Information API:', { effectiveType, downlink, rtt });
			
			// Determine speed based on effective type and downlink
			let speed: 'slow' | 'medium' | 'fast';
			let recommendedQuality: 'low' | 'medium' | 'high';
			
			if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 0.5) {
				speed = 'slow';
				recommendedQuality = 'low';
			} else if (effectiveType === '3g' || downlink < 2) {
				speed = 'medium';
				recommendedQuality = 'low'; // Still recommend low for 3G to prevent buffering
			} else if (effectiveType === '4g' && downlink >= 2 && downlink < 10) {
				speed = 'medium';
				recommendedQuality = 'medium';
			} else {
				// 4G with good speed or 5G
				speed = 'fast';
				recommendedQuality = downlink >= 10 ? 'high' : 'medium';
			}
			
			return {
				speed,
				effectiveType,
				downlink,
				rtt,
				recommendedQuality
			};
		}
	}
	
	// Fallback: Measure bandwidth by downloading a test image
	return await measureBandwidthFallback();
}

/**
 * Fallback bandwidth detection using fetch timing
 * Downloads a small test image and measures speed
 */
async function measureBandwidthFallback(): Promise<ConnectionInfo> {
	try {
		// Use a small image from our backend or a CDN
		const testImageUrl = 'https://via.placeholder.com/150'; // 150x150 placeholder image (~5KB)
		const startTime = performance.now();
		
		const response = await fetch(testImageUrl, {
			cache: 'no-store', // Don't use cached version
			mode: 'cors'
		});
		
		const blob = await response.blob();
		const endTime = performance.now();
		
		const durationMs = endTime - startTime;
		const fileSizeBytes = blob.size;
		const fileSizeMb = fileSizeBytes / (1024 * 1024);
		
		// Calculate speed in Mbps
		const durationSeconds = durationMs / 1000;
		const speedMbps = (fileSizeMb * 8) / durationSeconds; // Convert MB to Mb
		
		console.log('Bandwidth fallback measurement:', {
			durationMs,
			fileSizeBytes,
			speedMbps: speedMbps.toFixed(2)
		});
		
		// Categorize speed
		let speed: 'slow' | 'medium' | 'fast';
		let recommendedQuality: 'low' | 'medium' | 'high';
		
		if (speedMbps < 1) {
			// < 1 Mbps - 2G/slow 3G
			speed = 'slow';
			recommendedQuality = 'low';
		} else if (speedMbps < 5) {
			// 1-5 Mbps - 3G/slow 4G
			speed = 'medium';
			recommendedQuality = 'low';
		} else if (speedMbps < 15) {
			// 5-15 Mbps - 4G
			speed = 'medium';
			recommendedQuality = 'medium';
		} else {
			// > 15 Mbps - Fast 4G/5G/Wifi
			speed = 'fast';
			recommendedQuality = 'high';
		}
		
		return {
			speed,
			downlink: speedMbps,
			recommendedQuality
		};
	} catch (error) {
		console.error('Bandwidth detection failed:', error);
		
		// Default to medium quality if detection fails
		return {
			speed: 'medium',
			recommendedQuality: 'medium'
		};
	}
}

/**
 * Get human-readable connection description
 */
export function getConnectionDescription(info: ConnectionInfo): string {
	const descriptions = {
		slow: '2G/Slow 3G - Recommend low quality (360p) for faster loading',
		medium: '3G/4G - Recommend medium quality (480p) for balanced performance',
		fast: 'Fast 4G/5G/Wifi - High quality (720p) recommended'
	};
	
	return descriptions[info.speed];
}

/**
 * Get estimated download time for video based on connection speed
 */
export function estimateDownloadTime(fileSizeMB: number, connectionInfo: ConnectionInfo): string {
	const downlinkMbps = connectionInfo.downlink || getDefaultDownlink(connectionInfo.speed);
	
	// Convert MB to Mb, then divide by downlink speed
	const fileSizeMb = fileSizeMB * 8;
	const durationSeconds = fileSizeMb / downlinkMbps;
	
	if (durationSeconds < 60) {
		return `~${Math.ceil(durationSeconds)} seconds`;
	} else if (durationSeconds < 3600) {
		return `~${Math.ceil(durationSeconds / 60)} minutes`;
	} else {
		return `~${Math.ceil(durationSeconds / 3600)} hours`;
	}
}

/**
 * Get default downlink speed for connection type
 */
function getDefaultDownlink(speed: 'slow' | 'medium' | 'fast'): number {
	const defaults = {
		slow: 0.5,   // 500 Kbps
		medium: 3,   // 3 Mbps
		fast: 20     // 20 Mbps
	};
	
	return defaults[speed];
}

/**
 * Monitor connection changes and notify callback
 */
export function watchConnectionChanges(callback: (info: ConnectionInfo) => void): () => void {
	if ('connection' in navigator) {
		const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
		
		if (connection) {
			const handler = async () => {
				const info = await detectBandwidth();
				callback(info);
			};
			
			connection.addEventListener('change', handler);
			
			// Return cleanup function
			return () => {
				connection.removeEventListener('change', handler);
			};
		}
	}
	
	// No cleanup needed if not supported
	return () => {};
}

/**
 * Check if bandwidth detection is supported
 */
export function isBandwidthDetectionSupported(): boolean {
	return 'connection' in navigator || typeof fetch !== 'undefined';
}
