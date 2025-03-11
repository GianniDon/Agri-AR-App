import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import SeasonalCalendar from './calendar';
import tractor from './tractor';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

// API key for Perenual - Replace with your actual API key
const PERENUAL_API_KEY = "YOUR_PERENUAL_API_KEY";

// Mappa dei nomi delle piante con singolari e plurali - Ampliata con più varianti
const nameMap = {
  // Singolari
  "pomodoro": "tomato",
  "carota": "carrot",
  "zucchina": "zucchini",
  "insalata": "lettuce",
  "lattuga": "lettuce",
  "spinacio": "spinach",
  "cipolla": "onion",
  "peperone": "pepper",
  "patata": "potato",
  "melanzana": "eggplant",
  "broccolo": "broccoli",
  "fagiolo": "bean",
  "cavolo": "cabbage",
  "sedano": "celery",
  "fragola": "strawberry",
  "carciofo": "artichoke",
  "pisello": "pea",
  "basilico": "basil",
  "prezzemolo": "parsley",
  "rosmarino": "rosemary",
  "cetriolo": "cucumber",
  "aglio": "garlic",
  "rucola": "arugula",
  "radicchio": "radicchio",
  "rapa": "turnip",
  "zucca": "pumpkin",
  "mais": "corn",
  "asparago": "asparagus",
  "finocchio": "fennel",
  "porro": "leek",

  // Plurali
  "pomodori": "tomato",
  "carote": "carrot",
  "zucchine": "zucchini",
  "insalate": "lettuce",
  "lattughe": "lettuce",
  "spinaci": "spinach",
  "cipolle": "onion",
  "peperoni": "pepper",
  "patate": "potato",
  "melanzane": "eggplant",
  "broccoli": "broccoli",
  "fagioli": "bean",
  "cavoli": "cabbage",
  "fragole": "strawberry",
  "carciofi": "artichoke",
  "piselli": "pea",
  "cetrioli": "cucumber",
  "asparagi": "asparagus",
  "finocchi": "fennel",
  "porri": "leek"
};

// Parole comuni da ignorare nell'analisi del testo
const commonWords = [
  "il", "lo", "la", "i", "gli", "le",
  "come", "cosa", "quali", "quando",
  "informazioni", "info", "dettagli",
  "sulla", "sulle", "sui", "sugli", "sul", "sullo",
  "per", "della", "delle", "dei", "degli", "del", "dello",
  "coltivare", "coltivazione", "crescere", "piantare",
  "voglio", "vorrei", "puoi", "potrei", "dammi",
  "sapere", "conoscere",
  "pianta", "piante",
  "mi", "dire", "parlare", "spiegare",
  "posso", "devo", "serve",
  "che", "chi", "dove", "perché"
];

// Funzione migliorata per estrarre il nome della pianta da una frase complessa
const extractPlantName = (text) => {
  // Normalizza il testo
  const normalizedText = text.toLowerCase().replace(/[?!.,]/g, '');
  
  // Controlli specifici per piante comuni nei quesiti
  if (normalizedText.includes('insalata')) return 'insalata';
  if (normalizedText.includes('lattuga')) return 'lattuga';
  if (normalizedText.includes('pomodor')) return 'pomodoro';
  if (normalizedText.includes('carot')) return 'carota';
  if (normalizedText.includes('zucchin')) return 'zucchina';
  
  // Suddividi in parole
  let words = normalizedText.split(' ').filter(word => word.length > 1);
  
  // Rimuovi le parole comuni
  words = words.filter(word => !commonWords.includes(word));

  // Cerca una corrispondenza diretta nella nameMap
  for (const word of words) {
    if (nameMap[word]) {
      return word;
    }
  }

  // Prova con le forme singolari
  for (const word of words) {
    const singular = getSingularForm(word);
    if (nameMap[singular]) {
      return singular;
    }
  }

  // Se non troviamo nulla di specifico, restituisci la prima parola non comune
  return words[0] || '';
};

