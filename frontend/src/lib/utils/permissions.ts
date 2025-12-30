/**
 * Browser Permissions Manager
 * Handles camera, microphone, and geolocation permissions
 */

export type PermissionType = 'camera' | 'microphone' | 'geolocation';

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  error?: string;
}

export interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<PermissionStatus> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    // Stop all tracks after getting permission
    stream.getTracks().forEach(track => track.stop());
    
    return {
      granted: true,
      denied: false,
      prompt: false,
    };
  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return {
        granted: false,
        denied: true,
        prompt: false,
        error: 'Camera permission denied by user',
      };
    }
    
    return {
      granted: false,
      denied: false,
      prompt: false,
      error: error.message || 'Failed to access camera',
    };
  }
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<PermissionStatus> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Stop all tracks after getting permission
    stream.getTracks().forEach(track => track.stop());
    
    return {
      granted: true,
      denied: false,
      prompt: false,
    };
  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return {
        granted: false,
        denied: true,
        prompt: false,
        error: 'Microphone permission denied by user',
      };
    }
    
    return {
      granted: false,
      denied: false,
      prompt: false,
      error: error.message || 'Failed to access microphone',
    };
  }
}

/**
 * Request geolocation permission
 */
export async function requestGeolocationPermission(): Promise<PermissionStatus> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        granted: false,
        denied: false,
        prompt: false,
        error: 'Geolocation not supported by this browser',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        resolve({
          granted: true,
          denied: false,
          prompt: false,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({
            granted: false,
            denied: true,
            prompt: false,
            error: 'Geolocation permission denied by user',
          });
        } else {
          resolve({
            granted: false,
            denied: false,
            prompt: false,
            error: error.message || 'Failed to get location',
          });
        }
      }
    );
  });
}

/**
 * Check camera permission status (without requesting)
 */
export async function checkCameraPermission(): Promise<PermissionStatus> {
  try {
    if (!navigator.permissions) {
      // Fallback: try to access camera
      return await requestCameraPermission();
    }

    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    
    return {
      granted: result.state === 'granted',
      denied: result.state === 'denied',
      prompt: result.state === 'prompt',
    };
  } catch (error: any) {
    return {
      granted: false,
      denied: false,
      prompt: true,
      error: error.message,
    };
  }
}

/**
 * Check microphone permission status (without requesting)
 */
export async function checkMicrophonePermission(): Promise<PermissionStatus> {
  try {
    if (!navigator.permissions) {
      // Fallback: try to access microphone
      return await requestMicrophonePermission();
    }

    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    
    return {
      granted: result.state === 'granted',
      denied: result.state === 'denied',
      prompt: result.state === 'prompt',
    };
  } catch (error: any) {
    return {
      granted: false,
      denied: false,
      prompt: true,
      error: error.message,
    };
  }
}

/**
 * Check geolocation permission status (without requesting)
 */
export async function checkGeolocationPermission(): Promise<PermissionStatus> {
  try {
    if (!navigator.permissions) {
      return {
        granted: false,
        denied: false,
        prompt: true,
      };
    }

    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    
    return {
      granted: result.state === 'granted',
      denied: result.state === 'denied',
      prompt: result.state === 'prompt',
    };
  } catch (error: any) {
    return {
      granted: false,
      denied: false,
      prompt: true,
      error: error.message,
    };
  }
}

/**
 * Request all permissions at once
 */
export async function requestAllPermissions(): Promise<{
  camera: PermissionStatus;
  microphone: PermissionStatus;
  geolocation: PermissionStatus;
}> {
  const [camera, microphone, geolocation] = await Promise.all([
    requestCameraPermission(),
    requestMicrophonePermission(),
    requestGeolocationPermission(),
  ]);

  return { camera, microphone, geolocation };
}

/**
 * Check all permissions at once
 */
export async function checkAllPermissions(): Promise<{
  camera: PermissionStatus;
  microphone: PermissionStatus;
  geolocation: PermissionStatus;
}> {
  const [camera, microphone, geolocation] = await Promise.all([
    checkCameraPermission(),
    checkMicrophonePermission(),
    checkGeolocationPermission(),
  ]);

  return { camera, microphone, geolocation };
}

/**
 * Get available media devices
 */
export async function getAvailableDevices(): Promise<{
  cameras: DeviceInfo[];
  microphones: DeviceInfo[];
}> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    const cameras = devices
      .filter(device => device.kind === 'videoinput')
      .map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
        kind: device.kind,
      }));

    const microphones = devices
      .filter(device => device.kind === 'audioinput')
      .map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${device.deviceId.slice(0, 5)}`,
        kind: device.kind,
      }));

    return { cameras, microphones };
  } catch (error: any) {
    console.error('Failed to enumerate devices:', error);
    return { cameras: [], microphones: [] };
  }
}

/**
 * Get current location coordinates
 */
export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error('Failed to get location:', error.message);
        resolve(null);
      }
    );
  });
}

/**
 * Watch location changes
 */
export function watchLocation(
  onLocationChange: (coords: { latitude: number; longitude: number; accuracy: number }) => void,
  onError?: (error: GeolocationPositionError) => void
): number | null {
  if (!navigator.geolocation) {
    console.error('Geolocation not supported');
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onLocationChange({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    },
    onError
  );
}

/**
 * Clear location watch
 */
export function clearLocationWatch(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Start camera stream
 */
export async function startCameraStream(
  videoElement: HTMLVideoElement,
  facingMode: 'user' | 'environment' = 'user'
): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    videoElement.srcObject = stream;
    await videoElement.play();

    return stream;
  } catch (error: any) {
    console.error('Failed to start camera stream:', error);
    return null;
  }
}

/**
 * Stop media stream
 */
export function stopMediaStream(stream: MediaStream): void {
  stream.getTracks().forEach(track => track.stop());
}

/**
 * Capture photo from video stream
 */
export function capturePhotoFromStream(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement
): string | null {
  try {
    const context = canvasElement.getContext('2d');
    if (!context) return null;

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    
    context.drawImage(videoElement, 0, 0);
    
    return canvasElement.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to capture photo:', error);
    return null;
  }
}
