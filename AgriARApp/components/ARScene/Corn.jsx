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

const MODEL_ID = 'corn';
const API_KEY = 'sk-C90467d027a42b3829089'; // Note: This should be a complete Perenual API key
const query = "corn";


const modelAsset = Asset.fromModule(require('../../assets/models/source/Corn.obj'));
const textureAssets = {
  corn: Asset.fromModule(require('../../assets/models/textures/corn_texture/corn.jpg'))
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

const CornScene = ({ showAR, onStopAR , navigation}) => {
   // States
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [foodData, setFoodData] = useState(null);
    const [plantData, setPlantData] = useState(null);
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
      setLoadingProgress(50);
      const cornUri = await ensureLocalAsset(textureAssets.corn);
      setLoadingProgress(70);

      return { 
        modelUri, 
        cornTextureUri: cornUri
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

      const { modelUri, cornTextureUri } = await loadAssets();

      const textureCorn = new TextureLoader().load(cornTextureUri);
      textureCorn.encoding = sRGBEncoding;

      const objLoader = new OBJLoader();
      const object = await loadModelAsync(objLoader, modelUri);
      object.rotation.x = Math.PI / -2; // Ruota di 90 gradi lungo l'asse X

      setLoadingProgress(90);
      object.scale.set(0.03, 0.03, 0.03);

      const materialCorn = new MeshStandardMaterial({
        map: textureCorn,
      });

      object.traverse((child) => {
        if (child.isMesh) {
          child.material = materialCorn;
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

  const toggleInfoBox = () => {
    const toValue = isInfoExpanded ? MIN_INFO_HEIGHT : MAX_INFO_HEIGHT;
    Animated.spring(infoBoxHeight, {
      toValue,
      useNativeDriver: false,
      friction: 10,
    }).start();
    setIsInfoExpanded(!isInfoExpanded);
  };


  const fetchNutritionData = async () => {
    try {
      const response = await fetch(
        'https://world.openfoodfacts.org/api/v0/product/3021762383344.json'
      );
      
      if (!response.ok) {
        throw new Error('Errore nel recupero dei dati nutrizionali');
      }
      
      const data = await response.json();
      console.log('Nutrition data:', data.product?.nutriments);
      
      if (data.status === 1) {
        const nutriments = data.product.nutriments;
        setFoodData({
          productName: data.product.product_name || 'Mais',
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

  const fetchPlantData = async () => {
    try {
      setIsLoading(true);
      
      // Search for tomato plant
      const searchResponse = await fetch(
        `https://perenual.com/api/species-list?key=${API_KEY}&q=${query}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!searchResponse.ok) {
        throw new Error(`Error in Perenual search: ${searchResponse.status}`);
      }
      
      const searchData = await searchResponse.json();
      
      if (!searchData.data || searchData.data.length === 0) {
        throw new Error("No plants found on Perenual");
      }
      
      // Get the first result which is likely Solanum lycopersicum (tomato)
      const plantId = searchData.data[0].id;
      console.log(plantId)
      
      // Get detailed plant information using the ID
      const detailResponse = await fetch(
        `https://perenual.com/api/species/details/${plantId}?key=${API_KEY}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!detailResponse.ok) {
        throw new Error(`Error retrieving plant details: ${detailResponse.status}`);
      }
      
      const plant = await detailResponse.json();
      
      // Structure data for UI
      setPlantData({
        name: plant.common_name || 'Tomato',
        scientificName: plant.scientific_name || 'N/A',
        family: plant.family || 'N/A',
        description: plant.description || "N/A",
        sunRequirements: formatPlantProperties(plant.sunlight) || 'N/A',
        height: formatPlantProperties(plant.dimensions?.height) || 'N/A',
        spread: formatPlantProperties(plant.dimensions?.width) || 'N/A',
        growingMonths: "N/A",
        harvestMonths: "N/A",
        soilTexture: "N/A",
        soilHumidity: "N/A",
        growthRate: plant.growth_rate || 'N/A',
        flowerColor: formatPlantProperties(plant.flowers?.color) || 'N/A',
        fruitColor: 'N/A',
        edible: plant.edible || true,
        vegetable: true,
        imgUrl: plant.default_image?.regular_url || null
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error retrieving data from Perenual:', error);
      
      setError("Unable to retrieve data from Perenual, showing alternative data");
      setIsLoading(false);
    }
  };
  
  const formatPlantProperties = (property) => {
    if (!property) return null;
    
    if (Array.isArray(property)) {
      return property.join(', ');
    }
    
    return property.toString();
  };
  const formatGrowingMonths = (months) => {
    if (!months || !Array.isArray(months) || months.length === 0) return null;
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Convert month numbers to names
    const formattedMonths = months.map(m => monthNames[m - 1]);
    
    // If consecutive months, show range
    if (months.length > 1 && 
        months.every((val, i, arr) => i === 0 || val === arr[i - 1] + 1)) {
      return `${monthNames[months[0] - 1]}-${monthNames[months[months.length - 1] - 1]}`;
    }
    
    return formattedMonths.join(', ');
  };




  useEffect(() => {
    fetchPlantData();
    fetchNutritionData();
  }, []);

  return (
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>← Back</Text>
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
                  plantData && (
                    <View style={styles.infoSection}>
                      <View style={styles.headerContainer}>
                        <Text style={styles.mainTitle}>{plantData.name}</Text>
                        <Text style={styles.scientificName}>{plantData.scientificName}</Text>
                        <Text style={styles.familyName}>Family: {plantData.family}</Text>
                      </View>
    
                      <View style={styles.cardContainer}>
                        <View style={styles.infoCard}>
                          <Text style={styles.cardTitle}>Description</Text>
                          <Text style={styles.cardText}>{plantData.description}</Text>
                        </View>
    
                        <View style={styles.infoCard}>
                          <Text style={styles.cardTitle}>Growing Requirements</Text>
                          <View style={styles.requirementRow}>
                            <Text style={styles.requirementLabel}>☀️ Exposure:</Text>
                            <Text style={styles.requirementValue}>{plantData.sunRequirements}</Text>
                          </View>
                          <View style={styles.requirementRow}>
                            <Text style={styles.requirementLabel}>🌱 Growing period:</Text>
                            <Text style={styles.requirementValue}>{plantData.growingMonths}</Text>
                          </View>
                          <View style={styles.requirementRow}>
                            <Text style={styles.requirementLabel}>🍅 Harvest period:</Text>
                            <Text style={styles.requirementValue}>{plantData.harvestMonths}</Text>
                          </View>
                          <View style={styles.requirementRow}>
                            <Text style={styles.requirementLabel}>📏 Height:</Text>
                            <Text style={styles.requirementValue}>{plantData.height}</Text>
                          </View>
                          <View style={styles.requirementRow}>
                            <Text style={styles.requirementLabel}>↔️ Width:</Text>
                            <Text style={styles.requirementValue}>{plantData.spread}</Text>
                          </View>
                          <View style={styles.requirementRow}>
                            <Text style={styles.requirementLabel}>🌱 Growth rate:</Text>
                            <Text style={styles.requirementValue}>{plantData.growthRate}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.infoCard}>
                          <Text style={styles.cardTitle}>Characteristics</Text>
                          <View style={styles.requirementRow}>
                            <Text style={styles.requirementLabel}>🌸 Flower color:</Text>
                            <Text style={styles.requirementValue}>{plantData.flowerColor}</Text>
                          </View>
                          <View style={styles.requirementRow}>
                            <Text style={styles.requirementLabel}>🍅 Fruit color:</Text>
                            <Text style={styles.requirementValue}>{plantData.fruitColor}</Text>
                          </View>
                          <View style={styles.requirementRow}>
                            <Text style={styles.requirementLabel}>🌍 Soil:</Text>
                            <Text style={styles.requirementValue}>{plantData.soilTexture}</Text>
                          </View>
                          <View style={styles.requirementRow}>
                            <Text style={styles.requirementLabel}>💧 Humidity:</Text>
                            <Text style={styles.requirementValue}>{plantData.soilHumidity}</Text>
                          </View>
                          <View style={styles.requirementRow}>
                            <Text style={styles.requirementLabel}>🍽️ Edible:</Text>
                            <Text style={styles.requirementValue}>{plantData.edible ? 'Yes' : 'No'}</Text>
                          </View>
                        </View>
    
                        {foodData && (
                          <View style={styles.infoCard}>
                            <Text style={styles.cardTitle}>Nutritional Values</Text>
                            <Text style={styles.cardSubtitle}>per 100g of product</Text>
                            <View style={styles.nutrientGrid}>
                              <View style={styles.nutrientItem}>
                                <Text style={styles.nutrientValue}>{foodData.energy}</Text>
                                <Text style={styles.nutrientLabel}>kcal</Text>
                              </View>
                              <View style={styles.nutrientItem}>
                                <Text style={styles.nutrientValue}>{foodData.proteins}</Text>
                                <Text style={styles.nutrientLabel}>Proteins</Text>
                              </View>
                              <View style={styles.nutrientItem}>
                                <Text style={styles.nutrientValue}>{foodData.carbohydrates}</Text>
                                <Text style={styles.nutrientLabel}>Carbs</Text>
                              </View>
                              <View style={styles.nutrientItem}>
                                <Text style={styles.nutrientValue}>{foodData.fat}</Text>
                                <Text style={styles.nutrientLabel}>Fat</Text>
                              </View>
                              <View style={styles.nutrientItem}>
                                <Text style={styles.nutrientValue}>{foodData.fiber}</Text>
                                <Text style={styles.nutrientLabel}>Fiber</Text>
                              </View>
                              <View style={styles.nutrientItem}>
                                <Text style={styles.nutrientValue}>{foodData.vitaminC}</Text>
                                <Text style={styles.nutrientLabel}>Vitamin C</Text>
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
    marginBottom: 5,
  },
  familyName: {
    fontSize: 16,
    color: '#7CB342',
  },
  cardContainer: {
    gap: 15,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#388E3C',
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  cardText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  requirementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  requirementLabel: {
    fontSize: 14,
    color: '#555555',
    flex: 1,
  },
  requirementValue: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
    fontWeight: '500',
  },
  nutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  nutrientItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 15,
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nutrientLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 3,
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
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4CAF50',
  }
});


export default CornScene;