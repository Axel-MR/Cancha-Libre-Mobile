import React, { useState } from 'react';
import { View, Text, TextInput, Button, Image, ScrollView, StyleSheet, SafeAreaView } from 'react-native';

const ImageDebug = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [testResult, setTestResult] = useState(null);
  
  const testImage = () => {
    if (!imageUrl) return;
    
    setTestResult({
      loading: true,
      error: false,
      message: 'Cargando imagen...'
    });
  };
  
  const testUrls = [
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=1000',
    'http://192.168.100.13:3000/uploads/centros-deportivos/7be10dfc-6137-4971-a712-64f64bf3636a.jpeg',
    'https://192.168.100.13:3000/uploads/centros-deportivos/7be10dfc-6137-4971-a712-64f64bf3636a.jpeg'
  ];
  
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
          <Button title="Probar Imagen" onPress={testImage} />
          
          {testResult && (
            <View style={styles.testResult}>
              {testResult.loading ? (
                <Text>Cargando imagen...</Text>
              ) : testResult.error ? (
                <Text style={styles.errorText}>{testResult.message}</Text>
              ) : (
                <View>
                  <Text style={styles.successText}>Imagen cargada correctamente</Text>
                  <Image 
                    source={{ uri: imageUrl }}
                    style={styles.testImage}
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>URLs de prueba</Text>
          {testUrls.map((url, index) => (
            <View key={index} style={styles.testUrlContainer}>
              <Text style={styles.testUrlText}>{url}</Text>
              <Button 
                title="Probar" 
                onPress={() => {
                  setImageUrl(url);
                  testImage();
                }} 
              />
              <View style={styles.testImageContainer}>
                <Image 
                  source={{ uri: url }}
                  style={styles.testUrlImage}
                  resizeMode="cover"
                  onError={() => console.log(`Error al cargar: ${url}`)}
                />
              </View>
            </View>
          ))}
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
  testResult: {
    marginTop: 16,
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
  testUrlContainer: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
  },
  testUrlText: {
    fontSize: 14,
    marginBottom: 8,
  },
  testImageContainer: {
    marginTop: 8,
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  testUrlImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
});

export default ImageDebug;