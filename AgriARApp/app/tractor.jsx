import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

const TractorInfo = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('tractors');
  const [loading, setLoading] = useState(false);
  
  const goBack = () => {
    router.push("/chatbot");
  };

  // Expanded data for agricultural machinery
  const machineryData = {
    tractors: [
      {
        id: 1,
        name: "Trattore Compatto Serie 2R",
        image: "/api/placeholder/300/200",
        power: "26-38 CV",
        type: "Compatto",
        features: [
          "Ideale per piccole aziende agricole",
          "Facile manovrabilità in spazi ristretti",
          "Basso consumo di carburante",
          "Compatibile con vari accessori"
        ],
        description: "Questi trattori compatti sono perfetti per lavori leggeri in aziende agricole di piccole dimensioni o per la manutenzione di aree verdi. Sono caratterizzati da un'ottima manovrabilità e da un basso impatto ambientale."
      },
      {
        id: 2,
        name: "Trattore Serie 5G",
        image: "/api/placeholder/300/200",
        power: "75-120 CV",
        type: "Utility",
        features: [
          "Versatile per molteplici applicazioni",
          "Cabina confortevole con visibilità a 360°",
          "Sistema idraulico avanzato",
          "Trasmissione efficiente"
        ],
        description: "I trattori della serie 5G sono macchine versatili adatte a un'ampia gamma di attività agricole. Offrono un ottimo equilibrio tra potenza, manovrabilità e comfort per l'operatore, rendendoli ideali per aziende agricole di medie dimensioni."
      },
      {
        id: 3,
        name: "Trattore Serie 8R",
        image: "/api/placeholder/300/200",
        power: "245-410 CV",
        type: "Alta potenza",
        features: [
          "Elevata potenza per lavori impegnativi",
          "Tecnologia di precisione integrata",
          "Cabina premium con sospensione attiva",
          "Sistemi di gestione intelligente del motore"
        ],
        description: "Questi trattori di alta potenza sono progettati per le operazioni agricole più impegnative. Dotati delle ultime tecnologie di automazione e precisione, offrono prestazioni eccezionali per grandi aziende agricole e contoterzisti."
      },
      {
        id: 4,
        name: "Trattore Serie 3E",
        image: "/api/placeholder/300/200",
        power: "40-55 CV",
        type: "Compatto",
        features: [
          "Telaio robusto e duraturo",
          "Trasmissione idrostatica",
          "Sollevatore idraulico posteriore",
          "Ideale per frutticoltura e viticoltura"
        ],
        description: "La Serie 3E offre un'ottima soluzione per piccole aziende agricole che necessitano di un trattore compatto ma potente. Particolarmente adatto per lavori in frutteti, vigneti e per la manutenzione generale della proprietà."
      },
      {
        id: 5,
        name: "Trattore Serie 6M",
        image: "/api/placeholder/300/200",
        power: "130-180 CV",
        type: "Utility Avanzato",
        features: [
          "Design moderno ed ergonomico",
          "Sistema di gestione delle svolte automatico",
          "Compatibile con agricoltura di precisione",
          "Cabina sospesa per comfort ottimale"
        ],
        description: "I trattori della Serie 6M rappresentano il perfetto equilibrio tra potenza, versatilità e tecnologia. Offrono prestazioni eccellenti sia nei lavori in campo aperto che nelle operazioni di trasporto, con un occhio di riguardo al comfort dell'operatore."
      },
      {
        id: 6,
        name: "Trattore Cingolato Serie 9RT",
        image: "/api/placeholder/300/200",
        power: "420-570 CV",
        type: "Alta potenza cingolato",
        features: [
          "Cingoli in gomma per minima compattazione del terreno",
          "Motore a basse emissioni Stage V",
          "Trasmissione a variazione continua",
          "Capacità di sollevamento fino a 12.000 kg"
        ],
        description: "Il trattore cingolato Serie 9RT è progettato per offrire la massima trazione con minima compattazione del terreno. La sua potenza superiore e stabilità lo rendono ideale per operazioni di aratura profonda e preparazione del terreno in condizioni difficili."
      },
      {
        id: 7,
        name: "Trattore Serie 4M",
        image: "/api/placeholder/300/200",
        power: "60-90 CV",
        type: "Utility Compatto",
        features: [
          "Rapporto potenza-peso ottimizzato",
          "Trasmissione PowerShift a 16 velocità",
          "Sistema idraulico a centro aperto",
          "Caricatore frontale disponibile"
        ],
        description: "La Serie 4M combina le dimensioni compatte con prestazioni da utility, offrendo una soluzione versatile per aziende agricole di medie dimensioni. Eccellente per operazioni con caricatore frontale e attività generali nell'azienda agricola."
      }
    ],
    harvesters: [
      {
        id: 1,
        name: "Mietitrebbia Serie S",
        image: "/api/placeholder/300/200",
        capacity: "Grande capacità",
        crops: "Cereali, mais, soia",
        features: [
          "Sistema di separazione rotativo",
          "Ampia testata fino a 12m",
          "Tecnologia di mappatura avanzata",
          "Capacità del serbatoio fino a 14.000 litri"
        ],
        description: "Mietitrebbie di ultima generazione per la raccolta efficiente di grandi appezzamenti. Il design avanzato minimizza le perdite di raccolto e massimizza la produttività grazie ai sistemi automatizzati di regolazione."
      },
      {
        id: 2,
        name: "Vendemmiatrice Serie V",
        image: "/api/placeholder/300/200",
        capacity: "Media capacità",
        crops: "Uva",
        features: [
          "Sistema di raccolta delicato",
          "Selezione acini integrata",
          "Adatta a vigneti a filare",
          "Controllo preciso dell'altezza"
        ],
        description: "Vendemmiatrici progettate specificamente per la raccolta meccanica dell'uva, garantendo qualità e efficienza. Ideali per vigneti di medie e grandi dimensioni."
      },
      {
        id: 3,
        name: "Mietitrebbia Compatta Serie T",
        image: "/api/placeholder/300/200",
        capacity: "Media capacità",
        crops: "Cereali, riso",
        features: [
          "Design compatto per terreni collinari",
          "Sistema di separazione convenzionale",
          "Testata da 4-6m",
          "Ottimizzata per piccoli e medi appezzamenti"
        ],
        description: "Mietitrebbia versatile e compatta, ideale per aziende agricole di medie dimensioni o con terreni collinari. Combina efficienza di raccolta con facilità di trasporto e manovrabilità."
      },
      {
        id: 4,
        name: "Raccoglitrice di Olive Serie O",
        image: "/api/placeholder/300/200",
        capacity: "Media capacità",
        crops: "Olive",
        features: [
          "Sistema di scuotimento delicato",
          "Raccolta continua con ombrello invertito",
          "Compattazione minima del terreno",
          "Pulizia preliminare integrata"
        ],
        description: "Macchina specializzata per la raccolta meccanizzata delle olive, progettata per massimizzare l'efficienza e minimizzare i danni alle piante. Adatta sia per impianti tradizionali che intensivi."
      },
      {
        id: 5,
        name: "Mietitrebbia Rotativa Serie X",
        image: "/api/placeholder/300/200",
        capacity: "Alta capacità",
        crops: "Cereali, mais, soia, legumi",
        features: [
          "Doppio rotore di separazione",
          "Sistema di pulizia automatico",
          "Capacità serbatoio 16.000 litri",
          "Tecnologia di precisione integrata"
        ],
        description: "Mietitrebbia di fascia premium con tecnologia a doppio rotore per massimizzare la capacità di raccolta anche in condizioni difficili. Dotata di sistemi avanzati di automazione e monitoraggio della qualità del raccolto."
      }
    ],
    seeders: [
      {
        id: 1,
        name: "Seminatrice di Precisione",
        image: "/api/placeholder/300/200",
        width: "3-12m",
        type: "Pneumatica",
        features: [
          "Dosaggio elettronico dei semi",
          "Controllo sezione per sezione",
          "Compatibile con sistemi GPS",
          "Regolazione automatica profondità"
        ],
        description: "Seminatrici di precisione per garantire la spaziatura ottimale tra i semi e la profondità di semina ideale. La tecnologia integrata permette di ottimizzare l'uso del seme e migliorare la resa del raccolto."
      },
      {
        id: 2,
        name: "Seminatrice a Spaglio",
        image: "/api/placeholder/300/200",
        width: "2-8m",
        type: "Meccanica",
        features: [
          "Ideale per prati e cereali",
          "Distribuzione uniforme",
          "Facile regolazione della densità",
          "Robusta e affidabile"
        ],
        description: "Seminatrici semplici ed economiche per la semina a spaglio di colture come cereali e prati. Perfette per piccole e medie aziende agricole grazie alla loro facilità d'uso e manutenzione."
      },
      {
        id: 3,
        name: "Seminatrice Combinata",
        image: "/api/placeholder/300/200",
        width: "3-6m",
        type: "Combinata",
        features: [
          "Preparazione terreno e semina in un unico passaggio",
          "Riduzione dei costi operativi",
          "Minore compattazione del suolo",
          "Dosatore elettronico con controllo di flusso"
        ],
        description: "Sistema combinato che integra la preparazione del letto di semina e la semina in un unico passaggio. Ottimizzata per ridurre i costi operativi e minimizzare l'impatto sul terreno, preservando l'umidità del suolo."
      },
      {
        id: 4,
        name: "Seminatrice per Semina su Sodo",
        image: "/api/placeholder/300/200",
        width: "4-9m",
        type: "Disco singolo",
        features: [
          "Minimo disturbo del terreno",
          "Dischi ad alta penetrazione",
          "Controllo preciso della profondità",
          "Sistema di pressione regolabile"
        ],
        description: "Seminatrice specializzata per la semina diretta su terreno non lavorato, ideale per sistemi di agricoltura conservativa. Progettata per operare efficacemente anche in presenza di residui colturali abbondanti."
      },
      {
        id: 5,
        name: "Seminatrice Pneumatica per Cereali",
        image: "/api/placeholder/300/200",
        width: "4-8m",
        type: "Pneumatica",
        features: [
          "Alta velocità di semina",
          "Distribuzione uniforme anche ad alta velocità",
          "Sistema di monitoraggio elettronico",
          "Tramoggia di grande capacità"
        ],
        description: "Seminatrice ad alta capacità progettata per cereali e colture simili. Il sistema pneumatico garantisce precisione anche a velocità operative elevate, aumentando l'efficienza del lavoro nei periodi critici di semina."
      },
      {
        id: 6,
        name: "Seminatrice di Precisione per Colture a File",
        image: "/api/placeholder/300/200",
        width: "3-12m",
        type: "Precisione",
        features: [
          "Ottimizzata per mais, girasole, barbabietola",
          "Distanza variabile tra le file",
          "Sistema anti-rimbalzo del seme",
          "Sensori di monitoraggio per ogni elemento"
        ],
        description: "Seminatrice di alta precisione per colture industriali che richiedono spaziatura esatta. Dotata di tecnologia avanzata per il monitoraggio in tempo reale della qualità di semina e sistemi di correzione automatica."
      }
    ]
  };

  const categories = [
    { id: 'tractors', name: 'Trattori', icon: 'tractor' },
    { id: 'harvesters', name: 'Mietitrebbie', icon: 'leaf' },
    { id: 'seeders', name: 'Seminatrici', icon: 'seed' },
  ];

  const handleCategoryChange = (categoryId) => {
    setLoading(true);
    setSelectedCategory(categoryId);
    
    // Simulazione caricamento dati
    setTimeout(() => {
      setLoading(false);
    }, 500);
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
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons name="tractor" size={24} color="#10B981" />
            <Text style={styles.headerTitle}>Macchinari Agricoli</Text>
          </View>
          <View style={{width: 40}} />
        </View>

        {/* Category Selector */}
        <View style={styles.categoryContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive
                ]}
                onPress={() => handleCategoryChange(category.id)}
              >
                <MaterialCommunityIcons 
                  name={category.icon} 
                  size={20} 
                  color={selectedCategory === category.id ? "#FFFFFF" : "#10B981"} 
                />
                <Text 
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextActive
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : (
          <ScrollView style={styles.contentContainer}>
            {machineryData[selectedCategory].map((item) => (
              <View key={item.id} style={styles.machineCard}>
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.1)', 'rgba(59, 130, 246, 0.1)']}
                  style={styles.cardGradient}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.machineImage}
                    resizeMode="cover"
                  />
                  <View style={styles.machineInfo}>
                    <Text style={styles.machineName}>{item.name}</Text>
                    
                    <View style={styles.specsContainer}>
                      {item.power && (
                        <View style={styles.specChip}>
                          <Ionicons name="speedometer-outline" size={16} color="#10B981" />
                          <Text style={styles.specText}>{item.power}</Text>
                        </View>
                      )}
                      
                      {item.type && (
                        <View style={styles.specChip}>
                          <Ionicons name="build-outline" size={16} color="#10B981" />
                          <Text style={styles.specText}>{item.type}</Text>
                        </View>
                      )}
                      
                      {item.capacity && (
                        <View style={styles.specChip}>
                          <Ionicons name="cube-outline" size={16} color="#10B981" />
                          <Text style={styles.specText}>{item.capacity}</Text>
                        </View>
                      )}
                      
                      {item.crops && (
                        <View style={styles.specChip}>
                          <Ionicons name="nutrition-outline" size={16} color="#10B981" />
                          <Text style={styles.specText}>{item.crops}</Text>
                        </View>
                      )}
                      
                      {item.width && (
                        <View style={styles.specChip}>
                          <Ionicons name="resize-outline" size={16} color="#10B981" />
                          <Text style={styles.specText}>{item.width}</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.descriptionText}>{item.description}</Text>
                    
                    <Text style={styles.featuresTitle}>Caratteristiche principali</Text>
                    <View style={styles.featuresList}>
                      {item.features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                    
                    
                  </View>
                </LinearGradient>
              </View>
            ))}
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111827",
  },
  container: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  categoryContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  categoryButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  machineCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  machineImage: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  machineInfo: {
    padding: 20,
  },
  machineName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  specsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  specText: {
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#E5E7EB',
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  featuresList: {
    gap: 10,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  featureText: {
    fontSize: 14,
    color: '#E5E7EB',
    marginLeft: 10,
    flex: 1,
  },
  detailsButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  detailsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
});

export default TractorInfo;