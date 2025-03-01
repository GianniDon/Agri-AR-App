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
  PanResponder,
  Animated,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import * as FileSystem from 'expo-file-system';

const MODEL_ID = 'tomato-plant';
const TREFLE_API_TOKEN = 'uBry5UjabyWC0K7bTK6nuVjfJWS07xrD2jA4WEBck2g'; 

const modelAsset = Asset.fromModule(require('../../assets/models/source/potato.obj'));
const textureAssets = {
  potato: Asset.fromModule(require('../../assets/models/textures/potato_texture/potato.jpeg')),
 
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

const PotatoScene = ({ showAR, onStopAR, navigation }) => {
  // States
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [foodData, setFoodData] = useState(null);
  const [farmData, setFarmData] = useState(null);
  const [showInfo, setShowInfo] = useState(true);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Refs
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
      setLoadingProgress(30);
      const modelUri = await ensureLocalAsset(modelAsset);
      setLoadingProgress(50);
      const potatoUri = await ensureLocalAsset(textureAssets.potato);
      setLoadingProgress(70);
      return { 
        modelUri, 
        potatoTextureUri: potatoUri, 
      };
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

      const { modelUri, potatoTextureUri } = await loadAssets();

      const texturepotato = new TextureLoader().load(potatoTextureUri);
      texturepotato.encoding = sRGBEncoding;

      const objLoader = new OBJLoader();
      const object = await loadModelAsync(objLoader, modelUri);

      setLoadingProgress(90);
      object.scale.set(2, 2, 2);

      const materialpotato = new MeshStandardMaterial({
        map: texturepotato,
      });

      object.traverse((child) => {
        if (child.isMesh) {
          if (child.name.includes('mmGroup0')) {
            child.material = materialpotato;
          } else {
            child.material = materialpotato; // default material
          }
        }
      });

      scene.add(object);
      modelRef.current = object;
      setLoadingProgress(100);
      setIsModelLoaded(true);

      const animate = () => {
        if (!showAR) return;
        
        renderer.render(scene, camera);
        gl.endFrameEXP();
        animationFrameId.current = requestAnimationFrame(animate);
      };

      animate();
    } catch (e) {
      setError(`Error initializing AR scene: ${e.message}`);
    }
  };


  const fetchNutritionData = async () => {
    try {
      const response = await fetch(
        'https://world.openfoodfacts.org/api/v0/product/01252415.json'
      );
      
      if (!response.ok) {
        throw new Error('Errore nel recupero dei dati nutrizionali');
      }
      
      const data = await response.json();
      console.log('Nutrition data:', data.product?.nutriments);
      
      if (data.status === 1) {
        const nutriments = data.product.nutriments;
        setFoodData({
          productName: data.product.product_name || 'Pomodoro',
          energy: nutriments.energy_100g || 'N/A',
          proteins: nutriments.proteins_100g || 'N/A',
          carbohydrates: nutriments.carbohydrates_100g || 'N/A',
          fat: nutriments.fat_100g || 'N/A',
          fiber: nutriments.fiber_100g || 'N/A',
          vitaminC: nutriments['vitamin-c_100g'] || 'N/A',
          potassium: nutriments.potassium_100g || 'N/A',
          calcium: nutriments.calcium_100g || 'N/A'
        });
      }
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
    }
  };

  useEffect(() => {
    fetchPlantData();
    fetchNutritionData();
  }, []);

  const fetchPlantData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://openfarm.cc/api/v1/crops?filter=potato`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Errore nel recupero dei dati di coltivazione');
      }
      
      const data = await response.json();
      console.log('Attributi della pianta:', data.data[0].attributes);
      
      if (data.data.length === 0) {
        throw new Error("Nessuna informazione trovata su OpenFarm");
      }

      const plantData = data.data[0].attributes;
      
      setFarmData({
        name: plantData.name || 'Non disponibile',
        scientificName: plantData.binomial_name || 'Non disponibile',
        description: plantData.description || 'Non disponibile',
        sunRequirements: plantData.sun_requirements || 'Non specificato',
        sowingMethod: plantData.sowing_method || 'Non specificato',
        height: `${plantData.height || 'N/A'} cm`,
        spread: `${plantData.spread || 'N/A'} cm`,
        rowSpacing: `${plantData.row_spacing || 'N/A'} cm`,
        growingDegreeDays: plantData.growing_degree_days || 'Non specificato',
        tags: plantData.tags_array?.join(', ') || 'Nessun tag',
        commonNames: plantData.common_names?.join(', ') || 'Non disponibile'
      });
      
      setIsLoading(false);
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const mapSunRequirements = (light) => {
    const lightMap = {
      0: 'Ombra completa',
      1: 'Ombra parziale',
      2: 'Sole filtrato',
      3: 'Pieno sole'
    };
    return lightMap[light] || 'Non specificato';
  };



  const toggleInfoBox = () => {
    const toValue = isInfoExpanded ? MIN_INFO_HEIGHT : MAX_INFO_HEIGHT;
    Animated.spring(infoBoxHeight, {
      toValue,
      useNativeDriver: false,
      friction: 10,
    }).start();
    setIsInfoExpanded(!isInfoExpanded);
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
            <TouchableOpacity 
              style={styles.expandButton} 
              onPress={toggleInfoBox}
              activeOpacity={0.7}
            >
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
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                farmData && (
                  <View style={styles.infoSection}>
                    <View style={styles.headerContainer}>
                      <Text style={styles.mainTitle}>Patata</Text>
                      <Text style={styles.scientificName}>{farmData.scientificName}</Text>
                    </View>
  
                    <View style={styles.cardContainer}>
                      <View style={styles.infoCard}>
                        <Text style={styles.cardTitle}>Descrizione</Text>
                        <Text style={styles.cardText}>{farmData.description}</Text>
                      </View>
  
                      <View style={styles.infoCard}>
                        <Text style={styles.cardTitle}>Requisiti di Coltivazione</Text>
                        <View style={styles.requirementRow}>
                          <Text style={styles.requirementLabel}>☀️ Esposizione:</Text>
                          <Text style={styles.requirementValue}>{farmData.sunRequirements}</Text>
                        </View>
                        <View style={styles.requirementRow}>
                          <Text style={styles.requirementLabel}>🌱 Semina:</Text>
                          <Text style={styles.requirementValue}>{farmData.sowingMethod}</Text>
                        </View>
                        <View style={styles.requirementRow}>
                          <Text style={styles.requirementLabel}>📏 Altezza:</Text>
                          <Text style={styles.requirementValue}>{farmData.height}</Text>
                        </View>
                        <View style={styles.requirementRow}>
                          <Text style={styles.requirementLabel}>↔️ Spaziatura:</Text>
                          <Text style={styles.requirementValue}>{farmData.rowSpacing}</Text>
                        </View>
                      <View style={styles.requirementRow}>
                        <Text style={styles.requirementLabel}>🌡️ Giorni di crescita:</Text>
                        <Text style={styles.requirementValue}>{farmData.growingDegreeDays} giorni</Text>
                      </View>
                      </View>
  
                      {foodData && (
                        <View style={styles.infoCard}>
                          <Text style={styles.cardTitle}>Valori Nutrizionali</Text>
                          <Text style={styles.cardSubtitle}>per 100g di prodotto</Text>
                          <View style={styles.nutrientGrid}>
                            <View style={styles.nutrientItem}>
                              <Text style={styles.nutrientValue}>{foodData.energy}</Text>
                              <Text style={styles.nutrientLabel}>kcal</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                              <Text style={styles.nutrientValue}>{foodData.proteins}</Text>
                              <Text style={styles.nutrientLabel}>Proteine</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                              <Text style={styles.nutrientValue}>{foodData.carbohydrates}</Text>
                              <Text style={styles.nutrientLabel}>Carboidrati</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                              <Text style={styles.nutrientValue}>{foodData.fat}</Text>
                              <Text style={styles.nutrientLabel}>Grassi</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                              <Text style={styles.nutrientValue}>{foodData.fiber}</Text>
                              <Text style={styles.nutrientLabel}>Fibre</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                              <Text style={styles.nutrientValue}>{foodData.vitaminC}</Text>
                              <Text style={styles.nutrientLabel}>Vitamina C</Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )
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
    backgroundColor: 'transparent',
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
    paddingVertical: 8,
    marginBottom: 5,
  },
  expandButtonInner: {
    width: 40,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandLine: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: '#4CAF50',
    borderRadius: 1,
  },
  taxonomyInfo: {
    fontSize: 14,
    color: '#558B22',
    marginTop: 4,
    fontStyle: 'italic',
  },
  expandLineRotated: {
    transform: [{ rotate: '45deg' }],
  },
  infoSection: {
    paddingBottom: 20,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2E7D32',
  },
  infoSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
    color: '#388E3C',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    color: '#1B5E20',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    lineHeight: 22,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  headerContainer: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 5,
  },
  scientificName: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#558B2F',
  },
  cardContainer: {
    gap: 15,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#689F38',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  cardText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  requirementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  requirementLabel: {
    fontSize: 16,
    color: '#33691E',
    fontWeight: '500',
  },
  requirementValue: {
    fontSize: 16,
    color: '#424242',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  nutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  nutrientItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    padding: 10,
    borderRadius: 8,
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  nutrientLabel: {
    fontSize: 14,
    color: '#558B2F',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContent: {
    marginTop: 10,
  },
  expandButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  expandIcon: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
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



export default PotatoScene;