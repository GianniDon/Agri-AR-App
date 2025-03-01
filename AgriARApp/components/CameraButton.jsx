// CameraButton.jsx

import { useRouter } from "expo-router";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function CameraButton() {
  const router = useRouter();

  const handlePress = () => {
    router.push("/camera"); // Naviga alla route "camera"
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress}>
      <Text style={styles.buttonText}>Apri Fotocamera AR</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
