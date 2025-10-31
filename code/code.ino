#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ====== WiFi & MQTT ======
const char* ssid = "realme Q3s";
const char* password = "10580103";
const char* mqtt_server = "192.168.245.201";

WiFiClient espClient;
PubSubClient client(espClient);

// ====== DHT11 ======
#define DHTPIN D2        
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ====== LDR ======
#define LDR_PIN A0

// ====== LED ======
#define LED1 D5
#define LED2 D6
#define LED3 D7

// Lưu trạng thái LED lần trước để kiểm tra thay đổi
int lastLed1State = LOW;
int lastLed2State = LOW;
int lastLed3State = LOW;

// ====== WiFi ======
void setup_wifi() {
  delay(10);
  Serial.print("Đang kết nối WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected");
  Serial.print("📡 IP: ");
  Serial.println(WiFi.localIP());
}

// ====== Publish LED state ======
void publishLedState() {
  StaticJsonDocument<128> doc;
  doc["led1"] = digitalRead(LED1) == HIGH ? "ON" : "OFF";
  doc["led2"] = digitalRead(LED2) == HIGH ? "ON" : "OFF";
  doc["led3"] = digitalRead(LED3) == HIGH ? "ON" : "OFF";

  char buffer[128];
  serializeJson(doc, buffer);

  client.publish("iot/led/state", buffer, true);
  Serial.print("📤 LED state sent: ");
  Serial.println(buffer);
}

// ====== MQTT Callback ======
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("📩 Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");

  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  StaticJsonDocument<128> doc;
  DeserializationError error = deserializeJson(doc, message);
  if (error) {
    Serial.print("❌ JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }

  // Điều khiển LED theo nội dung nhận được
  if (doc.containsKey("led1")) {
    String v = doc["led1"].as<String>();
    digitalWrite(LED1, (v == "ON" || v == "1") ? HIGH : LOW);
  }
  if (doc.containsKey("led2")) {
    String v = doc["led2"].as<String>();
    digitalWrite(LED2, (v == "ON" || v == "1") ? HIGH : LOW);
  }
  if (doc.containsKey("led3")) {
    String v = doc["led3"].as<String>();
    digitalWrite(LED3, (v == "ON" || v == "1") ? HIGH : LOW);
  }
}

// ====== MQTT Reconnect ======
void reconnect() {
  while (!client.connected()) {
    Serial.print("🔄 Kết nối MQTT...");
    if (client.connect("ESP8266Client", "huy", "123")) {
      Serial.println("✅ OK");
      client.subscribe("iot/led/control");
      publishLedState(); // gửi trạng thái đèn sau khi kết nối lại
    } else {
      Serial.print("❌ Thất bại, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

// ====== Setup ======
void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  dht.begin();
  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  pinMode(LED3, OUTPUT);

  // Khởi tạo LED tắt
  digitalWrite(LED1, LOW);
  digitalWrite(LED2, LOW);
  digitalWrite(LED3, LOW);

  // Lưu trạng thái ban đầu
  lastLed1State = digitalRead(LED1);
  lastLed2State = digitalRead(LED2);
  lastLed3State = digitalRead(LED3);

  publishLedState();
}

// ====== Loop ======
void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  // --- Gửi dữ liệu cảm biến ---
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int ldr = analogRead(LDR_PIN);
 
  StaticJsonDocument<128> sensorDoc;
  sensorDoc["temperature"] = isnan(t) ? 0 : t;
  sensorDoc["humidity"] = isnan(h) ? 0 : h;
  sensorDoc["light"] = 1023-ldr;

  char sensorBuffer[128];
  serializeJson(sensorDoc, sensorBuffer);
  client.publish("iot/sensor/data", sensorBuffer);
  Serial.print("📤 Published sensor: ");
  Serial.println(sensorBuffer);
  publishLedState();
 

  delay(2000);
}
