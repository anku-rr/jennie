// Debug script to test emotion detection in the browser console
// Run this in the browser console to debug emotion detection issues

console.log("🔍 Starting Emotion Detection Debug...");

// Check if face-api.js is loaded
if (typeof faceapi === "undefined") {
  console.error("❌ face-api.js is not loaded");
  console.log(
    "Available globals:",
    Object.keys(window).filter((key) => key.toLowerCase().includes("face"))
  );
} else {
  console.log("✅ face-api.js is loaded");
  console.log("Available nets:", Object.keys(faceapi.nets || {}));
}

// Check model loading status
async function checkModels() {
  console.log("📦 Checking model loading status...");

  try {
    // Check if models are loaded
    const tinyFaceDetectorLoaded = faceapi.nets.tinyFaceDetector.isLoaded;
    const faceExpressionNetLoaded = faceapi.nets.faceExpressionNet.isLoaded;

    console.log("TinyFaceDetector loaded:", tinyFaceDetectorLoaded);
    console.log("FaceExpressionNet loaded:", faceExpressionNetLoaded);

    if (!tinyFaceDetectorLoaded || !faceExpressionNetLoaded) {
      console.log("🔄 Loading models...");

      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        console.log("✅ TinyFaceDetector loaded");
      } catch (error) {
        console.error("❌ Failed to load TinyFaceDetector:", error);
      }

      try {
        await faceapi.nets.faceExpressionNet.loadFromUri("/models");
        console.log("✅ FaceExpressionNet loaded");
      } catch (error) {
        console.error("❌ Failed to load FaceExpressionNet:", error);
      }
    }
  } catch (error) {
    console.error("❌ Error checking models:", error);
  }
}

// Check video element
function checkVideo() {
  console.log("📹 Checking video elements...");

  const videos = document.querySelectorAll("video");
  console.log(`Found ${videos.length} video element(s)`);

  videos.forEach((video, index) => {
    console.log(`Video ${index + 1}:`, {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      currentTime: video.currentTime,
      paused: video.paused,
      ended: video.ended,
      srcObject: !!video.srcObject,
    });

    if (video.srcObject && video.srcObject.getVideoTracks) {
      const tracks = video.srcObject.getVideoTracks();
      console.log(`Video ${index + 1} tracks:`, tracks.length);
      tracks.forEach((track, trackIndex) => {
        console.log(`Track ${trackIndex + 1}:`, {
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
          label: track.label,
        });
      });
    }
  });

  return videos[0]; // Return first video for testing
}

// Test emotion detection on a video element
async function testEmotionDetection(video) {
  if (!video) {
    console.error("❌ No video element provided");
    return;
  }

  console.log("🎭 Testing emotion detection...");

  try {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    if (!detection) {
      console.warn("⚠️ No face detected");
      return null;
    }

    console.log("✅ Face detected with emotions:", detection.expressions);

    const emotions = {
      happy: detection.expressions.happy,
      sad: detection.expressions.sad,
      angry: detection.expressions.angry,
      surprised: detection.expressions.surprised,
      neutral: detection.expressions.neutral,
      fearful: detection.expressions.fearful,
      disgusted: detection.expressions.disgusted,
    };

    const dominantEmotion = Object.entries(emotions).reduce((a, b) =>
      emotions[a[0]] > emotions[b[0]] ? a : b
    )[0];

    console.log("🎯 Dominant emotion:", dominantEmotion);
    console.log("📊 All emotions:", emotions);

    return {
      dominant: dominantEmotion,
      confidence: emotions[dominantEmotion],
      emotions,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Emotion detection failed:", error);
    return null;
  }
}

// Run the debug sequence
async function runDebug() {
  await checkModels();
  const video = checkVideo();

  if (video && video.readyState >= 2) {
    const result = await testEmotionDetection(video);
    if (result) {
      console.log("🎉 Emotion detection working!", result);
    }
  } else {
    console.warn("⚠️ Video not ready for processing");
  }
}

// Auto-run debug
runDebug();

// Export functions for manual testing
window.emotionDebug = {
  checkModels,
  checkVideo,
  testEmotionDetection,
  runDebug,
};

console.log("🔧 Debug functions available as window.emotionDebug");
console.log("Usage: window.emotionDebug.runDebug()");
