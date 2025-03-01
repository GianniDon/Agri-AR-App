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

// Termini alternativi per piante che potrebbero avere nomi diversi in API
const alternativeTerms = {
  "lettuce": ["salad", "green leaf", "lettuce"],
  "tomato": ["tomato", "tomatoes"],
  "carrot": ["carrot", "carrots"],
  "zucchini": ["zucchini", "courgette", "summer squash"],
  // Aggiungi altre piante problematiche qui
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

  // Funzione migliorata per formattare i dati delle piante
  const formatPlantData = (data) => {
    if (!data || !data.data || data.data.length === 0) {
      return "Mi dispiace, non ho trovato informazioni per questa pianta.";
    }

    const plant = data.data[0].attributes;
    let response = `Nome: ${plant.name || 'Non disponibile'}\n`;
    
    if (plant.binomial_name) {
      response += `Nome Scientifico: ${plant.binomial_name}\n`;
    }
    
    if (plant.description) {
      response += `\nDescrizione:\n${plant.description}\n`;
    }

    response += '\nRequisiti di coltivazione:\n';
    if (plant.sun_requirements) {
      response += `- Esposizione: ${plant.sun_requirements}\n`;
    }
    if (plant.sowing_method) {
      response += `- Metodo di semina: ${plant.sowing_method}\n`;
    }
    if (plant.height) {
      response += `- Altezza: ${plant.height} cm\n`;
    }
    if (plant.row_spacing) {
      response += `- Spaziatura: ${plant.row_spacing} cm\n`;
    }
    if (plant.growing_degree_days) {
      response += `- Periodo di crescita: ${plant.growing_degree_days} giorni\n`;
    }
    
    // Aggiungiamo consigli di coltivazione generici se i dati sono scarsi
    if (!plant.sowing_method && !plant.height && !plant.row_spacing && !plant.growing_degree_days) {
      response += "- Posiziona in un'area con buona esposizione solare\n";
      response += "- Mantieni il terreno leggermente umido, evitando ristagni\n";
      response += "- Controlla regolarmente per insetti dannosi\n";
    }

    return response.trim();
  };

  // Funzione migliorata per l'invio dei messaggi con gestione errori e tentativi alternativi
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
        
        // Teniamo traccia di tutti i tentativi di ricerca
        let allResponses = [];
        let foundData = null;
        
        // Prima cerca con il termine principale
        const apiUrl = `https://openfarm.cc/api/v1/crops?filter=${encodeURIComponent(searchTerm)}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          allResponses.push(data);
          
          if (data && data.data && data.data.length > 0) {
            foundData = data;
            logSearch(message, plantName, searchTerm, true);
          }
        }

        // Se non abbiamo trovato nulla, prova con termini alternativi
        if (!foundData && alternativeTerms[searchTerm]) {
          for (const altTerm of alternativeTerms[searchTerm]) {
            const altApiUrl = `https://openfarm.cc/api/v1/crops?filter=${encodeURIComponent(altTerm)}`;
            
            try {
              const altResponse = await fetch(altApiUrl, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                },
              });
              
              if (altResponse.ok) {
                const altData = await altResponse.json();
                allResponses.push(altData);
                
                if (altData && altData.data && altData.data.length > 0) {
                  foundData = altData;
                  logSearch(message, plantName, altTerm, true);
                  break; // Abbiamo trovato dati, usciamo dal ciclo
                }
              }
            } catch (altError) {
              console.error("Alternative search error:", altError);
            }
          }
        }

        // Se ancora non abbiamo dati, ricorriamo a una ricerca generica
        if (!foundData && searchTerm === 'lettuce') {
          try {
            const genericUrl = `https://openfarm.cc/api/v1/crops?filter=salad`;
            const genericResponse = await fetch(genericUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
            });
            
            if (genericResponse.ok) {
              const genericData = await genericResponse.json();
              if (genericData && genericData.data && genericData.data.length > 0) {
                foundData = genericData;
                logSearch(message, plantName, "salad (generic fallback)", true);
              }
            }
          } catch (genericError) {
            console.error("Generic search error:", genericError);
          }
        }

        // Gestione risposta finale
        if (foundData) {
          const botMessage = { 
            text: formatPlantData(foundData), 
            type: 'bot' 
          };
          setMessages(prev => [...prev, botMessage]);
        } else {
          logSearch(message, plantName, searchTerm, false);
          
          // Risposta di fallback con indicazioni
          const notFoundMessage = { 
            text: `Mi dispiace, non ho trovato informazioni specifiche su "${plantName}". 
            
Ecco alcuni consigli generali:
- Verifica la stagione di semina appropriata
- Assicurati che il terreno sia adeguatamente preparato
- Controlla il fabbisogno di acqua e luce
- Proteggi la pianta da parassiti e malattie

Puoi provare a chiedere di un'altra pianta o formulare la domanda in modo diverso.`, 
            type: 'bot' 
          };
          setMessages(prev => [...prev, notFoundMessage]);
        }

      } catch (error) {
        console.error("Error:", error);
        
        const errorMessage = { 
          text: "Mi dispiace, si è verificato un errore durante la ricerca. Verifica la tua connessione e riprova tra qualche momento.", 
          type: 'bot' 
        };
        setMessages(prev => [...prev, errorMessage]);
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
  menuButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  // Welcome Screen
  welcomeContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  welcomeHeader: {
    alignItems: "center",
    marginVertical: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  welcomeDescription: {
    fontSize: 16,
    color: "#E5E7EB",
    textAlign: "center",
    lineHeight: 24,
  },
  suggestionsContainer: {
    width: "100%",
    marginBottom: 20,
  },
  suggestionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  suggestionGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  suggestionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  suggestionText: {
    flex: 1,
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  welcomeImage: {
    width: "100%",
    height: 120,
    marginTop: 20,
  },
  // Chat Container
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 30,
  },
  messageBubble: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "85%",
  },
  botBubble: {
    alignSelf: "flex-start",
  },
  userBubble: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  messageContent: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: "90%",
  },
  botContent: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderBottomLeftRadius: 4,
  },
  userContent: {
    backgroundColor: "#3B82F6",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botText: {
    color: "#E5E7EB",
  },
  userText: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    alignSelf: "flex-start",
    marginBottom: 16,
    maxWidth: "70%",
    borderRadius: 16,
    overflow: "hidden",
  },
  loadingGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontSize: 14,
  },
  // Calendar
  calendarContainer: {
    flex: 1,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  closeCalendarButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  calendarContent: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
  },
  // Side Menu
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
  },
  sideMenu: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.75,
    zIndex: 2,
  },
  menuGradient: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  menuLogo: {
    width: 40,
    height: 40,
    marginRight: 16,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
  },
  closeMenuButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  menuItemGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  menuItemText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 16,
  },
  logoutButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 20,
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
  // Input Container
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(17, 24, 39, 0.8)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    marginLeft: 12,
    borderRadius: 24,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  }
});

export default Chatbot;