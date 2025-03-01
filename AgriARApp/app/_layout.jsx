import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Login", headerShown: false }} />
      <Stack.Screen name="Home" options={{ title: "Home" }} />
      <Stack.Screen name="camera" options={{ title: "AR Camera" }} />
      <Stack.Screen name="data" options={{ title: "Zone Data" }} />
      <Stack.Screen name="chatbot" options={{ title: "Chatbot" }} />
    </Stack>
  );
}
