import { Camera, CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Modal, Alert, StatusBar, Image } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TomatoScene from '../components/ARScene/Tomato';
import CornScene from '../components/ARScene/Corn';
import BasilScene from '../components/ARScene/Basil';
import PotatoScene from '../components/ARScene/Potato';
import CarrotScene from '../components/ARScene/Carrot';
import TractorScene from '../components/ARScene/Tractor';
import LemonScene from '../components/ARScene/Lemon';
import { useRouter } from 'expo-router';

export default function CameraScreen() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [showAR, setShowAR] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showMachinerySelector, setShowMachinerySelector] = useState(false);
  const router = useRouter();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#666" />
        <Text style={styles.permissionMessage}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  function handleModelSelection(model) {
    setSelectedModel(model);
    setShowModelSelector(false);
    setShowMachinerySelector(false);
    setShowAR(true);
  }

  function handleStopAR() {
    setShowAR(false);
    setSelectedModel(null);
  }

  function handleGoHome() {
    router.push('/home');
  }

  const ModelButton = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.modelButton} onPress={onPress}>
      <View style={styles.modelIconContainer}>
        <MaterialCommunityIcons name={icon} size={32} color="#FFFFFF" />
      </View>
      <Text style={styles.modelText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView style={styles.camera} facing={facing}>
        {!showAR && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.mainButton}
              onPress={() => setShowModelSelector(true)}
            >
              <LinearGradient
                colors={['#10B981', '#047857']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons name="sprout" size={24} color="white" />
                <Text style={styles.buttonText}>Plants</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainButton}
              onPress={() => setShowMachinerySelector(true)}
            >
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons name="tractor" size={24} color="white" />
                <Text style={styles.buttonText}>Machinery</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Pulsante Home */}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleGoHome}
        >
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
            style={styles.homeButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialCommunityIcons name="home" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </CameraView>

      {/* Modal for plant selection */}
      <Modal visible={showModelSelector} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Plant Model</Text>
            <ModelButton 
              icon="corn" 
              label="Corn"
              onPress={() => handleModelSelection('Corn')}
            />
            <ModelButton 
              icon="tree" 
              label="Tomato"
              onPress={() => handleModelSelection('Tomato')}
            />
            <ModelButton
              icon="leaf"
              label="Carrot"
              onPress={() => handleModelSelection('Carrot')}
            />
            <ModelButton
              icon="leaf"
              label="Lemon"
              onPress={() => handleModelSelection('Lemon')}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModelSelector(false)}
            >
              <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                style={styles.closeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for machinery selection */}
      <Modal visible={showMachinerySelector} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Machinery</Text>
            <ModelButton 
              icon="tractor" 
              label="Tractor"
              onPress={() => handleModelSelection('Tractor')}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMachinerySelector(false)}
            >
              <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                style={styles.closeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showAR && selectedModel && (
        <View style={styles.overlay}>
          {selectedModel === 'Corn' && <CornScene showAR={showAR} onStopAR={handleStopAR} />}
          {selectedModel === 'Tomato' && <TomatoScene showAR={showAR} onStopAR={handleStopAR} />}
          {selectedModel === 'Basil' && <BasilScene showAR={showAR} onStopAR={handleStopAR} />}
          {selectedModel === 'Tractor' && <TractorScene showAR={showAR} onStopAR={handleStopAR} />}
          {selectedModel === 'Potato' && <PotatoScene showAR={showAR} onStopAR={handleStopAR} />}
          {selectedModel === 'Carrot' && <CarrotScene showAR={showAR} onStopAR={handleStopAR} />}
          {selectedModel === 'Lemon' && <LemonScene showAR={showAR} onStopAR={handleStopAR} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 20,
  },
  permissionMessage: {
    fontSize: 18,
    color: '#E5E7EB',
    textAlign: 'center',
    marginVertical: 20,
  },
  permissionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  gradientButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  mainButton: {
    marginHorizontal: 10,
    borderRadius: 16,
    overflow: 'hidden',
    width: 130,
    height: 50,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    paddingHorizontal: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  homeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    borderRadius: 30,
    overflow: 'hidden',
    width: 60,
    height: 60,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  homeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  modelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#334155',
    borderRadius: 15,
    marginVertical: 8,
    width: '100%',
    elevation: 2,
  },
  modelIconContainer: {
    backgroundColor: '#3B82F6',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelText: {
    fontSize: 18,
    marginLeft: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 15,
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    padding: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});