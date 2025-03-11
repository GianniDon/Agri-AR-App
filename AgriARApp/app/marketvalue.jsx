import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Dimensions,
  TextInput,
  Image
} from 'react-native';
import { Platform } from 'react-native';

import { Feather } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// FAO GIEWS FPMA API - API per dati sui prezzi agricoli globali
const FAO_BASE_URL = "https://fpma.apps.fao.org/giews/food-prices/api/";

const AgroMarketData = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [error, setError] = useState(null);

  // Categorie di prodotti agricoli
  const categories = [
    'Tutti',
    'Frutta',
    'Verdura',
    'Cereali',
    'Legumi',
    'Biologico'
  ];

  // Mappatura delle commodities agricole alle categorie
  const commodityToCategory = {
    'MAIZE': 'Cereali',
    'WHEAT': 'Cereali',
    'RICE': 'Cereali',
    'SOYBEANS': 'Legumi',
    'ORANGES': 'Frutta',
    'APPLES': 'Frutta',
    'POTATOES': 'Verdura',
    'COFFEE': 'Biologico',
    'SUGAR': 'Biologico'
  };

  // Configurazione dei prodotti agricoli da cercare
  const commoditySymbols = [
    { symbol: 'MAIZE', name: 'Mais', faoId: 4 },
    { symbol: 'WHEAT', name: 'Frumento', faoId: 1 },
    { symbol: 'RICE', name: 'Riso', faoId: 5 },
    { symbol: 'SOYBEANS', name: 'Soia', faoId: 26 },
    { symbol: 'POTATOES', name: 'Patate', faoId: 31 },
    { symbol: 'ORANGES', name: 'Arance', faoId: 69 },
    { symbol: 'APPLES', name: 'Mele', faoId: 39 },
    { symbol: 'SUGAR', name: 'Zucchero', faoId: 24 },
    { symbol: 'COFFEE', name: 'Caffè', faoId: 27 }
  ];

  // Funzione per ottenere tutti i dati dalle API FAO
  const fetchAllCommoditiesData = async () => {
    setLoading(true);
    setError(null);
    
    // In ambiente web, usa sempre i dati mock
    if (Platform.OS === 'web') {
      console.log("Utilizzo dati mock in ambiente web per evitare errori CORS");
      const mockData = generateMockData();
      setProductData(mockData);
      setFilteredData(mockData);
      setLoading(false);
      return;
    }
    
    console.log("Iniziando il recupero dei dati delle materie prime da FAO GIEWS FPMA...");setLoading(true);
    setError(null);
    
    console.log("Iniziando il recupero dei dati delle materie prime da FAO GIEWS FPMA...");
    
    try {
      const allData = [];
      
      // Ottieni le commodities da cercare in base alla categoria selezionata
      const commoditiesToFetch = selectedCategory === 'Tutti' 
        ? commoditySymbols 
        : commoditySymbols.filter(c => 
            commodityToCategory[c.symbol] === selectedCategory
          );
      
      // Limita il numero di richieste per evitare sovraccarico
      const commoditiesToProcess = commoditiesToFetch.slice(0, 5);
      
      // Primo passo: ottieni i paesi disponibili
      const countriesResponse = await fetch(`${FAO_BASE_URL}/v1/country/list`);
      
      if (!countriesResponse.ok) {
        throw new Error(`Errore API: ${countriesResponse.status} ${countriesResponse.statusText}`);
      }
      
      const countriesData = await countriesResponse.json();
      console.log(`Ricevuta lista di ${countriesData.length} paesi`);
      
      // Seleziona alcuni paesi principali per limitare le richieste
      const majorCountries = [
        {id: 33, name: 'Italia'}, 
        {id: 231, name: 'Stati Uniti'}, 
        {id: 53, name: 'Francia'}, 
        {id: 108, name: 'Brasile'}
      ];
      
      // Per ogni commodity, recupera i dati dai paesi principali
      for (const commodity of commoditiesToProcess) {
        try {
          // Aggiungiamo un ritardo tra le chiamate API per evitare rate limiting
          if (allData.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1200));
          }
          
          // Seleziona un paese casuale tra quelli principali per questa commodity
          const selectedCountry = majorCountries[Math.floor(Math.random() * majorCountries.length)];
          
          const data = await fetchFaoCommodityData(commodity, selectedCountry);
          if (data) {
            allData.push(data);
          }
        } catch (commodityError) {
          console.warn(`Errore nel recupero dei dati per ${commodity.name}: ${commodityError.message}`);
          // Continuiamo con la prossima commodity anche se una fallisce
        }
      }
      
      console.log(`Ricevuti dati per ${allData.length} materie prime`);
      
      // Se non abbiamo ricevuto dati reali dall'API, aggiungiamo dati di fallback
      if (allData.length === 0) {
        console.log("Nessun dato ricevuto dalle chiamate API");
        throw new Error('Nessun dato ricevuto dall\'API');
      }
      
      setProductData(allData);
      setFilteredData(allData);
    } catch (error) {
      console.error("Dettagli errore:", error.message, error.stack);
      setError(`Impossibile caricare i dati: ${error.message}`);
      
      // Dati di esempio come fallback
      const mockData = generateMockData();
      setProductData(mockData);
      setFilteredData(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Funzione per ottenere dati su una singola materia prima tramite FAO API
  const fetchFaoCommodityData = async (commodity, country) => {
    console.log(`[DEBUG] Inizio fetchFaoCommodityData per ${commodity.symbol} (${commodity.name}) in ${country.name}`);
    
    try {
      // Ottieni i dati delle serie temporali per questa commodità e paese
      const timeseriesUrl = `${FAO_BASE_URL}/v1/timeseries/list?commodity=${commodity.faoId}&country=${country.id}`;
      console.log(`[DEBUG] URL API FAO per timeseries: ${timeseriesUrl}`);
      
      const timeseriesResponse = await fetch(timeseriesUrl);
      
      if (!timeseriesResponse.ok) {
        console.error(`[ERRORE] Risposta API non ok: ${timeseriesResponse.status} ${timeseriesResponse.statusText}`);
        throw new Error(`Errore API: ${timeseriesResponse.status} ${timeseriesResponse.statusText}`);
      }
      
      const timeseriesData = await timeseriesResponse.json();
      
      if (!timeseriesData || timeseriesData.length === 0) {
        console.warn(`[AVVISO] Nessuna serie temporale trovata per ${commodity.name}`);
        throw new Error(`Nessun dato trovato per ${commodity.name}`);
      }
      
      // Seleziona la prima serie temporale disponibile
      const seriesId = timeseriesData[0].id;
      
      // Ottieni i dati di prezzo effettivi dalla serie temporale
      const pricesUrl = `${FAO_BASE_URL}/v1/timeseries/price?series=${seriesId}&fromDate=${getLastYearDate()}&toDate=${getCurrentDate()}`;
      console.log(`[DEBUG] URL API FAO per prezzi: ${pricesUrl}`);
      
      const pricesResponse = await fetch(pricesUrl);
      
      if (!pricesResponse.ok) {
        throw new Error(`Errore API: ${pricesResponse.status} ${pricesResponse.statusText}`);
      }
      
      const pricesData = await pricesResponse.json();
      
      if (!pricesData || !pricesData.data || pricesData.data.length === 0) {
        throw new Error(`Nessun dato di prezzo trovato per ${commodity.name}`);
      }
      
      // Ordina i dati per data (dal più recente)
      const sortedPriceData = pricesData.data.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      // Ottieni il prezzo più recente
      const latestPrice = sortedPriceData[0];
      
      // Calcola la variazione percentuale rispetto al prezzo precedente
      let previousPrice = sortedPriceData.length > 1 ? sortedPriceData[1].value : 0;
      let trend = 'stable';
      let variation = '0%';
      
      if (previousPrice > 0) {
        const priceDiff = latestPrice.value - previousPrice;
        const percentChange = (priceDiff / previousPrice * 100).toFixed(1);
        
        trend = priceDiff > 0 ? 'up' : priceDiff < 0 ? 'down' : 'stable';
        variation = trend === 'up' ? `+${percentChange}%` : `${percentChange}%`;
      }
      
      // Ottieni informazioni sulla moneta
      const currency = timeseriesData[0].um || 'USD';
      const market = timeseriesData[0].market || country.name;
      
      // Crea l'oggetto prodotto formattato
      const resultObj = {
        id: `${commodity.symbol}-${country.id}`,
        name: commodity.name,
        category: commodityToCategory[commodity.symbol] || 'Varie',
        price: latestPrice.value,
        unit: currency,
        trend: trend,
        variation: variation,
        origin: country.name,
        market: market,
        date: latestPrice.date,
        quality: 'Standard',
        lastUpdated: new Date(),
        seasonality: determineSeasonsForCommodity(commodity.symbol, new Date())
      };
      
      console.log(`[DEBUG] Oggetto finale creato per ${commodity.symbol}:`, JSON.stringify(resultObj));
      return resultObj;
      
    } catch (error) {
      console.error(`[ERRORE CRITICO] Errore nel recupero dei dati per ${commodity.symbol}:`, error);
      throw error;
    }
  };
  
  // Funzione per determinare se un prodotto è in stagione
  const determineSeasonsForCommodity = (symbol, currentDate) => {
    const month = currentDate.getMonth();
    
    // Mappatura semplificata delle stagionalità per alcune commodities
    const seasonalityMap = {
      'APPLES': [8, 9, 10, 11], // Set-Dic
      'ORANGES': [11, 0, 1, 2, 3], // Dic-Apr
      'POTATOES': [5, 6, 7, 8, 9], // Giu-Ott
      'WHEAT': [5, 6, 7], // Giu-Ago (raccolta)
      'MAIZE': [8, 9, 10], // Set-Nov (raccolta)
      'RICE': [8, 9, 10] // Set-Nov (raccolta)
    };
    
    // Se il prodotto ha definita una stagionalità e il mese corrente è nella lista
    if (seasonalityMap[symbol] && seasonalityMap[symbol].includes(month)) {
      return 'In stagione';
    }
    
    // Prodotti considerati disponibili tutto l'anno
    if (['SOYBEANS', 'COFFEE', 'SUGAR'].includes(symbol)) {
      return 'Tutto l\'anno';
    }
    
    return 'Fuori stagione';
  };

  // Funzioni di utilità per le date
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };
  
  const getLastYearDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  };

  // Genera dati di esempio per fallback
  const generateMockData = () => {
    console.log("Generazione dati mock in corso...");
    // Filtra in base alla categoria selezionata
    let filteredCommodities = commoditySymbols;
    if (selectedCategory !== 'Tutti') {
      filteredCommodities = commoditySymbols.filter(
        c => commodityToCategory[c.symbol] === selectedCategory
      );
      
      // Se non ci sono prodotti nella categoria, mostra comunque alcuni dati
      if (filteredCommodities.length === 0) {
        filteredCommodities = commoditySymbols.slice(0, 3);
      }
    }
    
    return filteredCommodities.map(commodity => {
      // Genera prezzo casuale tra 0.5 e 10
      const price = (Math.random() * 9.5 + 0.5).toFixed(2);
      // Genera variazione casuale tra -10% e +10%
      const change = (Math.random() * 20 - 10).toFixed(1);
      const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
      const variation = trend === 'up' ? `+${change}%` : `${change}%`;
      
      // Genera paese casuale
      const countries = ['Italia', 'Francia', 'Spagna', 'Stati Uniti', 'Brasile'];
      const randomCountry = countries[Math.floor(Math.random() * countries.length)];
      
      return {
        id: commodity.symbol,
        name: commodity.name,
        category: commodityToCategory[commodity.symbol] || 'Varie',
        price: parseFloat(price),
        unit: Math.random() > 0.3 ? 'EUR' : 'USD',
        trend: trend,
        variation: variation,
        origin: randomCountry,
        market: 'FAO GIEWS (demo)',
        date: new Date().toISOString().split('T')[0],
        quality: 'Standard',
        lastUpdated: new Date(),
        seasonality: determineSeasonsForCommodity(commodity.symbol, new Date())
      };
    });
  };

  // Funzione per filtrare i dati in base alla ricerca e alla categoria
  const filterData = () => {
    let result = [...productData];
    
    // Filtra per categoria
    if (selectedCategory !== 'Tutti') {
      result = result.filter(item => item.category === selectedCategory);
    }
    
    // Filtra per ricerca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.origin.toLowerCase().includes(query) ||
        item.market.toLowerCase().includes(query)
      );
    }
    
    setFilteredData(result);
  };

  // Carica i dati all'avvio e quando cambia la categoria
  useEffect(() => {
    fetchAllCommoditiesData();
  }, [selectedCategory]);

  // Filtra i dati quando cambiano ricerca o dati prodotti
  useEffect(() => {
    filterData();
  }, [searchQuery, productData]);

  // Funzione per tornare indietro
  const goBack = () => {
    router.back();
  };

  // Funzione per ottenere icona e colore in base al trend
  const getTrendInfo = (trend) => {
    switch(trend) {
      case 'up':
        return { icon: 'trending-up', color: '#10B981' };
      case 'down':
        return { icon: 'trending-down', color: '#EF4444' };
      default:
        return { icon: 'minus', color: '#F59E0B' };
    }
  };

  // Funzione per aggiornare i dati
  const refreshData = () => {
    fetchAllCommoditiesData();
  };

  // Formatta la data in formato italiano
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatta il tempo trascorso dall'ultimo aggiornamento
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return `${interval} ${interval === 1 ? 'anno' : 'anni'} fa`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return `${interval} ${interval === 1 ? 'mese' : 'mesi'} fa`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return `${interval} ${interval === 1 ? 'giorno' : 'giorni'} fa`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return `${interval} ${interval === 1 ? 'ora' : 'ore'} fa`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return `${interval} ${interval === 1 ? 'minuto' : 'minuti'} fa`;
    }
    
    return `${Math.floor(seconds)} secondi fa`;
  };

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
          <Text style={styles.headerTitle}>Prezzi Agricoli
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={refreshData}
          >
            <Feather name="refresh-cw" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Feather name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cerca prodotto, mercato o origine..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Category Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryTab,
                selectedCategory === category && styles.categoryTabActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Caricamento dati agricoli FAO GIEWS...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={refreshData}
            >
              <Text style={styles.retryText}>Riprova</Text>
            </TouchableOpacity>
          </View>
        ) : filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="database" size={80} color="#94A3B8" />
            <Text style={styles.emptyText}>Nessun prodotto trovato</Text>
            <Text style={styles.emptySubText}>Prova a cambiare i filtri di ricerca</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.productsContainer}
            contentContainerStyle={styles.productsContent}
          >
            <View style={styles.dataHeader}>
              <Text style={styles.dataTimestamp}>
                Aggiornato: {new Date().toLocaleDateString('it-IT', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              <View style={styles.dataCount}>
                <Text style={styles.dataCountText}>
                  {filteredData.length} prodotti
                </Text>
              </View>
            </View>

            {filteredData.map((item) => {
              const trendInfo = getTrendInfo(item.trend);
              
              return (
                <View key={item.id} style={styles.productCard}>
                  <LinearGradient
                    colors={['rgba(59, 130, 246, 0.1)', 'rgba(37, 99, 235, 0.05)']}
                    style={styles.productGradient}
                  >
                    <View style={styles.productHeader}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <View style={[styles.categoryBadge, getCategoryStyle(item.category)]}>
                        <Text style={styles.categoryBadgeText}>{item.category}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.productMiddle}>
                      <View style={styles.marketInfo}>
                        <Feather name="map-pin" size={14} color="#94A3B8" style={styles.marketIcon} />
                        <Text style={styles.marketText}>{item.market}</Text>
                      </View>
                      <View style={styles.seasonContainer}>
                        <Text style={[
                          styles.seasonText, 
                          item.seasonality === 'In stagione' ? styles.inSeason : styles.outSeason
                        ]}>
                          {item.seasonality}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.productDetails}>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Prezzo</Text>
                        <Text style={styles.priceValue}>{item.price.toFixed(2)} {item.unit}</Text>
                      </View>
                      
                      <View style={styles.trendContainer}>
                        <Text style={styles.trendLabel}>Andamento</Text>
                        <View style={styles.trendValue}>
                          <Feather 
                            name={trendInfo.icon} 
                            size={16} 
                            color={trendInfo.color} 
                            style={styles.trendIcon} 
                          />
                          <Text style={[styles.trendText, { color: trendInfo.color }]}>
                            {item.variation}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.originContainer}>
                        <Text style={styles.originLabel}>Origine</Text>
                        <Text style={styles.originValue}>{item.origin}</Text>
                      </View>
                    </View>

                    {/* Additional info */}
                    <View style={styles.additionalInfo}>
                      <View style={styles.qualityContainer}>
                        <Text style={styles.qualityLabel}>Qualità</Text>
                        <View style={[styles.qualityBadge, getQualityStyle(item.quality)]}>
                          <Text style={styles.qualityText}>{item.quality}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.updatedContainer}>
                        <Text style={styles.updatedLabel}>Aggiornamento</Text>
                        <Text style={styles.updatedValue}>{formatDate(item.date)}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

// Funzione per ottenere stili in base alla categoria
const getCategoryStyle = (category) => {
  switch(category) {
    case 'Frutta':
      return styles.categoryFrutta;
    case 'Verdura':
      return styles.categoryVerdura;
    case 'Cereali':
      return styles.categoryCereali;
    case 'Legumi':
      return styles.categoryLegumi;
    case 'Biologico':
      return styles.categoryBiologico;
    default:
      return styles.categoryDefault;
  }
};

// Funzione per ottenere stili in base alla qualità
const getQualityStyle = (quality) => {
  switch(quality) {
    case 'Premium':
      return styles.qualityPremium;
    case 'Biologico':
      return styles.qualityBiologico;
    case 'Standard':
    default:
      return styles.qualityStandard;
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111827",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 8,
  },
  categoriesContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  categoryTabActive: {
    backgroundColor: "#3B82F6",
  },
  categoryText: {
    color: "#E5E7EB",
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#E5E7EB",
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    color: "#F3F4F6",
    marginTop: 16,
    fontSize: 18,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    color: "#F3F4F6",
    marginTop: 16,
    fontSize: 20,
    fontWeight: "bold",
  },
  emptySubText: {
    color: "#94A3B8",
    marginTop: 8,
    fontSize: 16,
    textAlign: "center",
  },
  productsContainer: {
    flex: 1,
  },
  productsContent: {
    padding: 16,
  },
  dataHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dataTimestamp: {
    color: "#94A3B8",
    fontSize: 13,
  },
  dataCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
  },
  dataCountText: {
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "500",
  },
  productCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  productGradient: {
    padding: 16,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  productName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  categoryFrutta: {
    backgroundColor: "#F97316",
  },
  categoryVerdura: {
    backgroundColor: "#10B981",
  },
  categoryCereali: {
    backgroundColor: "#F59E0B",
  },
  categoryLegumi: {
    backgroundColor: "#8B5CF6",
  },
  categoryBiologico: {
    backgroundColor: "#06B6D4",
  },
  categoryDefault: {
    backgroundColor: "#6B7280",
  },
  productMiddle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  marketInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  marketIcon: {
    marginRight: 6,
  },
  marketText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  seasonContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  seasonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  inSeason: {
    color: "#10B981",
  },
  outSeason: {
    color: "#94A3B8",
  },
  productDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 12,
  },
  priceContainer: {
    alignItems: "center",
    flex: 1,
  },
  priceLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 4,
  },
  priceValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  trendContainer: {
    alignItems: "center",
    flex: 1,
  },
  trendLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 4,
  },
  trendValue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  trendIcon: {
    marginRight: 4,
  },
  trendText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  originContainer: {
    alignItems: "center",
    flex: 1,
  },
  originLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 4,
  },
  originValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  additionalInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qualityContainer: {
    flex: 1,
  },
  qualityLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 4,
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  qualityText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  qualityPremium: {
    backgroundColor: "#F59E0B",
  },
  qualityBiologico: {
    backgroundColor: "#10B981",
  },
  qualityStandard: {
    backgroundColor: "#6B7280",
  },
  updatedContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  updatedLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 4,
  },
  updatedValue: {
    color: "#E5E7EB",
    fontSize: 12,
  }
});

export default AgroMarketData;