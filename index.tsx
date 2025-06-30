import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, TextInput, ScrollView, SafeAreaView, ActivityIndicator, StyleSheet, StatusBar, ColorValue } from 'react-native';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, Droplets, Thermometer, CloudDrizzle, CloudLightning, LucideProps } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// --- TypeScript Interfaces ---
interface WeatherIconProps {
    condition: string;
    size?: number;
}

interface ForecastItem {
    dt: number;
    temp: number | { min: number; max: number };
    weather: { main: string; description: string }[];
}

interface HourlyForecastProps {
    item: ForecastItem;
    isNow: boolean;
}

interface DailyForecastProps {
    item: ForecastItem;
}

interface InfoCardProps {
    icon: React.ElementType<LucideProps>;
    title: string;
    value: string | number;
}

interface WeatherData {
    name: string;
    current: {
        dt: number;
        sunrise: number;
        sunset: number;
        temp: number;
        feels_like: number;
        humidity: number;
        uvi: number;
        wind_speed: number;
        weather: { main: string; description: string }[];
    };
    hourly: ForecastItem[];
    daily: ForecastItem[];
}


// --- Helper Components ---

const WeatherIcon: React.FC<WeatherIconProps> = ({ condition, size = 48 }) => {
    let IconComponent: React.ElementType<LucideProps> = Sun;
    const props: LucideProps = { size, color: "white" };

    if (condition?.includes('Clear')) IconComponent = Sun;
    if (condition?.includes('Clouds')) IconComponent = Cloud;
    if (condition?.includes('Rain')) IconComponent = CloudRain;
    if (condition?.includes('Drizzle')) IconComponent = CloudDrizzle;
    if (condition?.includes('Snow')) IconComponent = CloudSnow;
    if (condition?.includes('Thunderstorm')) IconComponent = CloudLightning;
    if (condition?.includes('Mist') || condition?.includes('Fog') || condition?.includes('Haze')) IconComponent = Cloud;

    return <IconComponent {...props} />;
};

const HourlyForecastItem: React.FC<HourlyForecastProps> = ({ item, isNow }) => (
    <View className="flex flex-col items-center justify-center space-y-2 w-20">
        <Text className="text-white font-medium text-base">{isNow ? "Now" : new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}</Text>
        <WeatherIcon condition={item.weather[0].main} size={28} />
        <Text className="text-white font-bold text-xl">{typeof item.temp === 'number' ? Math.round(item.temp) : 0}°</Text>
    </View>
);

const DailyForecastItem: React.FC<DailyForecastProps> = ({ item }) => (
    <View className="flex-row items-center justify-between py-3">
        <Text className="text-white font-medium text-lg w-1/3">{new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' })}</Text>
        <View className="w-8 h-8 flex items-center justify-center">
            <WeatherIcon condition={item.weather[0].main} size={28} />
        </View>
        <View className="flex-row justify-end items-center space-x-2 w-1/2">
            <Text className="text-white/70 w-10 text-right text-lg">{typeof item.temp === 'object' ? Math.round(item.temp.min) : 0}°</Text>
            <View className="w-full h-1 bg-white/20 rounded-full flex-1">
                <View
                    className="h-1 rounded-full"
                    style={{
                        backgroundColor: '#81c7f5',
                        width: `${typeof item.temp === 'object' ? Math.max(0, Math.min(100, ((item.temp.max - item.temp.min) / 30) * 100)) : 0}%`
                    }}
                />
            </View>
            <Text className="text-white w-10 text-right text-lg font-bold">{typeof item.temp === 'object' ? Math.round(item.temp.max) : 0}°</Text>
        </View>
    </View>
);

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, value }) => {
    const Icon = icon;
    return (
        <View style={styles.glassEffect} className="p-4 rounded-2xl flex-1">
            <View className="flex-row items-center space-x-2 mb-1">
                <Icon size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text className="text-white/70 text-sm uppercase font-bold">{title}</Text>
            </View>
            <Text className="text-white text-3xl font-light">{value}</Text>
        </View>
    );
};

