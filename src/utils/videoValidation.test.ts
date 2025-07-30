import {
  getVideoElementStatus,
  validateVideoElement,
  isVideoElementReady,
  waitForVideoReady,
  validateVideoElementOrThrow,
  getVideoStatusDescription,
  VIDEO_READY_STATES,
} from './videoValidation';
import { EmotionDetectionError } from './emotionDetection';

// Mock MediaStream for test environment
(global as any).MediaStream = class MockMediaStreamGlobal {
  private videoTracks: any[] = [];

  constructor(videoTracks: any[] = [{ readyState: 'live' }]) {
    this.videoTracks = videoTracks;
  }

  getVideoTracks() {
    return this.videoTracks;
  }
};

// Mock HTMLVideoElement
class MockVideoElement {
  public isConnected = true;
  public paused = false;
  public ended = false;
  public currentTime = 1.0;
  public videoWidth = 640;
  public videoHeight = 480;
  public readyState = VIDEO_READY_STATES.HAVE_ENOUGH_DATA;
  public duration = 10.0;
  public muted = false;
  public srcObject: MediaStream | null = null;

  constructor(overrides: Partial<MockVideoElement> = {}) {
    Object.assign(this, overrides);
  }
}

// Mock MediaStream
class MockMediaStream {
  private videoTracks: MockMediaStreamTrack[] = [];

  constructor(videoTracks: MockMediaStreamTrack[] = [new MockMediaStreamTrack()]) {
    this.videoTracks = videoTracks;
  }

  getVideoTracks(): MockMediaStreamTrack[] {
    return this.videoTracks;
  }
}

class MockMediaStreamTrack {
  public readyState: 'live' | 'ended' = 'live';

  constructor(readyState: 'live' | 'ended' = 'live') {
    this.readyState = readyState;
  }
}

