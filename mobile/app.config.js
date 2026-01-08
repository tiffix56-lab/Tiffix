export default {
  expo: {
    name: "Tiffix",
    slug: "tiffix-mobile",
    version: "1.1.9",
    scheme: "tiffix",
    web: {
      favicon: "./src/assets/favicon.png",
    },

    experiments: {
      tsconfigPaths: true,
    },
    plugins: [
      "expo-font",
      "expo-router",
      "expo-apple-authentication",
      "@react-native-firebase/app",
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "15.1",
            useFrameworks: "static",
            useModularHeaders: true,
            extraPods: [
              { name: "FirebaseCore", modular_headers: true },
              { name: "FirebaseCoreInternal", modular_headers: true },
              { name: "FirebaseInstallations", modular_headers: true },
              { name: "GoogleUtilities", modular_headers: true }
            ]
          }
        }
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: "com.googleusercontent.apps.736730550506-ir73hfdskggdq4telt6912aehcjjv9j3",
        },
      ],
    ],
    orientation: "portrait",
    icon: "./src/assets/logo-main.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./src/assets/logo-main.png",
      resizeMode: "contain",
      backgroundColor: "#000000",
    },
    assetBundlePatterns: ["src/assets/*"],
    jsEngine: "hermes",
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.rutwik187.tiffix",
      googleServicesFile: "./GoogleService-Info.plist",
      config: {
        googleMapsApiKey: "",
      },
      associatedDomains: ["applinks:tiffix.in"],
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLName: "com.rutwik187.tiffix",
            CFBundleURLSchemes: ["tiffix"],
          },
        ],
        "ITSAppUsesNonExemptEncryption": false,
        NSCameraUsageDescription:
          "Tiffix needs access to your camera for capturing photos and enabling camera features.",
        NSPhotoLibraryUsageDescription:
          "Tiffix needs access to your photo library so you can upload and select images.",
        NSPhotoLibraryAddUsageDescription:
          "Tiffix needs permission to save photos to your gallery.",
        NSUserNotificationUsageDescription:
          "Tiffix uses notifications to keep you updated with important alerts and updates.",
        NSLocationWhenInUseUsageDescription:
          "Tiffix needs access to your location to provide location-based services.",
        NSLocationAlwaysUsageDescription:
          "Tiffix needs access to your location to show delivery addresses and track orders.",

      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./src/assets/logo-main.png",
        backgroundColor: "#000000",
      },
      package: "com.rutwik187.tiffix",
      googleServicesFile: "./google-services.json",
      versionCode: 6,
      config: {
        googleMaps: {
          apiKey: "",
        },
      },
    },
    extra: {
      router: {},
      eas: {
        projectId: "12862b1b-d529-4628-bfb2-2bae511fe1dc",
      },
    },
    updates: {
      url: "",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    owner: "tiffix",
  },
};
