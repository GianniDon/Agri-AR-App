import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  Modal,
  Linking,
  Platform
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from 'expo-location';

// Configurazione API OpenStreetMap Overpass
const API_BASE_URL = 'https://overpass-api.de/api/interpreter';
// Raggio di ricerca in km
const SEARCH_RADIUS = 30;

const FruitMarkets = () => {
  const router = useRouter();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMarkets, setFilteredMarkets] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  
  // Stato per il modal di posizione iniziale
  const [locationModalVisible, setLocationModalVisible] = useState(true);
  const [manualLocation, setManualLocation] = useState('');
  const [manualLocationError, setManualLocationError] = useState(null);
  const [marketsLoaded, setMarketsLoaded] = useState(false);
  
  // Funzione per cercare una posizione tramite geocoding
  const geocodeLocation = async (locationString) => {
    try {
      setManualLocationError(null);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationString)}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      } else {
        throw new Error('Posizione non trovata');
      }
    } catch (error) {
      console.log('Nessun risultato trovato per:', locationString);
      setManualLocationError('Non è stato possibile trovare la posizione specificata. Prova con un indirizzo più preciso.');
      return null;
    }
  };
  
  // Funzione per gestire l'invio della posizione manuale
  const handleManualLocationSubmit = async () => {
    if (!manualLocation.trim()) {
      setManualLocationError('Inserisci un indirizzo valido');
      return;
    }
    
    setLoading(true);
    const geocodedLocation = await geocodeLocation(manualLocation);
    
    if (geocodedLocation) {
      setUserLocation(geocodedLocation);
      setLocationModalVisible(false);
      fetchMarkets(geocodedLocation);
    } else {
      setLoading(false);
    }
  };
  
  // Funzione per gestire la richiesta della posizione GPS
  const handleUseCurrentLocation = async () => {
    try {
      setManualLocationError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setManualLocationError('È necessario concedere l\'accesso alla posizione per utilizzare questa funzione.');
        return;
      }
      
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      console.log('Posizione GPS ottenuta:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp).toLocaleString()
      });
      
      const currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      setUserLocation(currentLocation);
      setLocationModalVisible(false);
      fetchMarkets(currentLocation);
    } catch (error) {
      console.error('Errore nell\'ottenere la posizione:', error);
      setManualLocationError('Impossibile ottenere la posizione attuale. Verifica che il GPS sia attivo.');
      setLoading(false);
    }
  };
  
  // Funzione per costruire la query Overpass - MODIFICATA per mercati ortofrutticoli
  const buildOverpassQuery = (lat, lng, radius) => {
    // Raggio in metri (10 km = 10000 metri)
    const radiusMeters = radius * 1000;
    return `
      [out:json];
      (
        // Mercati ortofrutticoli
        node["shop"="greengrocer"](around:${radiusMeters},${lat},${lng});
        way["shop"="greengrocer"](around:${radiusMeters},${lat},${lng});
        
        // Mercati di frutta e verdura
        node["shop"="fruit"](around:${radiusMeters},${lat},${lng});
        way["shop"="fruit"](around:${radiusMeters},${lat},${lng});
        
        // Mercati contadini che vendono frutta e verdura
        node["amenity"="marketplace"]["produce"~"fruit|vegetables"](around:${radiusMeters},${lat},${lng});
        way["amenity"="marketplace"]["produce"~"fruit|vegetables"](around:${radiusMeters},${lat},${lng});
        
        // Negozi di ortofrutta
        node["shop"="farm"]["produce"~"fruit|vegetables"](around:${radiusMeters},${lat},${lng});
        way["shop"="farm"]["produce"~"fruit|vegetables"](around:${radiusMeters},${lat},${lng});
        
        // Bancarelle di frutta e verdura
        node["amenity"="marketplace"]["stall"="fruits_vegetables"](around:${radiusMeters},${lat},${lng});
        way["amenity"="marketplace"]["stall"="fruits_vegetables"](around:${radiusMeters},${lat},${lng});
      );
      out body;
      >;
      out skel qt;
    `;
  };
  
  const fetchMarkets = async (location) => {
    setLoading(true);
    setError(null);
    
    // Verifica che la posizione dell'utente sia disponibile
    if (!location) {
      setError('Per visualizzare i mercati ortofrutticoli è necessario inserire la tua posizione.');
      setLoading(false);
      return;
    }
    
    try {
      const apiUrl = API_BASE_URL;
      
      // Costruisci la query utilizzando la posizione
      const query = buildOverpassQuery(
        location.latitude,
        location.longitude,
        SEARCH_RADIUS
      );
      
      const params = { data: query };
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      });
      
      if (!response.ok) {
        throw new Error(`Errore nella richiesta: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Trasforma i dati OSM al formato dell'app
      const formattedMarkets = transformOSMData(data, location);
      
      setMarkets(formattedMarkets);
      setFilteredMarkets(formattedMarkets);
      setMarketsLoaded(true);
    } catch (error) {
      console.error('Errore nel recupero dei mercati:', error);
      setError('Non è stato possibile caricare i mercati ortofrutticoli. Riprova più tardi.');
      
      // In ambiente di sviluppo, usa dati di fallback
      if (__DEV__) {
        console.log('Caricamento dati di fallback in ambiente di sviluppo');
        const formattedFallbackMarkets = fallbackMarkets.map(market => ({
          ...market,
          // Aggiungi coordinate fittizie per i dati di fallback
          coordinates: {
            latitude: 41.9028 + (Math.random() * 0.02 - 0.01), // Roma circa
            longitude: 12.4964 + (Math.random() * 0.02 - 0.01)
          }
        }));
        setMarkets(formattedFallbackMarkets);
        setFilteredMarkets(formattedFallbackMarkets);
        setMarketsLoaded(true);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Funzione per trasformare i dati da OpenStreetMap
  const transformOSMData = (osmData, userLocation) => {
    const markets = [];
    
    if (!osmData.elements || osmData.elements.length === 0) {
      return [];
    }
    
    // Mappa per tenere traccia dei nodi già processati (evita duplicati)
    const processedIds = new Set();
    
    for (const element of osmData.elements) {
      // Saltiamo gli elementi che non sono nodi o way con tags
      if ((element.type !== 'node' && element.type !== 'way') || !element.tags) {
        continue;
      }
      
      // Evita duplicati
      if (processedIds.has(element.id)) {
        continue;
      }
      processedIds.add(element.id);
      
      const tags = element.tags || {};
      
      // Estrai le coordinate del mercato
      let coordinates = null;
      if (element.lat && element.lon) {
        coordinates = {
          latitude: element.lat,
          longitude: element.lon
        };
      }
      
      // Calcola la distanza (solo per i nodi che hanno coordinate dirette)
      let distance = null;
      if (userLocation && coordinates) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          coordinates.latitude,
          coordinates.longitude
        ).toFixed(1) + ' km';
      }
      
      // Definisci il tipo di negozio ortofrutticolo
      let marketType = 'Mercato generico frutta e verdura';
      if (tags.shop === 'greengrocer') {
        marketType = 'Fruttivendolo';
      } else if (tags.shop === 'fruit') {
        marketType = 'Negozio di frutta';
      } else if (tags.shop === 'farm' && tags.produce && /fruit|vegetables/.test(tags.produce)) {
        marketType = 'Azienda agricola con vendita diretta';
      } else if (tags.amenity === 'marketplace' && tags.stall === 'fruits_vegetables') {
        marketType = 'Banco frutta e verdura';
      }
      
      // Estrai prodotti dalle tags
      const products = [];
      if (tags.produce) products.push(...tags.produce.split(';').map(p => p.trim()));
      if (tags.products) products.push(...tags.products.split(';').map(p => p.trim()));
      
      // Filtra per ottenere solo prodotti ortofrutticoli
      const fruitVeggieProducts = products.filter(product => 
        /fruit|vegetable|apple|orange|lemon|banana|tomato|potato|lettuce|carrot|cucumber|ortaggi|frutta|verdura|mela|arancia|limone|banana|pomodoro|patata|insalata|carota|cetriolo/i.test(product)
      );
      
      // Se non ci sono prodotti ortofrutticoli e non è specificatamente un negozio ortofrutticolo, salta
      if (fruitVeggieProducts.length === 0 && 
          tags.shop !== 'greengrocer' && 
          tags.shop !== 'fruit' && 
          tags.stall !== 'fruits_vegetables') {
        // Verifica se c'è una menzione esplicita di frutta e verdura nella descrizione
        if (!tags.description || !/fruit|vegetable|ortaggi|frutta|verdura/i.test(tags.description)) {
          continue;
        }
      }
      
      // Costruisci l'indirizzo
      let address = 'Indirizzo non disponibile';
      if (tags['addr:street'] || tags['addr:housenumber'] || tags['addr:city']) {
        address = [
          tags['addr:street'], 
          tags['addr:housenumber'], 
          tags['addr:postcode'], 
          tags['addr:city']
        ].filter(Boolean).join(', ');
      } else if (tags.address) {
        address = tags.address;
      }
      
      // Estrai certificazioni
      const certifications = [];
      if (tags.organic === 'yes') certifications.push('Biologico');
      if (tags.local_produce === 'yes' || tags.local === 'yes') certifications.push('Km0');
      
      // Se non abbiamo coordinate, salta questo mercato
      if (!coordinates) continue;
      
      markets.push({
        id: element.id.toString(),
        name: tags.name || marketType,
        address: address,
        schedule: formatSchedule(tags.opening_hours) || 'Orari non disponibili',
        distance: distance,
        products: fruitVeggieProducts.length > 0 ? fruitVeggieProducts : ['Frutta e verdura'],
        imageUrl: null,
        certifications: certifications,
        type: marketType,
        coordinates: coordinates, // Aggiungi le coordinate al mercato
        displayDistance: distance, // Memorizza la distanza formattata per la visualizzazione
        rawDistance: distance ? parseFloat(distance.split(' ')[0]) : 9999, // Memorizza la distanza numerica per l'ordinamento
      });
    }
    
    // Ordina i mercati per distanza (i più vicini prima)
    return markets.sort((a, b) => a.rawDistance - b.rawDistance);
  };
  
  // Formatta gli orari di apertura in un formato leggibile
  const formatSchedule = (openingHours) => {
    if (!openingHours) return null;
    
    // Esempio: "Mo-Fr 08:00-18:00; Sa 08:00-14:00" -> "Lunedì-Venerdì: 08:00-18:00, Sabato: 08:00-14:00"
    try {
      const days = {
        'Mo': 'Lunedì',
        'Tu': 'Martedì',
        'We': 'Mercoledì',
        'Th': 'Giovedì',
        'Fr': 'Venerdì',
        'Sa': 'Sabato',
        'Su': 'Domenica'
      };
      
      return openingHours
        .split(';')
        .map(part => {
          const [dayRange, timeRange] = part.trim().split(' ');
          
          // Sostituisci i codici dei giorni con i nomi italiani
          let italianDays = dayRange;
          Object.entries(days).forEach(([code, name]) => {
            italianDays = italianDays.replace(code, name);
          });
          
          return `${italianDays}: ${timeRange}`;
        })
        .join(', ');
    } catch (e) {
      console.error('Errore nel formattare l\'orario:', e);
      return openingHours; // Ritorna il formato originale se c'è un errore
    }
  };
  
  // Calcola la distanza tra due punti (formula di Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raggio della Terra in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  // Nuova funzione per aprire Google Maps
  const openInGoogleMaps = (market) => {
    if (!market.coordinates) {
      Alert.alert(
        "Errore",
        "Coordinate non disponibili per questo mercato.",
        [{ text: "OK" }]
      );
      return;
    }
    
    const { latitude, longitude } = market.coordinates;
    // Nome del mercato encodato per l'URL
    const label = encodeURIComponent(market.name);
    
    // Costruisci l'URL per Google Maps
    let url;
    if (Platform.OS === 'ios') {
      // URL per iOS
      url = `https://maps.apple.com/?q=${label}&ll=${latitude},${longitude}`;
    } else {
      // URL per Android
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${market.id}&travelmode=driving`;
    }
    
    // Apri Google Maps
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert(
            "Errore",
            "Non è stato possibile aprire l'app di navigazione.",
            [{ text: "OK" }]
          );
        }
      })
      .catch((error) => {
        console.error('Errore nell\'apertura dell\'app di navigazione:', error);
        Alert.alert(
          "Errore",
          "Si è verificato un errore durante l'apertura dell'app di navigazione.",
          [{ text: "OK" }]
        );
      });
  };
  
  // Filtro per la ricerca
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMarkets(markets);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = markets.filter(market => 
        market.name.toLowerCase().includes(lowercaseQuery) ||
        market.address.toLowerCase().includes(lowercaseQuery) ||
        market.type.toLowerCase().includes(lowercaseQuery) ||
        (market.products && market.products.some(product => 
          product.toLowerCase().includes(lowercaseQuery)
        ))
      );
      setFilteredMarkets(filtered);
    }
  }, [searchQuery, markets]);
  
  const goBack = () => {
    router.back();
  };
  
  const handleRetry = () => {
    // Riapri il modale di inserimento posizione
    setLocationModalVisible(true);
  };

  // Gestione degli URL delle immagini dall'API
  const getImageSource = (market) => {
    if (market.imageUrl) {
      // Se l'API fornisce un URL immagine completo
      return { uri: market.imageUrl };
    } else {
      // Immagine di fallback locale basata sul tipo di mercato
    //   return require('../assets/images/fruit-vegetables.png');
    }
  };
  
  const renderMarketItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.marketCard}
      onPress={() => openInGoogleMaps(item)}
    >
      <LinearGradient
        colors={['rgba(59, 130, 246, 0.1)', 'rgba(37, 99, 235, 0.2)']}
        style={styles.marketGradient}
      >
        <View style={styles.marketImageContainer}>
          <Image source={getImageSource(item)} style={styles.marketImage} resizeMode="cover" />
        </View>
        <View style={styles.marketInfo}>
          <Text style={styles.marketName}>{item.name}</Text>
          <View style={styles.marketTypeContainer}>
            <Text style={styles.marketTypeText}>{item.type}</Text>
          </View>
          <View style={styles.marketDetail}>
            <Ionicons name="location-outline" size={16} color="#E5E7EB" />
            <Text style={styles.marketText}>{item.address}</Text>
          </View>
          <View style={styles.marketDetail}>
            <Ionicons name="time-outline" size={16} color="#E5E7EB" />
            <Text style={styles.marketText}>{item.schedule}</Text>
          </View>
          {item.distance && (
            <View style={styles.marketDetail}>
              <Ionicons name="navigate-outline" size={16} color="#E5E7EB" />
              <Text style={styles.marketText}>Distanza: {item.distance}</Text>
            </View>
          )}
          {item.certifications && item.certifications.length > 0 && (
            <View style={styles.marketDetail}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#E5E7EB" />
              <Text style={styles.marketText}>Certificazioni: {item.certifications.join(', ')}</Text>
            </View>
          )}
          <View style={styles.productsContainer}>
            {item.products && item.products.map((product, index) => (
              <View key={index} style={styles.productTag}>
                <Text style={styles.productText}>{product}</Text>
              </View>
            ))}
          </View>
          
          {/* Pulsante per la navigazione */}
          <TouchableOpacity 
            style={styles.directionsButton}
            onPress={() => openInGoogleMaps(item)}
          >
            <Ionicons name="navigate" size={18} color="#FFFFFF" />
            <Text style={styles.directionsButtonText}>Apri in Google Maps</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
  
  // Renderizzazione del modal di inserimento posizione iniziale
  const renderLocationModal = () => (
    <Modal
      visible={locationModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        // Se l'utente ha già caricato i mercati, permetti di chiudere il modal
        if (marketsLoaded) {
          setLocationModalVisible(false);
        } else {
          // Altrimenti, non permettere la chiusura senza aver inserito la posizione
          Alert.alert(
            "Attenzione",
            "Per visualizzare i mercati ortofrutticoli è necessario inserire la tua posizione.",
            [{ text: "OK" }]
          );
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Inserisci la tua posizione</Text>
            {marketsLoaded && (
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.modalSubtitle}>
            Per trovare i negozi di frutta e verdura nella tua zona, è necessario specificare la tua posizione.
          </Text>
          
          <View style={styles.locationInputContainer}>
            <Ionicons name="location-outline" size={20} color="#94A3B8" style={styles.locationInputIcon} />
            <TextInput
              style={styles.locationInput}
              placeholder="Es. Via Roma 1, Milano"
              placeholderTextColor="#94A3B8"
              value={manualLocation}
              onChangeText={setManualLocation}
              autoCapitalize="words"
            />
          </View>
          
          {manualLocationError && (
            <Text style={styles.locationInputError}>{manualLocationError}</Text>
          )}
          
          <TouchableOpacity 
            style={styles.locationSubmitButton} 
            onPress={handleManualLocationSubmit}
          >
            <Text style={styles.locationSubmitText}>Cerca ortofrutticoli</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.getCurrentLocationButton} 
            onPress={handleUseCurrentLocation}
          >
            <Ionicons name="navigate" size={18} color="#3B82F6" style={{ marginRight: 8 }} />
            <Text style={styles.getCurrentLocationText}>Usa posizione attuale</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <LinearGradient
        colors={['#111827', '#1E3A8A']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={goBack}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mercati Ortofrutticoli</Text>
          <View style={styles.placeholderButton} />
        </View>
        
        {/* Search Bar - mostrata solo quando abbiamo caricato i mercati */}
        {marketsLoaded && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cerca frutta, verdura, negozi..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        
        {/* Pulsante per cambiare posizione - mostrato solo quando abbiamo caricato i mercati */}
        {marketsLoaded && (
          <TouchableOpacity 
            style={styles.changeLocationButton}
            onPress={() => setLocationModalVisible(true)}
          >
            <Ionicons name="location" size={18} color="#FFFFFF" />
            <Text style={styles.changeLocationText}>Cambia posizione</Text>
          </TouchableOpacity>
        )}
        
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Ricerca negozi di frutta e verdura...</Text>
          </View>
        )}
        
        {/* Error State */}
        {!loading && error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#F87171" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Riprova</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Markets List - mostrata solo se non stiamo caricando, non ci sono errori, e abbiamo caricato i mercati */}
        {!loading && !error && marketsLoaded && (
          <>
            <Text style={styles.resultsText}>
              {filteredMarkets.length} negozi ortofrutticoli trovati entro {SEARCH_RADIUS} km dalla tua posizione
            </Text>
            <FlatList
              data={filteredMarkets}
              renderItem={renderMarketItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.marketsList}
              showsVerticalScrollIndicator={false}
              refreshing={loading}
              onRefresh={() => fetchMarkets(userLocation)}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="sad-outline" size={64} color="#94A3B8" />
                  <Text style={styles.emptyText}>Nessun negozio trovato</Text>
                  <Text style={styles.emptySubtext}>Nessun negozio ortofrutticolo trovato entro {SEARCH_RADIUS} km dalla tua posizione</Text>
                  <TouchableOpacity 
                    style={[styles.retryButton, { marginTop: 20, backgroundColor: '#10B981' }]} 
                    onPress={() => setLocationModalVisible(true)}
                  >
                    <Text style={styles.retryButtonText}>Cambia posizione</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </>
        )}
        
        {/* Info Button - mostrato solo quando abbiamo caricato i mercati */}
        {marketsLoaded && (
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => Alert.alert(
              "Informazioni",
              `Questa pagina mostra i negozi di frutta e verdura entro ${SEARCH_RADIUS} km dalla tua posizione. I dati sono forniti da OpenStreetMap. Clicca su un negozio per aprire Google Maps e ottenere indicazioni stradali.`,
              [{ text: "OK" }]
            )}
          >
            <LinearGradient
              colors={['#10B981', '#047857']}
              style={styles.infoButtonGradient}
            >
              <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        {/* Modal per l'inserimento della posizione - reso sempre visibile all'avvio */}
        {renderLocationModal()}
      </LinearGradient>
    </SafeAreaView>
  );
};

// Dati di fallback per sviluppo o test
// Dati di fallback per sviluppo o test
const fallbackMarkets = [
    {
      id: '1',
      name: 'Frutta e Verdura da Mario',
      address: 'Via Roma 123, Roma',
      schedule: 'Lunedì-Venerdì: 08:00-19:00, Sabato: 08:00-13:00',
      products: ['Frutta di stagione', 'Verdura locale', 'Agrumi'],
      type: 'Fruttivendolo',
      certifications: ['Biologico', 'Km0']
    },
    {
      id: '2',
      name: 'Mercato Contadino',
      address: 'Piazza Navona 45, Roma',
      schedule: 'Martedì-Sabato: 07:00-14:00',
      products: ['Ortaggi freschi', 'Frutta', 'Erbe aromatiche'],
      type: 'Azienda agricola con vendita diretta',
      certifications: ['Km0']
    },
    {
      id: '3',
      name: 'OrtoFresco',
      address: 'Via Nazionale 78, Roma',
      schedule: 'Lunedì-Sabato: 09:00-20:00',
      products: ['Frutta esotica', 'Verdura biologica', 'Spezie'],
      type: 'Negozio di frutta',
      certifications: ['Biologico']
    }
  ];
  
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#111827',
    },
    container: {
      flex: 1,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    placeholderButton: {
      width: 40,
    },
    searchContainer: {
      marginBottom: 16,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 40,
      color: '#FFFFFF',
      fontSize: 16,
    },
    changeLocationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignSelf: 'flex-start',
      marginBottom: 16,
    },
    changeLocationText: {
      color: '#FFFFFF',
      marginLeft: 8,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      color: '#E5E7EB',
      marginTop: 16,
      fontSize: 16,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    errorText: {
      color: '#F87171',
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 20,
      fontSize: 16,
    },
    retryButton: {
      backgroundColor: '#3B82F6',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      marginTop: 10,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    resultsText: {
      color: '#E5E7EB',
      marginBottom: 16,
      fontSize: 16,
    },
    marketsList: {
      paddingBottom: 80,
    },
    marketCard: {
      marginBottom: 16,
      borderRadius: 16,
      overflow: 'hidden',
    },
    marketGradient: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    marketImageContainer: {
      height: 120,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: 'hidden',
    },
    marketImage: {
      width: '100%',
      height: '100%',
    },
    marketInfo: {
      padding: 16,
    },
    marketName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 8,
    },
    marketTypeContainer: {
      backgroundColor: 'rgba(37, 99, 235, 0.3)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 50,
      alignSelf: 'flex-start',
      marginBottom: 12,
    },
    marketTypeText: {
      color: '#93C5FD',
      fontSize: 14,
      fontWeight: '500',
    },
    marketDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    marketText: {
      color: '#E5E7EB',
      marginLeft: 8,
      flex: 1,
    },
    productsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
      marginBottom: 12,
    },
    productTag: {
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 50,
      marginRight: 8,
      marginBottom: 8,
    },
    productText: {
      color: '#6EE7B7',
      fontSize: 12,
    },
    directionsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#3B82F6',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginTop: 8,
    },
    directionsButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      marginLeft: 8,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      marginTop: 40,
    },
    emptyText: {
      color: '#E5E7EB',
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 16,
    },
    emptySubtext: {
      color: '#94A3B8',
      textAlign: 'center',
      marginTop: 8,
      fontSize: 14,
    },
    infoButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      borderRadius: 30,
      overflow: 'hidden',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    infoButtonGradient: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 24,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContainer: {
      backgroundColor: '#1F2937',
      borderRadius: 16,
      width: '90%',
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    modalSubtitle: {
      color: '#94A3B8',
      marginBottom: 16,
      fontSize: 14,
      lineHeight: 20,
    },
    locationInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 10,
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    locationInputIcon: {
      marginRight: 8,
    },
    locationInput: {
      flex: 1,
      height: 50,
      color: '#FFFFFF',
      fontSize: 16,
    },
    locationInputError: {
      color: '#F87171',
      fontSize: 14,
      marginBottom: 16,
    },
    locationSubmitButton: {
      backgroundColor: '#3B82F6',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    locationSubmitText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 16,
    },
    getCurrentLocationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
    },
    getCurrentLocationText: {
      color: '#3B82F6',
      fontWeight: '600',
      fontSize: 14,
    }
  });
  
  export default FruitMarkets;