// app/index.tsx
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CameraView,
  CameraType,
  useCameraPermissions,
} from "expo-camera";

const BACKEND_UPLOAD_URL = "http://192.168.0.130:3000/upload-receipt"; // 🔴 change this

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const [facing, setFacing] = useState<CameraType>("back");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Permissions object not loaded yet
  if (!permission) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.loadingText}>Loading camera permissions…</Text>
      </SafeAreaView>
    );
  }

  // Ask for permission
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.permissionText}>
          We need your permission to use the camera.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>Grant permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleToggleCamera = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setUploadStatus(null);
      }
    } catch (error) {
      console.warn("Error taking picture:", error);
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setUploadStatus(null);
  };

  const handleUpload = async () => {
    if (!photoUri) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const filename =
        photoUri.split("/").pop() ?? `receipt_${Date.now()}.jpg`;

      const formData = new FormData();
      formData.append("file", {
        uri: photoUri,
        name: filename,
        type: "image/jpeg",
      } as any); // RN file object

      const response = await fetch(BACKEND_UPLOAD_URL, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      setUploadStatus("✅ Uploaded successfully!");
    } catch (error) {
      console.warn("Upload error:", error);
      setUploadStatus("❌ Upload failed. Check network/backend.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Receipt Scanner</Text>
      </View>

      {/* If we have a photo, show preview */}
      {photoUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />

          {uploadStatus && (
            <Text style={styles.uploadStatus}>{uploadStatus}</Text>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.flexButton]}
              onPress={handleRetake}
              disabled={isUploading}
            >
              <Text style={styles.secondaryButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, styles.flexButton]}
              onPress={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.primaryButtonText}>Upload</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Otherwise show live camera
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            mode="picture"
          />

          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={handleToggleCamera}
            >
              <Text style={styles.smallButtonText}>Flip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleTakePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            {/* Spacer to keep layout centered */}
            <View style={styles.smallButtonPlaceholder} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    paddingHorizontal: 24,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#000",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  smallButton: {
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  smallButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  smallButtonPlaceholder: {
    width: 72, // roughly width of smallButton to balance layout
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  previewContainer: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 16,
    columnGap: 12,
  } as any, // RN doesn't have 'columnGap' in old typings, cast to any if TS complains
  flexButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#6b7280",
    borderWidth: 1,
    backgroundColor: "#111827",
  },
  secondaryButtonText: {
    color: "#e5e7eb",
    fontSize: 16,
  },
  uploadStatus: {
    marginTop: 12,
    fontSize: 14,
    color: "#e5e7eb",
    textAlign: "center",
  },
});
