import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WebcamCapture } from './WebcamCapture';
import { WebcamError } from '@/types';

// Mock MediaDevices API
const mockGetUserMedia = jest.fn();
const mockStream = {
  getTracks: jest.fn(() => [
    { stop: jest.fn() }
  ])
};

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia
  }
});

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, 'srcObject', {
  set: jest.fn(),
  get: jest.fn()
});

describe('WebcamCapture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockClear();
  });

  it('renders loading state initially when autoStart is true', async () => {
    mockGetUserMedia.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<WebcamCapture />);
    
    await waitFor(() => {
      expect(screen.getByText('Starting camera...')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Start Camera' })).not.toBeInTheDocument();
  });

  it('renders start button when autoStart is false', () => {
    render(<WebcamCapture autoStart={false} />);
    
    expect(screen.getByRole('button', { name: 'Start Camera' })).toBeInTheDocument();
    expect(screen.queryByText('Starting camera...')).not.toBeInTheDocument();
  });

  it('successfully starts webcam and calls onStreamReady', async () => {
    const onStreamReady = jest.fn();
    mockGetUserMedia.mockResolvedValue(mockStream);

    render(<WebcamCapture onStreamReady={onStreamReady} />);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user'
        },
        audio: false
      });
    });

    await waitFor(() => {
      expect(onStreamReady).toHaveBeenCalledWith(mockStream);
    });

    expect(screen.getByRole('button', { name: 'Stop Camera' })).toBeInTheDocument();
  });

  it('handles permission denied error', async () => {
    const onError = jest.fn();
    const permissionError = new DOMException('Permission denied', 'NotAllowedError');
    mockGetUserMedia.mockRejectedValue(permissionError);

    render(<WebcamCapture onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith({
        type: 'permission_denied',
        message: 'Camera access was denied. Please allow camera access to use this feature.'
      });
    });

    expect(screen.getByText('Camera access was denied. Please allow camera access to use this feature.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('handles camera not found error', async () => {
    const onError = jest.fn();
    const notFoundError = new DOMException('Device not found', 'NotFoundError');
    mockGetUserMedia.mockRejectedValue(notFoundError);

    render(<WebcamCapture onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith({
        type: 'not_found',
        message: 'No camera device found. Please connect a camera and try again.'
      });
    });

    expect(screen.getByText('No camera device found. Please connect a camera and try again.')).toBeInTheDocument();
  });

  it('handles camera in use error', async () => {
    const onError = jest.fn();
    const notReadableError = new DOMException('Device in use', 'NotReadableError');
    mockGetUserMedia.mockRejectedValue(notReadableError);

    render(<WebcamCapture onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith({
        type: 'not_readable',
        message: 'Camera is already in use by another application.'
      });
    });

    expect(screen.getByText('Camera is already in use by another application.')).toBeInTheDocument();
  });

  it('handles overconstrained error', async () => {
    const onError = jest.fn();
    const overconstrainedError = new DOMException('Constraints not satisfied', 'OverconstrainedError');
    mockGetUserMedia.mockRejectedValue(overconstrainedError);

    render(<WebcamCapture onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith({
        type: 'overconstrained',
        message: 'Camera does not support the requested settings.'
      });
    });

    expect(screen.getByText('Camera does not support the requested settings.')).toBeInTheDocument();
  });

  it('handles unknown error', async () => {
    const onError = jest.fn();
    const unknownError = new DOMException('Unknown error', 'UnknownError');
    mockGetUserMedia.mockRejectedValue(unknownError);

    render(<WebcamCapture onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith({
        type: 'unknown',
        message: 'Camera error: Unknown error'
      });
    });

    expect(screen.getByText('Camera error: Unknown error')).toBeInTheDocument();
  });

  it('handles unsupported browser', async () => {
    const onError = jest.fn();
    
    // Mock unsupported browser
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: undefined
    });

    render(<WebcamCapture onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith({
        type: 'unknown',
        message: 'Camera access is not supported in this browser.'
      });
    });

    expect(screen.getByText('Camera access is not supported in this browser.')).toBeInTheDocument();

    // Restore mediaDevices for other tests
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: mockGetUserMedia
      }
    });
  });

  it('stops webcam when stop button is clicked', async () => {
    mockGetUserMedia.mockResolvedValue(mockStream);
    const stopTrack = jest.fn();
    mockStream.getTracks.mockReturnValue([{ stop: stopTrack }]);

    render(<WebcamCapture />);

    // Wait for webcam to start
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Stop Camera' })).toBeInTheDocument();
    });

    // Click stop button
    fireEvent.click(screen.getByRole('button', { name: 'Stop Camera' }));

    expect(stopTrack).toHaveBeenCalled();
    
    // Wait for the start button to appear after stopping
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Start Camera' })).toBeInTheDocument();
    });
  });

  it('retries after error when try again button is clicked', async () => {
    const onError = jest.fn();
    const permissionError = new DOMException('Permission denied', 'NotAllowedError');
    
    // First call fails, second succeeds
    mockGetUserMedia
      .mockRejectedValueOnce(permissionError)
      .mockResolvedValueOnce(mockStream);

    render(<WebcamCapture onError={onError} />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    // Click try again
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    // Should succeed on retry
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Stop Camera' })).toBeInTheDocument();
    });
  });

  it('uses custom dimensions', async () => {
    mockGetUserMedia.mockResolvedValue(mockStream);

    render(<WebcamCapture width={640} height={480} />);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
    });
  });

  it('applies custom className', () => {
    render(<WebcamCapture className="custom-class" autoStart={false} />);
    
    const webcamContainer = screen.getByRole('button', { name: 'Start Camera' }).closest('.webcam-capture');
    expect(webcamContainer).toHaveClass('custom-class');
  });

  it('cleans up stream on unmount', async () => {
    mockGetUserMedia.mockResolvedValue(mockStream);
    const stopTrack = jest.fn();
    mockStream.getTracks.mockReturnValue([{ stop: stopTrack }]);

    const { unmount } = render(<WebcamCapture />);

    // Wait for webcam to actually start and stream to be set
    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
    });

    // Give a moment for the stream to be set in state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Stop Camera' })).toBeInTheDocument();
    });

    unmount();

    expect(stopTrack).toHaveBeenCalled();
  });

  it('starts webcam manually when autoStart is false', async () => {
    mockGetUserMedia.mockResolvedValue(mockStream);

    render(<WebcamCapture autoStart={false} />);

    expect(screen.getByRole('button', { name: 'Start Camera' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start Camera' }));

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Stop Camera' })).toBeInTheDocument();
    });
  });
});