import React, { useRef, useState, useEffect } from 'react';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { 
  PerspectiveCamera, 
  Scene, 
  DirectionalLight, 
  AmbientLight, 
  MeshStandardMaterial,
  TextureLoader,
  sRGBEncoding,
  Vector2
} from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Asset } from 'expo-asset';
import { 
  StyleSheet, 
  Text, 
  View, 
  Platform, 
  ScrollView, 
  Button, 
  PanResponder,
  Animated,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator 
} from 'react-native';
import * as FileSystem from 'expo-file-system';

const MODEL_ID = 'DEUTSK420';

const modelAsset = Asset.fromModule(require('../../assets/models/source/DEUTSK420.obj'));
const textureAssets = {
  body: Asset.fromModule(require('../../assets/models/textures/tractor_texture/BODY.jpeg')),
  glass: Asset.fromModule(require('../../assets/models/textures/tractor_texture/glass.png')),
  wheel: Asset.fromModule(require('../../assets/models/textures/tractor_texture/WHEEL.jpeg')),
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

const TractorScene = ({ showAR, onStopAR , navigation}) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [tractorData, setTractorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('overview');

  // Refs for 3D scene
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const animationFrameId = useRef(null);
  const lastTouch = useRef(new Vector2());
  const lastDistance = useRef(0);
  const initialZoom = useRef(10);
  const infoBoxHeight = useRef(new Animated.Value(150)).current;

  const MIN_INFO_HEIGHT = 150;
  const MAX_INFO_HEIGHT = SCREEN_HEIGHT * 0.6;

  // Simulated tractor data (static)
  useEffect(() => {
    const loadTractorData = () => {
      setIsLoading(true);
      setTimeout(() => {
        setTractorData({
          model: "DEUTSK420",
          manufacturer: "Deutz-Fahr",
          year_range: "2015-2020",
          specifications: {
            engine: {
              type: "Diesel",
              power: {
                horsepower: 160,
                kW: 118
              },
              cylinders: 6,
              displacement: "6.1L",
              fuel_tank_capacity: "200L"
            },
            transmission: {
              type: "Manual",
              speeds_forward: 16,
              speeds_reverse: 4,
              max_speed: "40 km/h"
            },
            hydraulics: {
              system_type: "Open Center",
              pump_flow: "70 L/min",
              max_pressure: "200 bar",
              rear_lift_capacity: "4000 kg"
            }
          }
        });
        setIsLoading(false);
      }, 1000); // Simulated delay
    };

    loadTractorData();
  }, []);


  const handleBackPress = () => {
    // Pulisci gli eventuale risorse in uso
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    // Chiama onStopAR per notificare il componente genitore
    if (onStopAR) {
      onStopAR();
    }
    // Se è stata passata una prop navigation, naviga indietro
    if (navigation) {
      navigation.goBack();
    }
  };


  // Pan responder for zoom functionality
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          lastDistance.current = Math.hypot(
            touch2.pageX - touch1.pageX,
            touch2.pageY - touch1.pageY
          );
        }
      },
      onPanResponderMove: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const currentDistance = Math.hypot(
            touch2.pageX - touch1.pageX,
            touch2.pageY - touch1.pageY
          );
          if (lastDistance.current > 0) {
            const delta = currentDistance - lastDistance.current;
            const zoomSpeed = 0.05;
            if (cameraRef.current) {
              const newZoom = initialZoom.current - (delta * zoomSpeed);
              const clampedZoom = Math.max(5, Math.min(15, newZoom));
              cameraRef.current.position.z = clampedZoom;
              initialZoom.current = clampedZoom;
            }
          }
          lastDistance.current = currentDistance;
        }
      },
      onPanResponderRelease: () => {
        lastDistance.current = 0;
      }
    })
  ).current;

  // Asset loading functions
  const ensureLocalAsset = async (asset) => {
    if (!asset.localUri) {
      await asset.downloadAsync();
    }
    if (Platform.OS === 'ios' && !asset.localUri.startsWith('file://')) {
      const fileName = asset.localUri.split('/').pop();
      const destination = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: asset.localUri, to: destination });
      return `file://${destination}`;
    }
    return asset.localUri;
  };

  const loadAssets = async () => {
    try {
      setLoadingProgress(10);
      const modelUri = await ensureLocalAsset(modelAsset);
      setLoadingProgress(30);
      const bodyUri = await ensureLocalAsset(textureAssets.body);
      setLoadingProgress(50);
      const glassUri = await ensureLocalAsset(textureAssets.glass);
      setLoadingProgress(70);
      const wheelUri = await ensureLocalAsset(textureAssets.wheel);
      setLoadingProgress(90);
  
      return { bodyTextureUri: bodyUri, modelUri, glassTextureUri: glassUri, wheelTextureUri: wheelUri };
    } catch (error) {
      setError(`Error loading resources: ${error.message}`);
      throw error;
    }
  };
  

  const loadModelAsync = (loader, uri) => {
    return new Promise((resolve, reject) => {
      loader.load(uri, resolve, null, reject);
    });
  };

  // GL Context creation and 3D scene setup
  const onContextCreate = async (gl) => {
    try {
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;
  
      const scene = new Scene();
      sceneRef.current = scene;
  
      const camera = new PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      camera.position.set(0, 3, initialZoom.current);
      cameraRef.current = camera;
  
      scene.add(new AmbientLight(0xffffff, 0.7));
      const directionalLight = new DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 5);
      scene.add(directionalLight);
  
      const { bodyTextureUri, modelUri, glassTextureUri, wheelTextureUri } = await loadAssets();
  
      const textureBody = new TextureLoader().load(bodyTextureUri);
      textureBody.encoding = sRGBEncoding;

      const textureGlass = new TextureLoader().load(glassTextureUri);
      textureGlass.encoding = sRGBEncoding;
  
      const textureWheel = new TextureLoader().load(wheelTextureUri);
      textureWheel.encoding = sRGBEncoding;
  
      const objLoader = new OBJLoader();
      const object = await loadModelAsync(objLoader, modelUri);
  
      setLoadingProgress(90);
      object.scale.set(0.02, 0.02, 0.02);
  
      const materialBody = new MeshStandardMaterial({
        map: textureBody,
      });
  
      const materialGlass = new MeshStandardMaterial({
        map: textureGlass,
        transparent: true,
        opacity: 0.7, // Se il vetro deve essere semi-trasparente
      });
  
      const materialWheel = new MeshStandardMaterial({
        map: textureWheel,
      });
  
      object.traverse((child) => {
        if (child.isMesh) {
          // Aggiungi logica per decidere quale texture applicare
          if (child.name.includes("body")) {
            child.material = materialBody;
          } else if (child.name.includes("Glass")) {
            child.material = materialGlass;
          } else if (child.name.includes("Wheel")) {
            child.material = materialWheel;
          }
        }
      });
  
      scene.add(object);
      modelRef.current = object;
      setLoadingProgress(100);
      setIsModelLoaded(true);
  
      const animate = () => {
        if (!showAR) return;
        if (modelRef.current) {
          modelRef.current.rotation.y += 0.01;
        }
        renderer.render(scene, camera);
        gl.endFrameEXP();
        animationFrameId.current = requestAnimationFrame(animate);
      };
  
      animate();
    } catch (e) {
      setError(`Error initializing AR scene: ${e.message}`);
    }
  };

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [showAR]);

  // Info box animation
  const toggleInfoBox = () => {
    const toValue = isInfoExpanded ? MIN_INFO_HEIGHT : MAX_INFO_HEIGHT;
    Animated.spring(infoBoxHeight, {
      toValue,
      useNativeDriver: false,
      friction: 10,
    }).start();
    setIsInfoExpanded(!isInfoExpanded);
  };

  // Render specification section based on category
  const renderSpecifications = () => {
    if (!tractorData || !tractorData.specifications) return null;
  
    const specs = tractorData.specifications;
    return (
      <>
        <Text style={styles.infoTitle}>Overview</Text>
        <Text style={styles.infoText}>Model: {tractorData.model}</Text>
        <Text style={styles.infoText}>Manufacturer: {tractorData.manufacturer}</Text>
        <Text style={styles.infoText}>Year Range: {tractorData.year_range}</Text>
  
        <Text style={styles.infoTitle}>Engine Specifications</Text>
        <Text style={styles.infoText}>Type: {specs.engine.type}</Text>
        <Text style={styles.infoText}>
          Power: {specs.engine.power.horsepower} HP / {specs.engine.power.kW} kW
        </Text>
        <Text style={styles.infoText}>Cylinders: {specs.engine.cylinders}</Text>
        <Text style={styles.infoText}>Displacement: {specs.engine.displacement}</Text>
        <Text style={styles.infoText}>Fuel Tank: {specs.engine.fuel_tank_capacity}</Text>
  
        <Text style={styles.infoTitle}>Transmission</Text>
        <Text style={styles.infoText}>Type: {specs.transmission.type}</Text>
        <Text style={styles.infoText}>
          Forward Speeds: {specs.transmission.speeds_forward}
        </Text>
        <Text style={styles.infoText}>
          Reverse Speeds: {specs.transmission.speeds_reverse}
        </Text>
        <Text style={styles.infoText}>Max Speed: {specs.transmission.max_speed}</Text>
  
        <Text style={styles.infoTitle}>Hydraulics</Text>
        <Text style={styles.infoText}>System: {specs.hydraulics.system_type}</Text>
        <Text style={styles.infoText}>Pump Flow: {specs.hydraulics.pump_flow}</Text>
        <Text style={styles.infoText}>Max Pressure: {specs.hydraulics.max_pressure}</Text>
        <Text style={styles.infoText}>
          Lift Capacity: {specs.hydraulics.rear_lift_capacity}
        </Text>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <Text style={styles.backButtonText}>← Indietro</Text>
            </TouchableOpacity>
      {showInfo && (
        <>
          <View
            style={[styles.glContainer, { height: isInfoExpanded ? '40%' : '60%' }]}
            {...panResponder.panHandlers}
          >
            <GLView style={styles.glView} onContextCreate={onContextCreate} />
          </View>
  
          <Animated.View style={[styles.infoContainer, { height: infoBoxHeight }]}>
            <TouchableOpacity style={styles.expandButton} onPress={toggleInfoBox} activeOpacity={0.7}>
              <View style={styles.arrowContainer}>
                                         <View style={[
                                           styles.arrow,
                                           { transform: [{ rotate: isInfoExpanded ? '180deg' : '0deg' }] }
                                         ]} />
                                       </View>
            </TouchableOpacity>
  
            <ScrollView style={styles.scrollContent}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#4CAF50" />
              ) : (
                renderSpecifications()
              )}
            </ScrollView>
          </Animated.View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'trasparent',
  },
  glContainer: {
    flex: 1,
  },
  glView: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  scrollContent: {
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 16,
    marginVertical: 5,
  },
  expandButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  expandIcon: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandLine: {
    width: 20,
    height: 2,
    backgroundColor: '#4CAF50',
    margin: 2,
  },
  expandLineRotated: {
    transform: [{ rotate: '45deg' }],
  },
  arrowContainer: {
    width: 40,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4CAF50',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 15,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TractorScene;