// Funzione per ottenere la forma singolare
const getSingularForm = (word) => {
  const commonPluralEndings = {
    'i': 'o',    // pomodori -> pomodoro
    'e': 'a',    // patate -> patata
    'ni': 'ne',  // melanzane -> melanzana
    'hi': 'o',   // funghi -> fungo
    'chi': 'co'  // broccoli -> broccolo
  };

  for (const [plural, singular] of Object.entries(commonPluralEndings)) {
    if (word.endsWith(plural)) {
      return word.slice(0, -plural.length) + singular;
    }
  }

  return word;
};

// Funzione per tradurre il nome della pianta
const translatePlantName = (input) => {
  const plantName = extractPlantName(input);
  return nameMap[plantName] || plantName;
};

// Funzione per tenere traccia delle ricerche
const logSearch = (queryInput, extractedName, translatedName, apiResponse) => {
  console.log('--------- Search Log ---------');
  console.log('Query input:', queryInput);
  console.log('Extracted plant name:', extractedName);
  console.log('Translated to:', translatedName);
  console.log('API response status:', apiResponse ? 'Data found' : 'No data found');
  console.log('-----------------------------');
};

const Chatbot = () => {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const menuSlideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Animazione menu laterale
  useEffect(() => {
    if (menuOpen) {
      Animated.parallel([
        Animated.timing(menuSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(menuSlideAnim, {
          toValue: SCREEN_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [menuOpen]);

  const suggestions = [
    {
      icon: "leaf-outline",
      text: "Come si coltivano i pomodori?",
      color: "#10B981"
    },
    {
      icon: "information-circle-outline",
      text: "Informazioni sulla coltivazione delle carote",
      color: "#3B82F6"
    },
    {
      icon: "water-outline",
      text: "Come coltivare l'insalata?",
      color: "#8B5CF6"
    },
    {
      icon: "sunny-outline",
      text: "Consigli per la coltivazione delle zucchine",
      color: "#F59E0B"
    }
  ];

  const menuItems = [
    {
      icon: "calendar-outline",
      text: "Calendario Stagionale",
      action: () => {
        router.push("/calendar");
        setMenuOpen(false);
      }
    },
    {
      icon: "map-outline",
      text: "Zone Data",
      action: () => {
        router.push("/data");
        setMenuOpen(false);
      }
    },
    {
      icon: "car",
      text: "Tractor info",
      action: () => {
        router.push("/tractor");
        setMenuOpen(false);
      }
    },
    {
      icon: "basket-outline",
      text: "Mercati Locali",
      action: () => {
        router.push("/market");
        setMenuOpen(false);
      }
    },
    {
      icon: "bar-chart-outline",
      text:"Valore sul mercato",
      action: () => {
        router.push("/marketvalue");
        setMenuOpen(false);
    }
  }
  ];

  const goToCalendar = () => {
    router.push("/calendar");
  };
  
  const goBack = () => {
    router.push("/home");
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Funzione per formattare i dati delle piante dalla Perenual API
  const formatPlantData = (data) => {
    if (!data || !data.data) {
      return "Mi dispiace, non ho trovato informazioni per questa pianta.";
    }

    const plant = data.data;
    let response = `Nome: ${plant.common_name || 'Non disponibile'}\n`;
    
    if (plant.scientific_name && plant.scientific_name.length > 0) {
      response += `Nome Scientifico: ${plant.scientific_name[0]}\n`;
    }
    
    if (plant.description) {
      response += `\nDescrizione:\n${plant.description}\n`;
    }

    response += '\nRequisiti di coltivazione:\n';
    
    if (plant.sunlight && plant.sunlight.length > 0) {
      response += `- Esposizione: ${plant.sunlight.join(', ')}\n`;
    }
    
    if (plant.watering) {
      response += `- Irrigazione: ${plant.watering}\n`;
    }
    
    if (plant.hardiness && plant.hardiness.min && plant.hardiness.max) {
      response += `- Resistenza al clima: zone ${plant.hardiness.min} - ${plant.hardiness.max}\n`;
    }
    
    if (plant.maintenance) {
      response += `- Manutenzione: ${plant.maintenance}\n`;
    }

    if (plant.growth_rate) {
      response += `- Tasso di crescita: ${plant.growth_rate}\n`;
    }
    
    if (plant.dimensions) {
      if (plant.dimensions.type === "Height") {
        response += `- Altezza: ${plant.dimensions.min_value} - ${plant.dimensions.max_value} ${plant.dimensions.unit}\n`;
      }
    }
    
    // Aggiungiamo consigli di coltivazione generici se i dati sono scarsi
    if (!plant.sunlight && !plant.watering && !plant.maintenance) {
      response += "- Posiziona in un'area con buona esposizione solare\n";
      response += "- Mantieni il terreno leggermente umido, evitando ristagni\n";
      response += "- Controlla regolarmente per insetti dannosi\n";
    }
    
    // Stagione di piantagione se disponibile
    if (plant.planting_time) {
      response += `\nPeriodo di piantagione consigliato: ${plant.planting_time}\n`;
    }

    return response.trim();
  };

  // Funzione di fallback per estrarre informazioni utili quando la ricerca non produce risultati
  const getPlantFallbackInfo = (plantName) => {
    const englishName = nameMap[plantName] || plantName;
    
    // Mappa dei consigli generici per piante comuni
    const genericAdvice = {
      'tomato': {
        sunlight: 'Pieno sole (almeno 6-8 ore di sole diretto)',
        watering: 'Regolare, mantenendo il terreno uniformemente umido',
        soil: 'Terreno ricco, ben drenato con pH 6.0-6.8',
        season: 'Primavera-Estate',
        tips: 'Utilizzare supporti per le piante. Rimuovere i germogli laterali per varietà indeterminate.'
      },
      'carrot': {
        sunlight: 'Pieno sole a mezz\'ombra',
        watering: 'Regolare ma leggera, evitando eccessi',
        soil: 'Terreno sabbioso, profondo, senza pietre, pH 6.0-6.8',
        season: 'Primavera e tarda estate',
        tips: 'Diradare le piantine per evitare sovraffollamento. Terreno soffice per radici diritte.'
      },
      'lettuce': {
        sunlight: 'Mezz\'ombra, specialmente in estate',
        watering: 'Frequente e leggera, terreno sempre umido',
        soil: 'Terreno ricco, fresco, ben drenato',
        season: 'Primavera e autunno',
        tips: 'Seminare a intervalli regolari per raccolto continuo. Raccogliere presto per evitare gusto amaro.'
      },
      'zucchini': {
        sunlight: 'Pieno sole',
        watering: 'Regolare, alla base della pianta',
        soil: 'Terreno fertile, ben drenato',
        season: 'Tarda primavera-estate',
        tips: 'Lasciare spazio sufficiente (almeno 1m) tra le piante. Raccogliere frequentemente.'
      }
    };
    
    // Cerca consigli specifici o fornisci un messaggio generale
    if (genericAdvice[englishName]) {
      const advice = genericAdvice[englishName];
      return `Consigli generali per la coltivazione di ${plantName}:
      
- Esposizione: ${advice.sunlight}
- Irrigazione: ${advice.watering}
- Terreno: ${advice.soil}
- Stagione: ${advice.season}
- Suggerimenti: ${advice.tips}`;
    } else {
      return `Mi dispiace, non ho trovato informazioni specifiche su "${plantName}". 
      
Ecco alcuni consigli generali:
- Verifica la stagione di semina appropriata
- Assicurati che il terreno sia adeguatamente preparato
- Controlla il fabbisogno di acqua e luce
- Proteggi la pianta da parassiti e malattie

Puoi provare a chiedere di un'altra pianta o formulare la domanda in modo diverso.`;
    }
  };

  // Funzione migliorata per l'invio dei messaggi con connessione a Perenual API
  const handleSendMessage = async () => {
    if (message.trim()) {
      const userMessage = { text: message, type: 'user' };
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      setLoading(true);
      setShowWelcome(false);

      try {
        const plantName = extractPlantName(message);
        const searchTerm = nameMap[plantName] || plantName;
        
        if (!searchTerm) {
          throw new Error("Nessun nome di pianta riconosciuto");
        }
        
        // Chiamata all'API Perenual
        const apiUrl = `https://perenual.com/api/species-list?key=${PERENUAL_API_KEY}&q=${encodeURIComponent(searchTerm)}`;
        
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.data && data.data.length > 0) {
            // Ottieni i dettagli completi della prima pianta trovata
            const plantId = data.data[0].id;
            const detailsUrl = `https://perenual.com/api/species/details/${plantId}?key=${PERENUAL_API_KEY}`;
            
            const detailsResponse = await fetch(detailsUrl);
            
            if (detailsResponse.ok) {
              const detailsData = await detailsResponse.json();
              
              // Aggiungi i dettagli della cura per le piante
              const careUrl = `https://perenual.com/api/species/care-guide-list?key=${PERENUAL_API_KEY}&species_id=${plantId}`;
              let careData = null;
              
              try {
                const careResponse = await fetch(careUrl);
                if (careResponse.ok) {
                  careData = await careResponse.json();
                  // Combina i dati di dettaglio con quelli di cura
                  if (careData && careData.data && careData.data.length > 0) {
                    detailsData.care_guide = careData.data[0];
                  }
                }
              } catch (careError) {
                console.error("Error fetching care data:", careError);
              }
              
              // Crea una risposta formattata
              const formattedData = { data: detailsData };
              const botMessage = { 
                text: formatPlantData(formattedData), 
                type: 'bot' 
              };
              
              setMessages(prev => [...prev, botMessage]);
              logSearch(message, plantName, searchTerm, true);
            } else {
              throw new Error("Errore nel recupero dei dettagli della pianta");
            }
          } else {
            // Nessuna pianta trovata con questo termine
            logSearch(message, plantName, searchTerm, false);
            
            const fallbackMessage = { 
              text: getPlantFallbackInfo(plantName), 
              type: 'bot' 
            };
            
            setMessages(prev => [...prev, fallbackMessage]);
          }
        } else {
          throw new Error("Errore nella ricerca della pianta");
        }
      } catch (error) {
        console.error("Error:", error);
        
        // Risposta di fallback in caso di errore
        const plantName = extractPlantName(message);
        const fallbackMessage = { 
          text: getPlantFallbackInfo(plantName),
          type: 'bot' 
        };
        
        setMessages(prev => [...prev, fallbackMessage]);
      } finally {
        setLoading(false);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  };

  const handleSuggestionPress = (suggestionText) => {
    setMessage(suggestionText);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
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
          <Text style={styles.headerTitle}>Assistente Virtuale</Text>
          <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
            <MaterialCommunityIcons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Welcome Screen */}
        {showWelcome && !showCalendar && (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeHeader}>
              <Text style={styles.welcomeTitle}>Come posso aiutarti oggi?</Text>
              <Text style={styles.welcomeDescription}>
                Seleziona una domanda o scrivi la tua richiesta sull'agricoltura
              </Text>
            </View>
            <View style={styles.suggestionsContainer}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionCard}
                  onPress={() => handleSuggestionPress(suggestion.text)}
                >
                  <LinearGradient
                    colors={[suggestion.color, shadeColor(suggestion.color, -20)]}
                    style={styles.suggestionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View style={styles.suggestionIconContainer}>
                      <Ionicons name={suggestion.icon} size={24} color="white" />
                    </View>
                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
            <Image
              source={require("../assets/images/sustainable-agriculture.png")}
              style={styles.welcomeImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Calendar Section */}
        {showCalendar && (
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Calendario Stagionale</Text>
              <TouchableOpacity 
                style={styles.closeCalendarButton} 
                onPress={() => setShowCalendar(false)}
              >
                <Feather name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarContent}>
              <SeasonalCalendar />
            </View>
          </View>
        )}

        {/* Chat Container */}
        {!showCalendar && !showWelcome && (
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  msg.type === 'bot' ? styles.botBubble : styles.userBubble
                ]}
              >
                {msg.type === 'bot' && (
                  <View style={styles.botAvatar}>
                    <Ionicons name="leaf" size={16} color="white" />
                  </View>
                )}
                <View style={[
                  styles.messageContent,
                  msg.type === 'bot' ? styles.botContent : styles.userContent
                ]}>
                  <Text style={[
                    styles.messageText,
                    msg.type === 'bot' ? styles.botText : styles.userText
                  ]}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
            {loading && (
              <View style={styles.loadingContainer}>
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={styles.loadingGradient}
                >
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.loadingText}>Ricerca informazioni...</Text>
                </LinearGradient>
              </View>
            )}
          </ScrollView>
        )}

        {/* Overlay per chiudere il menu quando si clicca altrove */}
        {menuOpen && (
          <Animated.View 
            style={[
              styles.overlay,
              { opacity: overlayOpacity }
            ]}
            onTouchStart={closeMenu}
          />
        )}

        {/* Menu Laterale */}
        <Animated.View 
          style={[
            styles.sideMenu,
            { transform: [{ translateX: menuSlideAnim }] }
          ]}
        >
          <LinearGradient
            colors={['#111827', '#1E3A8A']}
            style={styles.menuGradient}
          >
            <View style={styles.menuHeader}>
              <Image
                source={require("../assets/images/augmented-reality.png")}
                style={styles.menuLogo}
                resizeMode="contain"
              />
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity 
                style={styles.closeMenuButton} 
                onPress={closeMenu}
              >
                <Feather name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.menuItems}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.action}
                >
                  <LinearGradient
                    colors={['rgba(59, 130, 246, 0.3)', 'rgba(37, 99, 235, 0.3)']}
                    style={styles.menuItemGradient}
                  >
                    <Ionicons name={item.icon} size={24} color="#FFFFFF" />
                    <Text style={styles.menuItemText}>{item.text}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={goBack}
            >
              <LinearGradient
                colors={['#EF4444', '#B91C1C']}
                style={styles.logoutGradient}
              >
                <Feather name="log-out" size={18} color="#FFFFFF" />
                <Text style={styles.logoutText}>Esci</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Input Container */}
        {!showCalendar && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Scrivi un messaggio..."
                placeholderTextColor="#94A3B8"
                multiline
                maxLength={500}
                value={message}
                onChangeText={setMessage}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !message.trim() && styles.sendButtonDisabled
                ]}
                onPress={handleSendMessage}
                disabled={!message.trim()}
              >
                <LinearGradient
                  colors={message.trim() ? ['#10B981', '#047857'] : ['#94A3B8', '#64748B']}
                  style={styles.sendButtonGradient}
                >
                  <Feather name="send" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

// Funzione per scurire un colore di una percentuale
const shadeColor = (color, percent) => {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  R = Math.max(0, R).toString(16);
  G = Math.max(0, G).toString(16);
  B = Math.max(0, B).toString(16);

  const RR = (R.length === 1) ? "0" + R : R;
  const GG = (G.length === 1) ? "0" + G : G;
  const BB = (B.length === 1) ? "0" + B : B;

  return "#" + RR + GG + BB;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111827",
  },
  container: {
    flex: 1,
  },
  // Header
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
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  menuButton: {
    padding: 8,
  },
  // Welcome Screen
  welcomeContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcomeHeader: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 16,
    color: "#94A3B8",
    lineHeight: 24,
  },
  suggestionsContainer: {
    marginBottom: 30,
  },
  suggestionCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  suggestionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  welcomeImage: {
    width: '100%',
    height: 200,
    alignSelf: 'center',
  },
  // Calendar
  calendarContainer: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeCalendarButton: {
    padding: 8,
  },
  calendarContent: {
    flex: 1,
    padding: 16,
  },
  // Chat
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  botBubble: {
    alignSelf: 'flex-start',
  },
  userBubble: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageContent: {
    borderRadius: 16,
    padding: 12,
    flexShrink: 1,
  },
  botContent: {
    backgroundColor: '#1F2937',
  },
  userContent: {
    backgroundColor: '#3B82F6',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    flexWrap: "wrap"
  },
  botText: {
    color: '#FFFFFF',
  },
  userText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  loadingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
  },
  // Side Menu
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 280,
    height: '100%',
    zIndex: 2,
  },
  menuGradient: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  menuLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  closeMenuButton: {
    padding: 8,
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    marginBottom: 12,
  },
  menuItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 24,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    marginLeft: 12,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
export default Chatbot;