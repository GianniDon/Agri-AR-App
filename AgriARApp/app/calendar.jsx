import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Animated, Dimensions, SafeAreaView, StatusBar, Image } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SeasonalCalendar = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [animation] = useState(new Animated.Value(0));
  const [showInfo, setShowInfo] = useState(false);
  
  useEffect(() => {
    // Animazione al cambio di mese
    Animated.timing(animation, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    
    return () => {
      animation.setValue(0);
    };
  }, [selectedMonth]);
  
  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  // Database dei prodotti stagionali per mese
  const seasonalDatabase = {
    // Inverno
    0: { // Gennaio
      vegetables: ['Broccoli', 'Cavolfiori', 'Cavoli', 'Cardi', 'Carciofi', 'Finocchi', 'Rape', 'Spinaci', 'Cicoria', 'Catalogna', 'Radicchio'],
      fruits: ['Arance', 'Mandarini', 'Clementine', 'Limoni', 'Kiwi', 'Pere', 'Mele']
    },
    1: { // Febbraio
      vegetables: ['Broccoli', 'Cavolfiori', 'Carciofi', 'Finocchi', 'Radicchio', 'Spinaci', 'Catalogna', 'Cicoria', 'Indivia'],
      fruits: ['Arance', 'Mandarini', 'Kiwi', 'Limoni', 'Pere', 'Mele']
    },
    // Primavera
    2: { // Marzo
      vegetables: ['Asparagi', 'Carciofi', 'Cipollotti', 'Fave', 'Spinaci', 'Agretti', 'Broccoli', 'Ravanelli'],
      fruits: ['Arance', 'Limoni', 'Kiwi', 'Mele', 'Pere', 'Fragole']
    },
    3: { // Aprile
      vegetables: ['Asparagi', 'Fave', 'Piselli', 'Carciofi', 'Ravanelli', 'Agretti', 'Rucola', 'Lattuga', 'Cipollotti'],
      fruits: ['Fragole', 'Limoni', 'Kiwi', 'Mele']
    },
    4: { // Maggio
      vegetables: ['Asparagi', 'Fave', 'Piselli', 'Carciofi', 'Zucchine', 'Fagiolini', 'Rucola', 'Lattuga', 'Ravanelli', 'Cetrioli'],
      fruits: ['Fragole', 'Ciliegie', 'Albicocche', 'Nespole', 'Kiwi']
    },
    // Estate
    5: { // Giugno
      vegetables: ['Zucchine', 'Melanzane', 'Peperoni', 'Pomodori', 'Fagiolini', 'Cetrioli', 'Lattuga', 'Rucola', 'Basilico', 'Cipollotti'],
      fruits: ['Fragole', 'Ciliegie', 'Albicocche', 'Pesche', 'Nettarine', 'Melone', 'Anguria', 'Susine']
    },
    6: { // Luglio
      vegetables: ['Zucchine', 'Melanzane', 'Peperoni', 'Pomodori', 'Fagiolini', 'Cetrioli', 'Lattuga', 'Rucola', 'Basilico', 'Mais'],
      fruits: ['Albicocche', 'Pesche', 'Nettarine', 'Melone', 'Anguria', 'Susine', 'Fichi', 'More', 'Mirtilli']
    },
    7: { // Agosto
      vegetables: ['Zucchine', 'Melanzane', 'Peperoni', 'Pomodori', 'Fagiolini', 'Cetrioli', 'Mais', 'Basilico'],
      fruits: ['Pesche', 'Nettarine', 'Melone', 'Anguria', 'Susine', 'Fichi', 'More', 'Mirtilli', 'Lamponi', 'Uva']
    },
    // Autunno
    8: { // Settembre
      vegetables: ['Zucchine', 'Melanzane', 'Peperoni', 'Pomodori', 'Fagiolini', 'Lattuga', 'Rucola', 'Spinaci', 'Cavoli'],
      fruits: ['Uva', 'Fichi', 'Pere', 'Mele', 'Susine', 'More', 'Melograno']
    },
    9: { // Ottobre
      vegetables: ['Spinaci', 'Broccoli', 'Cavolfiori', 'Cavoli', 'Zucca', 'Funghi', 'Carciofi', 'Finocchi', 'Radicchio'],
      fruits: ['Uva', 'Cachi', 'Melograno', 'Mele', 'Pere', 'Noci', 'Castagne', 'Kiwi']
    },
    10: { // Novembre
      vegetables: ['Spinaci', 'Broccoli', 'Cavolfiori', 'Cavoli', 'Zucca', 'Funghi', 'Carciofi', 'Finocchi', 'Radicchio'],
      fruits: ['Arance', 'Mandarini', 'Cachi', 'Melograno', 'Mele', 'Pere', 'Kiwi', 'Noci', 'Castagne']
    },
    // Inverno
    11: { // Dicembre
      vegetables: ['Broccoli', 'Cavolfiori', 'Cavoli', 'Cardi', 'Carciofi', 'Finocchi', 'Rape', 'Spinaci', 'Zucca'],
      fruits: ['Arance', 'Mandarini', 'Clementine', 'Limoni', 'Kiwi', 'Pere', 'Mele', 'Melograno']
    }
  };

  // Funzione che determina il colore di sfondo in base alla stagione
  const getSeasonColor = (month) => {
    if (month >= 0 && month <= 1) return { 
      primary: '#3B82F6',
      secondary: '#1D4ED8',
      light: '#DBEAFE',
      text: '#1E40AF'
    }; // Inverno
    if (month >= 2 && month <= 4) return { 
      primary: '#10B981',
      secondary: '#047857',
      light: '#D1FAE5',
      text: '#065F46'
    }; // Primavera
    if (month >= 5 && month <= 7) return { 
      primary: '#F59E0B',
      secondary: '#D97706',
      light: '#FEF3C7',
      text: '#92400E'
    }; // Estate
    return { 
      primary: '#EF4444',
      secondary: '#B91C1C',
      light: '#FEE2E2',
      text: '#991B1B'
    }; // Autunno
  };

  // Restituisce l'icona appropriata per la stagione
  const getSeasonIcon = (month) => {
    if (month >= 0 && month <= 1) return "snow-outline"; // Inverno
    if (month >= 2 && month <= 4) return "flower-outline"; // Primavera
    if (month >= 5 && month <= 7) return "sunny-outline"; // Estate
    return "leaf-outline"; // Autunno
  };

  // Restituisce il nome della stagione
  const getSeasonName = (month) => {
    if (month >= 0 && month <= 1) return "Inverno";
    if (month >= 2 && month <= 4) return "Primavera";
    if (month >= 5 && month <= 7) return "Estate";
    return "Autunno";
  };

  const seasonColors = getSeasonColor(selectedMonth);

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0]
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={seasonColors.secondary} />
      
      <LinearGradient
        colors={[seasonColors.secondary, seasonColors.primary]}
        style={styles.container}
      >
        {/* Header con logo e info */}
        <View style={styles.header}>
          <Image
            source={require("../assets/images/augmented-reality.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Calendario Stagionale</Text>
            <View style={styles.seasonBadge}>
              <Ionicons name={getSeasonIcon(selectedMonth)} size={16} color="#FFFFFF" />
              <Text style={styles.seasonBadgeText}>{getSeasonName(selectedMonth)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.infoButton} onPress={() => setShowInfo(!showInfo)}>
            <Ionicons name="information-circle" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      
        {/* Selettore dei mesi con stile moderno */}
        <View style={styles.monthSelectorWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.monthSelector}
            contentContainerStyle={styles.monthSelectorContent}
            snapToInterval={width / 4}
            decelerationRate="fast"
          >
            {months.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthButton,
                  selectedMonth === index && styles.selectedMonthButton,
                  { borderColor: selectedMonth === index ? seasonColors.primary : '#E0E0E0' }
                ]}
                onPress={() => setSelectedMonth(index)}
              >
                <Text 
                  style={[
                    styles.monthText,
                    selectedMonth === index && styles.selectedMonthText,
                    { color: selectedMonth === index ? seasonColors.primary : '#757575' }
                  ]}
                >
                  {month}
                </Text>
                {selectedMonth === index && (
                  <View 
                    style={[
                      styles.monthIndicator, 
                      { backgroundColor: seasonColors.primary }
                    ]} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Contenuto principale con animazione fade in/slide up */}
        <Animated.ScrollView 
          style={[
            styles.contentContainer,
            { opacity, transform: [{ translateY }] }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header informativo */}
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>
              Prodotti di stagione: <Text style={{ color: seasonColors.primary }}>{months[selectedMonth]}</Text>
            </Text>
            <Text style={styles.infoSubtitle}>
              Mangiare prodotti di stagione garantisce più sapore e sostenibilità
            </Text>
          </View>
          
          {/* Sezione verdura */}
          <View style={styles.section}>
            <LinearGradient
              colors={['#FFFFFF', seasonColors.light]}
              style={styles.sectionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="leaf-outline" size={18} color="#FFFFFF" />
                </View>
                <Text style={[styles.sectionTitle, { color: '#10B981' }]}>Verdura di Stagione</Text>
              </View>
              
              <View style={styles.productGrid}>
                {seasonalDatabase[selectedMonth].vegetables.map((vegetable, index) => (
                  <View key={index} style={styles.productItem}>
                    <LinearGradient
                      colors={['#FFFFFF', '#F9FAFB']}
                      style={styles.productGradient}
                    >
                      <Text style={styles.productName}>{vegetable}</Text>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Sezione frutta */}
          <View style={styles.section}>
            <LinearGradient
              colors={['#FFFFFF', seasonColors.light]}
              style={styles.sectionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.sectionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#F59E0B' }]}>
                  <Ionicons name="nutrition-outline" size={18} color="#FFFFFF" />
                </View>
                <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>Frutta di Stagione</Text>
              </View>
              
              <View style={styles.productGrid}>
                {seasonalDatabase[selectedMonth].fruits.map((fruit, index) => (
                  <View key={index} style={styles.productItem}>
                    <LinearGradient
                      colors={['#FFFFFF', '#F9FAFB']}
                      style={styles.productGradient}
                    >
                      <Text style={styles.productName}>{fruit}</Text>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Consigli di stagione */}
          <View style={styles.tipsSection}>
            <LinearGradient
              colors={[seasonColors.primary, seasonColors.secondary]}
              style={styles.tipCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.tipIconContainer}>
                <Ionicons name="lightbulb-outline" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Consigli per {months[selectedMonth]}</Text>
                <Text style={styles.tipText}>
                  Acquistare prodotti di stagione supporta l'economia locale, riduce l'impatto ambientale e garantisce alimenti più ricchi di nutrienti.
                </Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.ScrollView>
      </LinearGradient>

      {/* Modal informativo */}
      {showInfo && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="food-apple-outline" size={60} color={seasonColors.primary} />
              <Text style={[styles.modalTitle, { color: seasonColors.text }]}>Prodotti Stagionali</Text>
            </View>
            
            <Text style={styles.modalText}>
              Mangiare cibi di stagione significa consumare frutta e verdura nel loro periodo naturale di crescita e raccolta.
            </Text>
            
            <Text style={styles.modalText}>
              I prodotti stagionali sono più freschi, gustosi e nutrienti. Inoltre, la loro produzione richiede meno risorse e causa minore impatto ambientale.
            </Text>
            
            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: seasonColors.primary }]}
              onPress={() => setShowInfo(false)}
            >
              <Text style={styles.closeButtonText}>Chiudi</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  container: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logo: {
    width: 40,
    height: 40,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  infoButton: {
    padding: 8,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  seasonBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  monthSelectorWrapper: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    padding: 8,
    marginBottom: 20,
  },
  monthSelector: {
    flexDirection: 'row',
  },
  monthSelectorContent: {
    paddingHorizontal: 8,
  },
  monthButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: width / 4 - 16,
    alignItems: 'center',
    position: 'relative',
  },
  selectedMonthButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthText: {
    fontSize: 15,
    fontWeight: '500',
  },
  selectedMonthText: {
    fontWeight: '700',
  },
  monthIndicator: {
    position: 'absolute',
    bottom: -1,
    height: 3,
    width: '60%',
    borderRadius: 3,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  infoHeader: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 15,
    color: '#E5E7EB',
    lineHeight: 22,
  },
  section: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionGradient: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  productItem: {
    width: '33.3%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  productGradient: {
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
    paddingVertical: 10,
    paddingHorizontal: 8,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  tipsSection: {
    marginBottom: 30,
  },
  tipCardGradient: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  tipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  tipText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 15,
  },
  closeModalButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SeasonalCalendar;