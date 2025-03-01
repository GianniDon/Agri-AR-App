import React, { useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Image, Modal, StatusBar, SafeAreaView } from "react-native";
import CameraButton from "../components/CameraButton";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons, Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function Index() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isUserInfoVisible, setUserInfoVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Recupera le credenziali dai parametri
  const userInfo = {
    email: params.email,
    password: params.password,
  };

  const goToLogin = () => {
    router.push("/");
  };

  const openCamera = () => {
    router.push("/camera");
  };

  const gotoChatbot = () => {
    router.push("/chatbot");
  };
  
  const toggleUserInfo = () => {
    setUserInfoVisible(!isUserInfoVisible);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Funzione per mascherare la password
  const maskPassword = (password) => {
    return '•'.repeat(password?.length || 0);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <LinearGradient
        colors={['#111827', '#1E3A8A']}
        style={styles.container}
      >
        {/* Header con logo e info utente */}
        <View style={styles.header}>
          <Image
            source={require("../assets/images/augmented-reality.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.userInfoButton} onPress={toggleUserInfo}>
            <MaterialCommunityIcons name="account-circle" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>Benvenuto nell'App AR Agricola</Text>

          <Text style={styles.description}>
            Esplora l'innovazione agricola con la realtà aumentata. Scopri come
            utilizzare le tecnologie per ottimizzare il tuo lavoro!
          </Text>

          {/* Main action buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.mainButton} 
              onPress={openCamera}
            >
              <LinearGradient
                colors={['#10B981', '#047857']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="camera" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Apri Fotocamera AR</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.mainButton} 
              onPress={gotoChatbot}
            >
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Assistente Virtuale</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer area */}
          <View style={styles.footer}>
            <Image
              source={require("../assets/images/sustainable-agriculture.png")}
              style={styles.footerImage}
              resizeMode="contain"
            />
            
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={goToLogin}
            >
              <Feather name="log-out" size={18} color="#FFFFFF" style={styles.logoutIcon} />
              <Text style={styles.logoutText}>Esci</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal per visualizzare informazioni utente */}
        <Modal visible={isUserInfoVisible} transparent={true} animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name="account-circle" size={60} color="#3B82F6" />
                <Text style={styles.modalTitle}>Profilo Utente</Text>
              </View>
              
              <View style={styles.infoContainer}>
                <Feather name="mail" size={18} color="#3B82F6" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{userInfo.email}</Text>
              </View>

              <View style={styles.infoContainer}>
                <Feather name="lock" size={18} color="#3B82F6" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Password:</Text>
                <Text style={styles.infoValue}>
                  {showPassword ? userInfo.password : maskPassword(userInfo.password)}
                </Text>
                <TouchableOpacity 
                  onPress={togglePasswordVisibility}
                  style={styles.eyeButton}
                >
                  <Feather 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={18} 
                    color="#3B82F6"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={toggleUserInfo}
              >
                <Text style={styles.closeButtonText}>Chiudi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111827",
  },
  container: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  logo: {
    width: 40,
    height: 40,
  },
  userInfoButton: {
    backgroundColor: "rgba(59, 130, 246, 0.3)",
    padding: 8,
    borderRadius: 50,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 25,
    paddingVertical: 20,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: "#E5E7EB",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  actionContainer: {
    marginVertical: 20,
    width: "100%",
  },
  mainButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
  },
  footerImage: {
    width: "100%",
    height: 80,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#EF4444",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    width: "85%",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 10,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#4B5563",
    marginRight: 5,
  },
  infoValue: {
    fontSize: 15,
    color: "#1F2937",
    flex: 1,
  },
  eyeButton: {
    padding: 5,
  },
  closeModalButton: {
    marginTop: 24,
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});