export default {
  expo: {
    name: "Tiffix",
    slug: "tiffix-mobile",
    version: "1.1.4",
    scheme: "tiffix",
    web: {
      favicon: "./src/assets/favicon.png",
    },

    experiments: {
      tsconfigPaths: true,
    },
    plugins: [
      "expo-router",
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
    icon: "./src/assets/splash.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./src/assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["src/assets/*"],
    jsEngine: "hermes",
    ios: {
      supportsTablet: true,
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
          "Snek needs access to your camera for capturing photos and enabling camera features.",
        NSPhotoLibraryUsageDescription:
          "Snek needs access to your photo library so you can upload and select images.",
        NSPhotoLibraryAddUsageDescription:
          "Snek needs permission to save photos to your gallery.",
        NSUserNotificationUsageDescription:
          "Snek uses notifications to keep you updated with important alerts and updates."
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
