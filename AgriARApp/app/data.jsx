import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, SafeAreaView, StatusBar, Image } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Data() {
  const [location, setLocation] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const apiKey = '4c2ca9a9f815ae1262425a4c0529a0eb';
  const currentWeatherURL = 'https://api.openweathermap.org/data/2.5/weather';
  const forecastURL = 'https://api.openweathermap.org/data/2.5/forecast';

  const handleFetchData = async () => {
    if (location.trim() === '') {
      Alert.alert('Errore', 'Inserisci una località.');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch current weather
      const currentResponse = await fetch(
        `${currentWeatherURL}?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
      );

      if (!currentResponse.ok) {
        throw new Error('Località non trovata o risposta API non valida');
      }

      const currentData = await currentResponse.json();
      setCurrentWeather(currentData);

      // Fetch forecast data
      const forecastResponse = await fetch(
        `${forecastURL}?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
      );

      if (!forecastResponse.ok) {
        throw new Error('Impossibile recuperare i dati delle previsioni');
      }

      const forecastData = await forecastResponse.json();
      setForecastData(processForcastData(forecastData));
      setDataLoaded(true);
    } catch (error) {
      Alert.alert('Errore', 'Impossibile recuperare i dati. Controlla la località o riprova più tardi.');
      console.error('Errore fetch:', error);
      setDataLoaded(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSearch = () => {
    setDataLoaded(false);
  };

  const processForcastData = (data) => {
    const dailyData = {};
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const day = date.toISOString().split('T')[0]; // Formato ISO per evitare problemi di locale
      
      if (!dailyData[day]) {
        dailyData[day] = {
          temps: [],
          humidity: [],
          windSpeed: [],
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          timestamp: item.dt // Salviamo il timestamp per usarlo dopo
        };
      }
      
      dailyData[day].temps.push(item.main.temp);
      dailyData[day].humidity.push(item.main.humidity);
      dailyData[day].windSpeed.push(item.wind.speed);
    });

    return Object.entries(dailyData).slice(0, 5).map(([date, data]) => ({
      date,
      timestamp: data.timestamp,
      avgTemp: (data.temps.reduce((a, b) => a + b, 0) / data.temps.length).toFixed(1),
      avgHumidity: (data.humidity.reduce((a, b) => a + b, 0) / data.humidity.length).toFixed(0),
      avgWindSpeed: (data.windSpeed.reduce((a, b) => a + b, 0) / data.windSpeed.length).toFixed(1),
      description: data.description,
      icon: data.icon,
    }));
  };

  const getChartData = () => {
    if (!currentWeather) return null;

    return {
      labels: ['Temp (°C)', 'Umidità (%)', 'Vento (m/s)', 'Nuvole (%)'],
      datasets: [{
        data: [
          Number(currentWeather.main.temp.toFixed(1)),
          currentWeather.main.humidity,
          Number(currentWeather.wind.speed.toFixed(1)),
          currentWeather.clouds.all
        ]
      }]
    };
  };

  const getForecastChartData = () => {
    if (!forecastData) return null;

    return {
      labels: forecastData.map(data => new Date(data.date).toLocaleDateString('it-IT', { weekday: 'short' })),
      datasets: [{
        data: forecastData.map(data => Number(data.avgTemp)),
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
      }]
    };
  };

  const getWeatherIcon = (weatherCode) => {
    const iconMap = {
      '01d': 'weather-sunny',
      '01n': 'weather-night',
      '02d': 'weather-partly-cloudy',
      '02n': 'weather-night-partly-cloudy',
      '03d': 'weather-cloudy',
      '03n': 'weather-cloudy',
      '04d': 'weather-cloudy',
      '04n': 'weather-cloudy',
      '09d': 'weather-pouring',
      '09n': 'weather-pouring',
      '10d': 'weather-rainy',
      '10n': 'weather-rainy',
      '11d': 'weather-lightning-rainy',
      '11n': 'weather-lightning-rainy',
      '13d': 'weather-snowy',
      '13n': 'weather-snowy',
      '50d': 'weather-fog',
      '50n': 'weather-fog',
    };

    return iconMap[weatherCode] || 'weather-cloudy';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <LinearGradient
        colors={['#111827', '#1E3A8A']}
        style={styles.container}
      >
        {!dataLoaded ? (
          // Search View
          <View style={styles.searchContainer}>
            <Image
              source={require("../assets/images/augmented-reality.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Previsioni Meteo</Text>
            <Text style={styles.description}>
              Ottieni informazioni meteorologiche dettagliate per qualsiasi località. Pianifica le tue attività agricole in base alle condizioni meteo!
            </Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="map-marker" size={24} color="#E5E7EB" style={styles.searchIcon} />
              <TextInput
                style={styles.input}
                placeholder="Inserisci il nome della città..."
                placeholderTextColor="#9CA3AF"
                value={location}
                onChangeText={setLocation}
              />
            </View>
            <TouchableOpacity 
              style={styles.mainButton} 
              onPress={handleFetchData}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#10B981', '#047857']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="cloud" size={24} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Ottieni Meteo</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          // Results View
          <ScrollView style={styles.resultScrollView}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBackToSearch}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" style={styles.backIcon} />
              <Text style={styles.backButtonText}>Torna alla ricerca</Text>
            </TouchableOpacity>

            <View style={styles.dataContainer}>
              {/* Current Weather */}
              <LinearGradient
                colors={['#10B981', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerContainer}
              >
                <MaterialCommunityIcons 
                  name={getWeatherIcon(currentWeather.weather[0].icon)}
                  size={64} 
                  color="#FFFFFF"
                />
                <View style={styles.locationContainer}>
                  <Text style={styles.locationText}>{currentWeather.name}</Text>
                  <Text style={styles.countryText}>{currentWeather.sys.country}</Text>
                  <Text style={styles.weatherDescription}>
                    {currentWeather.weather[0].description.charAt(0).toUpperCase() + 
                    currentWeather.weather[0].description.slice(1)}
                  </Text>
                </View>
              </LinearGradient>

              {/* Current Weather Details */}
              <View style={styles.weatherGrid}>
                <LinearGradient
                  colors={['#111827', '#1F2937']}
                  style={styles.weatherItem}
                >
                  <MaterialCommunityIcons name="thermometer" size={32} color="#10B981" />
                  <Text style={styles.weatherValue}>{currentWeather.main.temp.toFixed(1)}°C</Text>
                  <Text style={styles.weatherLabel}>Temperatura</Text>
                </LinearGradient>
                
                <LinearGradient
                  colors={['#111827', '#1F2937']}
                  style={styles.weatherItem}
                >
                  <MaterialCommunityIcons name="water-percent" size={32} color="#10B981" />
                  <Text style={styles.weatherValue}>{currentWeather.main.humidity}%</Text>
                  <Text style={styles.weatherLabel}>Umidità</Text>
                </LinearGradient>
                
                <LinearGradient
                  colors={['#111827', '#1F2937']}
                  style={styles.weatherItem}
                >
                  <MaterialCommunityIcons name="weather-windy" size={32} color="#10B981" />
                  <Text style={styles.weatherValue}>{currentWeather.wind.speed.toFixed(1)} m/s</Text>
                  <Text style={styles.weatherLabel}>Velocità Vento</Text>
                </LinearGradient>
                
                <LinearGradient
                  colors={['#111827', '#1F2937']}
                  style={styles.weatherItem}
                >
                  <MaterialCommunityIcons name="cloud" size={32} color="#10B981" />
                  <Text style={styles.weatherValue}>{currentWeather.clouds.all}%</Text>
                  <Text style={styles.weatherLabel}>Copertura Nuvolosa</Text>
                </LinearGradient>
              </View>

              {/* 5-Day Forecast */}
              <View style={styles.forecastContainer}>
                <Text style={styles.chartTitle}>Previsioni 5 Giorni</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {forecastData.map((day, index) => (
                    <LinearGradient
                      key={index}
                      colors={['#111827', '#1F2937']}
                      style={styles.forecastDay}
                    >
                      <Text style={styles.forecastDate}>
                        {new Date(day.date).toLocaleDateString('it-IT', { weekday: 'short' })}
                      </Text>
                      <MaterialCommunityIcons 
                        name={getWeatherIcon(day.icon)}
                        size={32} 
                        color="#10B981"
                      />
                      <Text style={styles.forecastTemp}>{day.avgTemp}°C</Text>
                      <Text style={styles.forecastDesc}>{day.description}</Text>
                      <View style={styles.forecastDetails}>
                        <Text style={styles.forecastDetailsText}>💧 {day.avgHumidity}%</Text>
                        <Text style={styles.forecastDetailsText}>💨 {day.avgWindSpeed} m/s</Text>
                      </View>
                    </LinearGradient>
                  ))}
                </ScrollView>
              </View>

              {/* Temperature Trend Chart */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Tendenza Temperatura</Text>
                <LineChart
                  data={getForecastChartData()}
                  width={Dimensions.get('window').width - 40}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix="°C"
                  chartConfig={{
                    backgroundColor: '#064E3B',
                    backgroundGradient: {
                      colors: ['#064E3B', '#047857'],
                      start: { x: 0, y: 0 },
                      end: { x: 1, y: 0 },
                    },
                    backgroundGradientFrom: '#064E3B',
                    backgroundGradientTo: '#047857',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForLabels: {
                      fontSize: 12,
                    },
                  }}
                  style={styles.chart}
                  bezier
                  withDots={true}
                  withVerticalLines={false}
                />
              </View>

              {/* Current Weather Metrics */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Metriche Meteo Attuali</Text>
                <BarChart
                  data={getChartData()}
                  width={Dimensions.get('window').width - 40}
                  height={220}
                  yAxisLabel=""
                  chartConfig={{
                    backgroundColor: '#064E3B',
                    backgroundGradientFrom: '#064E3B',
                    backgroundGradientTo: '#047857',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForLabels: {
                      fontSize: 12,
                    },
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars={true}
                />
              </View>
            </View>
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111827",
  },
  container: {
    flex: 1,
  },
  searchContainer: {
    flex: 1,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: "#E5E7EB",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#FFFFFF",
  },
  mainButton: {
    width: '100%',
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
  resultScrollView: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    margin: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  backIcon: {
    marginRight: 5,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dataContainer: {
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  locationContainer: {
    marginLeft: 20,
  },
  locationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  countryText: {
    fontSize: 18,
    color: '#E5E7EB',
    marginTop: 4,
  },
  weatherDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.9,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weatherItem: {
    width: '48%',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  weatherValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  weatherLabel: {
    fontSize: 14,
    color: '#E5E7EB',
    marginTop: 5,
  },
  forecastContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  forecastDay: {
    alignItems: 'center',
    padding: 15,
    marginRight: 15,
    borderRadius: 12,
    width: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  forecastDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 5,
  },
  forecastDesc: {
    fontSize: 12,
    color: '#E5E7EB',
    textAlign: 'center',
    marginTop: 5,
  },
  forecastDetails: {
    marginTop: 8,
  },
  forecastDetailsText: {
    fontSize: 12,
    color: '#E5E7EB',
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  chart: {
    marginVertical: 10,
    borderRadius: 16,
  },
});