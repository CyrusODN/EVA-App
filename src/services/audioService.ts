import { Platform, PermissionsAndroid } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

class AudioService {
    private audioRecorderPlayer: AudioRecorderPlayer;
    private path: string | undefined;

    constructor() {
        this.audioRecorderPlayer = new AudioRecorderPlayer();
    }

    /**
     * Check and request microphone permissions
     */
    async checkPermission(): Promise<boolean> {
        if (Platform.OS === 'android') {
            try {
                const grants = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                ]);

                if (
                    grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                    grants['android.permission.READ_EXTERNAL_STORAGE'] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                    grants['android.permission.RECORD_AUDIO'] ===
                    PermissionsAndroid.RESULTS.GRANTED
                ) {
                    console.log('Permissions granted');
                    return true;
                } else {
                    console.log('All required permissions not granted');
                    return false;
                }
            } catch (err) {
                console.warn(err);
                return false;
            }
        } else {
            // iOS
            const result = await check(PERMISSIONS.IOS.MICROPHONE);
            if (result === RESULTS.GRANTED) {
                return true;
            }

            const requestResult = await request(PERMISSIONS.IOS.MICROPHONE);
            return requestResult === RESULTS.GRANTED;
        }
    }

    /**
     * Start recording audio
     */
    async startRecorder(onProgress?: (e: any) => void): Promise<string> {
        try {
            const hasPermission = await this.checkPermission();
            if (!hasPermission) {
                throw new Error('Permission not granted');
            }

            // Add listener if provided
            if (onProgress) {
                this.audioRecorderPlayer.addRecordBackListener(onProgress);
            }

            console.log('Starting recorder...');
            const result = await this.audioRecorderPlayer.startRecorder();
            this.audioRecorderPlayer.setSubscriptionDuration(0.1); // Update every 0.1s

            console.log('Recorder started at path:', result);
            return result;
        } catch (error) {
            console.error('Failed to start recorder:', error);
            throw error;
        }
    }

    /**
     * Stop recording audio
     * @returns The file path of the recorded audio
     */
    async stopRecorder(): Promise<string> {
        try {
            console.log('Stopping recorder...');
            const result = await this.audioRecorderPlayer.stopRecorder();
            this.audioRecorderPlayer.removeRecordBackListener();

            console.log('Recorder stopped. File saved at:', result);
            return result;
        } catch (error) {
            console.error('Failed to stop recorder:', error);
            throw error;
        }
    }

    /**
     * Pause recording (if needed in future)
     */
    async pauseRecorder(): Promise<string> {
        return await this.audioRecorderPlayer.pauseRecorder();
    }

    /**
     * Resume recording (if needed in future)
     */
    async resumeRecorder(): Promise<string> {
        return await this.audioRecorderPlayer.resumeRecorder();
    }
}

export default new AudioService();
