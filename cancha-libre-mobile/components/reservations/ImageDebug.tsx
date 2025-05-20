import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Image, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';

// Función para normalizar URLs (convertir HTTPS a HTTP para el servidor local)
const normalizeImageUrl = (url) => {
  if (!url) return '';
  
  // Si la URL usa HTTPS para el servidor local, cambiarla a HTTP
  if (url.startsWith('https://192.168.100.13:3000')) {
    return url.replace('https://', 'http://');
  }
  
  return url;
};

const ImageDebug = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [normalizedUrl, setNormalizedUrl] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testResults, setTestResults] = useState({});
  
  // Actualizar URL normalizada cuando cambia la URL original
  useEffect(() => {
    setNormalizedUrl(normalizeImageUrl(imageUrl));
  }, [imageUrl]);
  
  const testImage = () => {
    if (!imageUrl) return;
    
    setTestResult({
      loading: true,
      error: false,
      message: 'Cargando imagen...',
      originalUrl: imageUrl,
      normalizedUrl: normalizeImageUrl(imageUrl)
    });
  };
  
  const handleImageLoad = () => {
    setTestResult(prev => ({
      ...prev,
      loading: false,
      error: false,
      message: 'Imagen cargada correctamente'
    }));
  };
  
  const handleImageError = () => {
    setTestResult(prev => ({
      ...prev,
      loading: false,
      error: true,
      message: 'Error al cargar la imagen'
    }));
  };
  
  const testUrls = [
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=1000',
    'http://192.168.100.13:3000/uploads/centros-deportivos/7be10dfc-6137-4971-a712-64f64bf3636a.jpeg',
    'https://192.168.100.13:3000/uploads/centros-deportivos/7be10dfc-6137-4971-a712-64f64bf3636a.jpeg'
  ];
  
  // Probar todas las URLs automáticamente al cargar el componente
  useEffect(() => {
    const results = {};
    testUrls.forEach(url => {
      results[url] = {
        loading: true,
        error: false,
        message: 'Cargando...',
        normalizedUrl: normalizeImageUrl(url)
      };
    });
    setTestResults(results);
  }, []);
  
  const handleTestUrlLoad = (url) => {
    setTestResults(prev => ({
      ...prev,
      [url]: {
        ...prev[url],
        loading: false,
        error: false,
        message: 'Cargada correctamente'
      }
    }));
  };
  
  const handleTestUrlError = (url) => {
    setTestResults(prev => ({
      ...prev,
      [url]: {
        ...prev[url],
        loading: false,
        error: true,
        message: 'Error al cargar'
      }
    }));
    
    // Intentar cargar con URL normalizada si falló y es diferente
    const normalized = normalizeImageUrl(url);
    if (normalized !== url) {
      console.log(`Intentando con URL normalizada: ${normalized}`);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Depurador de Imágenes</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Probar URL de imagen</Text>
          <TextInput
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="Ingresa una URL para probar"
          />
          
          {imageUrl !== normalizedUrl && (
            <View style={styles.normalizedContainer}>
              <Text style={styles.normalizedLabel}>URL normalizada:</Text>
              <Text style={styles.normalizedUrl}>{normalizedUrl}</Text>
            </View>
          )}
          
          <View style={styles.buttonRow}>
            <Button title="Probar URL Original" onPress={testImage} />
            {imageUrl !== normalizedUrl && (
              <Button 
                title="Probar URL Normalizada" 
                onPress={() => {
                  setImageUrl(normalizedUrl);
                  testImage();
                }} 
              />
            )}
          </View>
          
          {testResult && (
            <View style={styles.testResult}>
              {testResult.loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0066cc" />
                  <Text style={styles.loadingText}>Cargando imagen...</Text>
                </View>
              ) : testResult.error ? (
                <View>
                  <Text style={styles.errorText}>{testResult.message}</Text>
                  <Text style={styles.urlText}>URL: {testResult.originalUrl}</Text>
                  {testResult.originalUrl !== testResult.normalizedUrl && (
                    <Text style={styles.urlText}>URL normalizada: {testResult.normalizedUrl}</Text>
                  )}
                </View>
              ) : (
                <View>
                  <Text style={styles.successText}>{testResult.message}</Text>
                  <Text style={styles.urlText}>URL: {testResult.originalUrl}</Text>
                  {testResult.originalUrl !== testResult.normalizedUrl && (
                    <Text style={styles.urlText}>URL normalizada: {testResult.normalizedUrl}</Text>
                  )}
                  <Image 
                    source={{ uri: testResult.originalUrl }}
                    style={styles.testImage}
                    resizeMode="cover"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                </View>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>URLs de prueba</Text>
          {testUrls.map((url, index) => {
            const result = testResults[url] || { loading: true, message: 'No probada' };
            const normalized = result.normalizedUrl || normalizeImageUrl(url);
            const isNormalized = url !== normalized;
            
            return (
              <View key={index} style={styles.testUrlContainer}>
                <Text style={styles.testUrlText}>{url}</Text>
                {isNormalized && (
                  <Text style={styles.normalizedTestUrl}>Normalizada: {normalized}</Text>
                )}
                
                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>Estado:</Text>
                  <Text 
                    style={[
                      styles.statusText,
                      result.loading ? styles.loadingStatus : 
                      result.error ? styles.errorStatus : styles.successStatus
                    ]}
                  >
                    {result.message}
                  </Text>
                </View>
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.button, styles.originalButton]}
                    onPress={() => {
                      setImageUrl(url);
                      testImage();
                    }}
                  >
                    <Text style={styles.buttonText}>Probar Original</Text>
                  </TouchableOpacity>
                  
                  {isNormalized && (
                    <TouchableOpacity 
                      style={[styles.button, styles.normalizedButton]}
                      onPress={() => {
                        setImageUrl(normalized);
                        testImage();
                      }}
                    >
                      <Text style={styles.buttonText}>Probar Normalizada</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.testImageContainer}>
                  <Image 
                    source={{ uri: url }}
                    style={styles.testUrlImage}
                    resizeMode="cover"
                    onLoad={() => handleTestUrlLoad(url)}
                    onError={() => handleTestUrlError(url)}
                  />
                </View>
                
                {isNormalized && (
                  <View style={styles.testImageContainer}>
                    <Text style={styles.imageLabel}>Imagen con URL normalizada:</Text>
                    <Image 
                      source={{ uri: normalized }}
                      style={styles.testUrlImage}
                      resizeMode="cover"
                      onLoad={() => console.log(`Normalizada cargada: ${normalized}`)}
                      onError={() => console.log(`Error normalizada: ${normalized}`)}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Implementación de normalizeImageUrl</Text>
          <Text style={styles.codeTitle}>Función para normalizar URLs:</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>
              {`const normalizeImageUrl = (url) => {
  if (!url) return '';
  
  // Si la URL usa HTTPS para el servidor local, cambiarla a HTTP
  if (url.startsWith('https://192.168.100.13:3000')) {
    return url.replace('https://', 'http://');
  }
  
  return url;
};`}
            </Text>
          </View>
          
          <Text style={styles.codeTitle}>Cómo usar en componentes:</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>
              {`// En ReservationCard.jsx o cualquier componente que muestre imágenes
const imageUrl = normalizeImageUrl(props.imagenUrl);

<Image 
  source={{ uri: imageUrl }} 
  style={styles.image}
  onError={handleImageError}
/>`}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  normalizedContainer: {
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  normalizedLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  normalizedUrl: {
    color: '#0066cc',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  testResult: {
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  testImage: {
    width: '100%',
    height: 200,
    marginTop: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  successText: {
    color: 'green',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontWeight: 'bold',
  },
  urlText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  testUrlContainer: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
  },
  testUrlText: {
    fontSize: 14,
    marginBottom: 4,
  },
  normalizedTestUrl: {
    fontSize: 12,
    color: '#0066cc',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontWeight: 'bold',
    marginRight: 4,
  },
  statusText: {
    fontSize: 14,
  },
  loadingStatus: {
    color: '#666',
  },
  errorStatus: {
    color: 'red',
  },
  successStatus: {
    color: 'green',
  },
  button: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  originalButton: {
    backgroundColor: '#e0e0e0',
  },
  normalizedButton: {
    backgroundColor: '#e6f2ff',
  },
  buttonText: {
    fontWeight: 'bold',
  },
  testImageContainer: {
    marginTop: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    padding: 8,
  },
  imageLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  testUrlImage: {
    width: '100%',
    height: 150,
    borderRadius: 4,
  },
  codeTitle: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  codeBlock: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});

export default ImageDebug;