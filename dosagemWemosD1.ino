#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// --- CONFIGURAÇÃO WIFI ---
const char* ssid = "IFSC";
const char* password = "campuschapeco";

// --- URLS ---
const char* getUrl = "https://marcosvirgilio.dev.br/sistemas/dosagem/conDemanda.php";
const char* postUrl = "https://marcosvirgilio.dev.br/sistemas/dosagem/finalizaDemanda.php";

void setup() {
  Serial.begin(115200);
  delay(1000);
  WiFi.begin(ssid, password);
  Serial.print("Conectando");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi Conectado!");
}

void loop() {
  // Variável para guardar o ID fora do escopo da request
  int idParaFinalizar = -1;

  // --- 1. BLOCO DE REQUEST GET (ISOLADO) ---
  {
    WiFiClientSecure client;
    HTTPClient http;
    client.setInsecure();
    // Buffer menor para economizar RAM
    client.setBufferSizes(512, 512); 

    Serial.println("\n--- Iniciando GET ---");
    if (http.begin(client, getUrl)) {
      int httpCode = http.GET();
      if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, payload);

        if (!error && !doc[0].isNull()) {
          // GUARDAMOS O VALOR NA VARIÁVEL EXTERNA
          idParaFinalizar = doc[0]["idDemanda"];
          Serial.printf("ID %d guardado na memória. Fechando conexão GET...\n", idParaFinalizar);
        }
      }
      http.end(); // Encerra a comunicação
    }
  } 
  // <-- Ao chegar aqui, 'client' e 'http' do GET foram DESTRUÍDOS. RAM liberada!

  // --- 2. BLOCO DE REQUEST POST (SÓ SE TIVER ID) ---
  if (idParaFinalizar != -1) {
    delay(200); // Pequena pausa para estabilidade do stack TCP

    WiFiClientSecure clientPost;
    HTTPClient httpPost;
    clientPost.setInsecure();
    clientPost.setBufferSizes(512, 512);

    Serial.printf("--- Iniciando POST para ID: %d ---\n", idParaFinalizar);
    if (httpPost.begin(clientPost, postUrl)) {
      httpPost.addHeader("Content-Type", "application/json");

      // Monta o JSON de finalização
      JsonDocument docPost;
      docPost["idDemanda"] = idParaFinalizar;
      String jsonFinaliza;
      serializeJson(docPost, jsonFinaliza);

      int httpCode = httpPost.POST(jsonFinaliza);

      if (httpCode > 0) {
        String response = httpPost.getString();
        Serial.println("Resposta do Servidor:");
        Serial.println(response); // Aqui mostrará o "success": true
      } else {
        Serial.printf("Erro no POST: %s (%d)\n", httpPost.errorToString(httpCode).c_str(), httpCode);
      }
      httpPost.end();
    }
  }

  Serial.println("\nAguardando 10 segundos para o próximo ciclo...");
  delay(10000);
}