// --- Main Application Component ---
export default function Index() {
    const [city, setCity] = useState('Irvine');
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');

    // Using a placeholder constant to avoid TypeScript comparison error
    const API_KEY_PLACEHOLDER: string = "YOUR_API_KEY_HERE";
    const API_KEY: string = "YOUR_API_KEY_HERE";

    const fetchWeather = useCallback(async (cityName: string) => {
        if (!cityName) return;
        setLoading(true);
        setError(null);

        if (API_KEY == API_KEY_PLACEHOLDER) {
            setError("Please add your OpenWeatherMap API key.");
            setLoading(false);
            return;
        }

        try {
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
            const geoResponse = await fetch(geoUrl);
            if (!geoResponse.ok) throw new Error("Failed to fetch city coordinates.");
            const geoData = await geoResponse.json();

            if (geoData.length === 0) {
                throw new Error(`Could not find city: "${cityName}"`);
            }
            const { lat, lon, name } = geoData[0];

            const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=imperial&exclude=minutely,alerts&appid=${API_KEY}`;
            const weatherResponse = await fetch(weatherUrl);
            if (!weatherResponse.ok) {
                throw new Error('API Key Error. Ensure it is valid and authorized for One Call API.');
            }
            const fetchedWeatherData = await weatherResponse.json();

            setWeatherData({ ...fetchedWeatherData, name });

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWeather(city).catch(console.error);
    }, [city, fetchWeather]);

    const handleSearch = () => {
        if (searchInput) {
            setCity(searchInput.trim());
            setSearchInput('');
        }
    };

    // Explicitly typing bgColors as a readonly array to satisfy LinearGradient
    let bgColors: readonly string[] = ['#4c669f', '#3b5998', '#192f6a'];
    if (weatherData && weatherData.current) {
        const condition = weatherData.current.weather[0].main;
        const isDay = weatherData.current.dt > weatherData.current.sunrise && weatherData.current.dt < weatherData.current.sunset;

        if (condition.includes('Clear')) bgColors = isDay ? ['#4a90e2', '#81c7f5'] : ['#0c1445', '#3b5998'];
        else if (condition.includes('Clouds')) bgColors = isDay ? ['#6c7a89', '#95a5a6'] : ['#2c3e50', '#34495e'];
        else if (condition.includes('Rain') || condition.includes('Drizzle')) bgColors = ['#546e7a', '#37474f'];
        else if (condition.includes('Snow')) bgColors = ['#b0c4de', '#a4b0be'];
    }

    // Helper function to render content based on state
    const renderContent = () => {
        if (loading) {
            return (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="white" />
                </View>
            );
        }

        if (error) {
            return (
                <View className="flex-1 justify-center items-center p-5">
                    <Text className="text-white text-2xl text-center mb-4">{error}</Text>
                    <TextInput
                        className="bg-white/20 text-white placeholder-white/70 text-lg rounded-full px-5 py-3 w-full"
                        placeholder="Enter another city..."
                        value={searchInput}
                        onChangeText={setSearchInput}
                        onSubmitEditing={handleSearch}
                    />
                </View>
            );
        }

        if (weatherData) {
            return (
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="p-5" keyboardShouldPersistTaps="handled">
                    <View className="mb-4">
                        <TextInput
                            placeholder="Search for a city..."
                            placeholderTextColor="rgba(255, 255, 255, 0.7)"
                            className="bg-black/20 text-white text-lg rounded-full px-5 py-3"
                            value={searchInput}
                            onChangeText={setSearchInput}
                            onSubmitEditing={handleSearch}
                        />
                    </View>

                    <View className="items-center my-6">
                        <Text style={styles.textShadow} className="text-white text-4xl font-medium">{weatherData.name}</Text>
                        <Text style={styles.textShadow} className="text-white text-9xl font-thin">{Math.round(weatherData.current.temp)}°</Text>
                        <Text style={styles.textShadow} className="text-white text-2xl capitalize">{weatherData.current.weather[0].description}</Text>
                        <Text style={styles.textShadow} className="text-white text-xl">H:{typeof weatherData.daily[0].temp === 'object' ? Math.round(weatherData.daily[0].temp.max) : ''}° L:{typeof weatherData.daily[0].temp === 'object' ? Math.round(weatherData.daily[0].temp.min): ''}°</Text>
                    </View>

                    <View style={styles.glassEffect} className="p-4 rounded-2xl mb-5">
                        <Text className="text-white/70 text-sm uppercase font-bold mb-2 border-b border-white/20 pb-2">Hourly Forecast</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {weatherData.hourly.slice(0, 24).map((item, index) => (
                                <HourlyForecastItem key={item.dt} item={item} isNow={index === 0} />
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.glassEffect} className="p-4 rounded-2xl mb-5">
                        <Text className="text-white/70 text-sm uppercase font-bold mb-2 border-b border-white/20 pb-2">7-Day Forecast</Text>
                        {weatherData.daily.slice(1, 8).map((item) => (
                            <DailyForecastItem key={item.dt} item={item} />
                        ))}
                    </View>

                    <View className="flex-row w-full space-x-4 mb-4">
                        <InfoCard icon={Thermometer} title="Feels Like" value={`${Math.round(weatherData.current.feels_like)}°`} />
                        <InfoCard icon={Droplets} title="Humidity" value={`${weatherData.current.humidity}%`} />
                    </View>
                    <View className="flex-row w-full space-x-4">
                        <InfoCard icon={Wind} title="Wind" value={`${Math.round(weatherData.current.wind_speed)} mph`} />
                        <InfoCard icon={Sun} title="UV Index" value={weatherData.current.uvi} />
                    </View>
                </ScrollView>
            );
        }
        return null;
    }

    return (
        <LinearGradient colors={bgColors as [ColorValue, ColorValue]} style={styles.container}>
        <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1">
                {renderContent()}
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    textShadow: {
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    glassEffect: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
    }
});
