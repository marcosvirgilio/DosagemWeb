#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// --- CONFIGURAÇÃO WIFI ---
const char* ssid = "IFSC";
const char* password = "campuschapeco";

// --- URL DO SEU WEBSERVICE ---
const char* serverUrl = "https://marcosvirgilio.dev.br/sistemas/dosagem/conBarril.php";

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Conectando WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado com sucesso!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void getFirstRecord() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    HTTPClient http;

    // IMPORTANTE: Ignora a validação do certificado SSL para o HTTPS funcionar
    client.setInsecure(); 

    Serial.println("\n--- Solicitando dados do Servidor ---");
    
    if (http.begin(client, serverUrl)) {
      int httpCode = http.GET();

      if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        Serial.println("Resposta recebida. Processando...");

        // Configuração para ArduinoJson V7
        JsonDocument doc; 
        DeserializationError error = deserializeJson(doc, payload);

        if (!error) {
          // O JSON é um array [], pegamos o primeiro objeto [0]
          JsonObject primeiro = doc[0];

          if (!primeiro.isNull()) {
            // CORREÇÃO DAS CHAVES (Case Sensitive):
            int id = primeiro["idBarril"];              // Antes estava "id"
            const char* produto = primeiro["deProduto"];
            float total = primeiro["vlLitrosTotal"];    // O 'L' deve ser maiúsculo
            float atual = primeiro["vlLitrosAtual"];    // O 'L' deve ser maiúsculo

            // Exibição formatada no Serial Monitor
            Serial.println("===============================");
            Serial.println("DADOS DO PRIMEIRO BARRIL:");
            Serial.print("ID:         "); Serial.println(id);
            Serial.print("Produto:    "); Serial.println(produto);
            Serial.print("Capacidade: "); Serial.print(total); Serial.println(" L");
            Serial.print("Conteúdo:   "); Serial.print(atual); Serial.println(" L");
            Serial.println("===============================");
          } else {
            Serial.println("Aviso: O array JSON está vazio.");
          }
        } else {
          Serial.print("Erro ao processar JSON: ");
          Serial.println(error.c_str());
        }
      } else {
        Serial.printf("Erro na requisição HTTP: %s (Código: %d)\n", 
                      http.errorToString(httpCode).c_str(), httpCode);
      }
      http.end();
    }
  } else {
    Serial.println("WiFi desconectado. Aguardando reconexão...");
  }
}

void loop() {
  getFirstRecord();

  // Aguarda 10 segundos antes de ler novamente
  Serial.println("\nAguardando 10 segundos...");
  delay(10000);
}