describe('videoValidation', () => {
  describe('getVideoElementStatus', () => {
    it('should return default status for null video element', () => {
      const status = getVideoElementStatus(null);
      
      expect(status.isConnected).toBe(false);
      expect(status.isPlaying).toBe(false);
      expect(status.hasValidDimensions).toBe(false);
      expect(status.videoWidth).toBe(0);
      expect(status.videoHeight).toBe(0);
    });

    it('should return correct status for valid video element', () => {
      const mockVideo = new MockVideoElement() as unknown as HTMLVideoElement;
      const status = getVideoElementStatus(mockVideo);
      
      expect(status.isConnected).toBe(true);
      expect(status.isPlaying).toBe(true);
      expect(status.hasValidDimensions).toBe(true);
      expect(status.videoWidth).toBe(640);
      expect(status.videoHeight).toBe(480);
      expect(status.readyState).toBe(VIDEO_READY_STATES.HAVE_ENOUGH_DATA);
    });

    it('should detect paused video as not playing', () => {
      const mockVideo = new MockVideoElement({ paused: true }) as unknown as HTMLVideoElement;
      const status = getVideoElementStatus(mockVideo);
      
      expect(status.isPlaying).toBe(false);
      expect(status.paused).toBe(true);
    });

    it('should detect ended video as not playing', () => {
      const mockVideo = new MockVideoElement({ ended: true }) as unknown as HTMLVideoElement;
      const status = getVideoElementStatus(mockVideo);
      
      expect(status.isPlaying).toBe(false);
      expect(status.ended).toBe(true);
    });

    it('should detect video with currentTime 0 as not playing', () => {
      const mockVideo = new MockVideoElement({ currentTime: 0 }) as unknown as HTMLVideoElement;
      const status = getVideoElementStatus(mockVideo);
      
      expect(status.isPlaying).toBe(false);
    });

    it('should detect invalid dimensions', () => {
      const mockVideo = new MockVideoElement({ 
        videoWidth: 0, 
        videoHeight: 0 
      }) as unknown as HTMLVideoElement;
      const status = getVideoElementStatus(mockVideo);
      
      expect(status.hasValidDimensions).toBe(false);
    });
  });

  describe('validateVideoElement', () => {
    it('should return invalid for null video element', () => {
      const result = validateVideoElement(null);
      
      expect(result.isValid).toBe(false);
      expect(result.isReady).toBe(false);
      expect(result.errors).toContain('Video element is null or undefined');
    });

    it('should return valid and ready for properly configured video', () => {
      const mockStream = new (global as any).MediaStream() as unknown as MediaStream;
      const mockVideo = new MockVideoElement({ 
        srcObject: mockStream 
      }) as unknown as HTMLVideoElement;
      
      const result = validateVideoElement(mockVideo);
      
      expect(result.isValid).toBe(true);
      expect(result.isReady).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect disconnected video element', () => {
      const mockVideo = new MockVideoElement({ 
        isConnected: false 
      }) as unknown as HTMLVideoElement;
      
      const result = validateVideoElement(mockVideo);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Video element is not connected to the DOM');
    });

    it('should detect insufficient ready state', () => {
      const mockVideo = new MockVideoElement({ 
        readyState: VIDEO_READY_STATES.HAVE_METADATA 
      }) as unknown as HTMLVideoElement;
      
      const result = validateVideoElement(mockVideo);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Video ready state insufficient')
      )).toBe(true);
    });

    it('should detect paused video', () => {
      const mockVideo = new MockVideoElement({ 
        paused: true 
      }) as unknown as HTMLVideoElement;
      
      const result = validateVideoElement(mockVideo);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Video is paused');
    });

    it('should detect ended video', () => {
      const mockVideo = new MockVideoElement({ 
        ended: true 
      }) as unknown as HTMLVideoElement;
      
      const result = validateVideoElement(mockVideo);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Video has ended');
    });

    it('should detect video with zero dimensions', () => {
      const mockVideo = new MockVideoElement({ 
        videoWidth: 0, 
        videoHeight: 0 
      }) as unknown as HTMLVideoElement;
      
      const result = validateVideoElement(mockVideo);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Video dimensions are not available')
      )).toBe(true);
    });

    it('should warn about small dimensions', () => {
      const mockVideo = new MockVideoElement({ 
        videoWidth: 100, 
        videoHeight: 80 
      }) as unknown as HTMLVideoElement;
      
      const result = validateVideoElement(mockVideo);
      
      expect(result.warnings.some(warning => 
        warning.includes('below recommended minimum')
      )).toBe(true);
    });

    it('should detect missing MediaStream', () => {
      const mockVideo = new MockVideoElement({ 
        srcObject: null 
      }) as unknown as HTMLVideoElement;
      
      const result = validateVideoElement(mockVideo);
      
      expect(result.warnings).toContain('Video element has no srcObject (MediaStream)');
    });

    it('should detect MediaStream with no video tracks', () => {
      const mockStream = new (global as any).MediaStream([]) as unknown as MediaStream;
      const mockVideo = new MockVideoElement({ 
        srcObject: mockStream 
      }) as unknown as HTMLVideoElement;
      
      const result = validateVideoElement(mockVideo);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('MediaStream has no video tracks');
    });

    it('should detect MediaStream with no active video tracks', () => {
      const inactiveTrack = { readyState: 'ended' };
      const mockStream = new (global as any).MediaStream([inactiveTrack]) as unknown as MediaStream;
      const mockVideo = new MockVideoElement({ 
        srcObject: mockStream 
      }) as unknown as HTMLVideoElement;
      
      const result = validateVideoElement(mockVideo);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('MediaStream has no active video tracks');
    });

    it('should warn about muted video', () => {
      const mockStream = new (global as any).MediaStream() as unknown as MediaStream;
      const mockVideo = new MockVideoElement({ 
        muted: true,
        srcObject: mockStream 
      }) as unknown as HTMLVideoElement;
      
      const result = validateVideoElement(mockVideo);
      
      expect(result.warnings).toContain('Video is muted (this does not affect emotion detection)');
    });
  });

  describe('isVideoElementReady', () => {
    it('should return false for null video element', () => {
      expect(isVideoElementReady(null)).toBe(false);
    });

    it('should return true for ready video element', () => {
      const mockStream = new (global as any).MediaStream() as unknown as MediaStream;
      const mockVideo = new MockVideoElement({ 
        srcObject: mockStream 
      }) as unknown as HTMLVideoElement;
      
      expect(isVideoElementReady(mockVideo)).toBe(true);
    });

    it('should return false for paused video element', () => {
      const mockVideo = new MockVideoElement({ 
        paused: true 
      }) as unknown as HTMLVideoElement;
      
      expect(isVideoElementReady(mockVideo)).toBe(false);
    });
  });

  describe('waitForVideoReady', () => {
    it('should reject immediately for null video element', async () => {
      await expect(waitForVideoReady(null)).rejects.toThrow(EmotionDetectionError);
    });

    it('should resolve immediately for ready video element', async () => {
      const mockStream = new (global as any).MediaStream() as unknown as MediaStream;
      const mockVideo = new MockVideoElement({ 
        srcObject: mockStream 
      }) as unknown as HTMLVideoElement;
      
      const result = await waitForVideoReady(mockVideo, 1000);
      expect(result.isReady).toBe(true);
    });

    it('should timeout for video that never becomes ready', async () => {
      const mockVideo = new MockVideoElement({ 
        paused: true 
      }) as unknown as HTMLVideoElement;
      
      await expect(waitForVideoReady(mockVideo, 100)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('not ready within 100ms')
        })
      );
    });
  });

  describe('validateVideoElementOrThrow', () => {
    it('should throw for invalid video element', () => {
      expect(() => validateVideoElementOrThrow(null)).toThrow(EmotionDetectionError);
    });

    it('should throw for not ready video element', () => {
      const mockVideo = new MockVideoElement({ 
        paused: true 
      }) as unknown as HTMLVideoElement;
      
      expect(() => validateVideoElementOrThrow(mockVideo)).toThrow(EmotionDetectionError);
    });

    it('should not throw for ready video element', () => {
      const mockStream = new (global as any).MediaStream() as unknown as MediaStream;
      const mockVideo = new MockVideoElement({ 
        srcObject: mockStream 
      }) as unknown as HTMLVideoElement;
      
      expect(() => validateVideoElementOrThrow(mockVideo)).not.toThrow();
    });
  });

  describe('getVideoStatusDescription', () => {
    it('should return appropriate message for null video element', () => {
      const description = getVideoStatusDescription(null);
      expect(description).toBe('No video element provided');
    });

    it('should return ready message for ready video element', () => {
      const mockStream = new (global as any).MediaStream() as unknown as MediaStream;
      const mockVideo = new MockVideoElement({ 
        srcObject: mockStream,
        currentTime: 2.5 
      }) as unknown as HTMLVideoElement;
      
      const description = getVideoStatusDescription(mockVideo);
      expect(description).toContain('Video ready');
      expect(description).toContain('640x480');
      expect(description).toContain('2.5s');
    });

    it('should return error message for not ready video element', () => {
      const mockVideo = new MockVideoElement({ 
        paused: true 
      }) as unknown as HTMLVideoElement;
      
      const description = getVideoStatusDescription(mockVideo);
      expect(description).toContain('Video not ready');
      expect(description).toContain('paused');
    });
  });
});