import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert, StatusBar, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleLogin = async () => {
    try {
      const res = await fetch('http://172.20.10.2:4000/api/users/login', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      console.log(data);

      if (res.ok) {
        Alert.alert('Successo', data.message);
        router.push({
          pathname:'/home',
          params:{email, password}
        });
      } else {
        Alert.alert('Errore', data.message || 'Credenziali non valide');
      }
    } catch (error) {
      Alert.alert('Errore', 'Si è verificato un errore durante il login');
      console.log(error.message);
    }
  };

  const handleRegister = async () => {
    if (registerPassword !== confirmPassword) {
      Alert.alert('Errore', 'Le password non coincidono');
      return;
    }

    try {
      const res = await fetch('http://172.20.10.2:4000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: registerEmail, password: registerPassword })
      });

      const data = await res.json();

      if (res.status === 201) {
        Alert.alert('Successo', data.message);
        router.push('/home');
        setShowRegister(false);
      } else {
        Alert.alert('Errore', data.message || 'Errore nella registrazione');
      }
    } catch (error) {
      Alert.alert('Errore', 'Si è verificato un errore durante la registrazione');
      console.log(error);
    }
  };

  const loadModel = async () => {
    try {
      const modelUri = Asset.fromModule(require('./assets/model.glb')).uri;

      const loader = new GLTFLoader();
      loader.load(
        modelUri,
        (gltf) => {
          console.log("Modello caricato correttamente", gltf);
        },
        undefined,
        (error) => {
          console.error("Errore durante il caricamento del modello:", error);
        }
      );
    } catch (error) {
      console.error("Errore nel caricamento del modello:", error);
    }
  };

  useEffect(() => {
    loadModel();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <LinearGradient
        colors={['#111827', '#1E3A8A']}
        style={styles.container}
      >
        <View style={styles.contentContainer}>
          <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/295/295128.png" }} style={styles.logo} />

          {showRegister ? (
            <>
              <Text style={styles.title}>Registrati</Text>
              <Text style={styles.description}>Crea un nuovo account per iniziare</Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Feather name="mail" size={20} color="#3B82F6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    value={registerEmail}
                    onChangeText={setRegisterEmail}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={20} color="#3B82F6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={registerPassword}
                    onChangeText={setRegisterPassword}
                  />
                  <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeButton}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={20} color="#3B82F6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Conferma Password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.eyeButton}>
                    <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.mainButton} onPress={handleRegister}>
                <LinearGradient
                  colors={['#10B981', '#047857']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>Registrati</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowRegister(false)}>
                <Text style={styles.footerText}>Hai già un account? <Text style={styles.link}>Accedi</Text></Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Benvenuto nell'App AR Agricola</Text>
              <Text style={styles.description}>Accedi per esplorare l'innovazione agricola con la realtà aumentata</Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Feather name="mail" size={20} color="#3B82F6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={20} color="#3B82F6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeButton}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.mainButton} onPress={handleLogin}>
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>Accedi</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowRegister(true)}>
                <Text style={styles.footerText}>Non hai un account? <Text style={styles.link}>Registrati</Text></Text>
              </TouchableOpacity>
            </>
          )}
          
          <View style={styles.footer}>
            <Image
              // source={require("./assets/images/sustainable-agriculture.png")}
              style={styles.footerImage}
              resizeMode="contain"
            />
          </View>
        </View>
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
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 25,
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "rgba(59, 130, 246, 0.5)",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
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
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#1F2937",
  },
  eyeButton: {
    padding: 10,
  },
  mainButton: {
    width: "100%",
    marginBottom: 20,
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
  },
  footerText: {
    fontSize: 16,
    color: "#E5E7EB",
    marginTop: 16,
  },
  link: {
    color: "#3B82F6",
    fontWeight: "bold",
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
    width: "100%",
  },
  footerImage: {
    width: "100%",
    height: 80,
  },
});