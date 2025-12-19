export default {
  expo: {
    name: "Artywiz Football",
    slug: "artywiz-football",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "artywiz",
    userInterfaceStyle: "automatic",
    newArchEnabled: false,
    owner: "artywiz-organisation",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.artyplanet.artywiz"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#000"
      },
      edgeToEdgeEnabled: true,
      package: "com.artyplanet.artywiz"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-image.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#000"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      EXPO_PUBLIC_BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || "https://artywiz.io",
      eas: {
        projectId: "5188cfd5-e612-4364-88d7-51261e0ec49e"
      }
    }
  }
};
