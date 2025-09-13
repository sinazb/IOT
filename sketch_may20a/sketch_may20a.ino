#include <SPI.h>
#include <Ethernet.h>
#include <ArduinoJson.h>
#include <DFRobot_DHT11.h>
DFRobot_DHT11 DHT;

int tmp = 25;
int hum = 30;
// ------------------- شبکه -------------------
byte macHW[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };        // مک آردوینو
const char MAC_STR[] = "DE:AD:BE:EF:FE:ED";                    // برای ارتباط با سرور
IPAddress ip(192, 168, 1, 25);                                // IP آردوینو
IPAddress gw(192, 168, 1, 1);                                  // Gateway/DNS
IPAddress serverIp(192, 168, 1, 3);                            // IP سرور
const uint16_t serverPort = 5000;

EthernetClient client;

// ------------------- پین‌ها -------------------
#define DHT_PIN 7
const int reservedPins[] = {2, 50, 51, 52, 53, DHT_PIN};

// ------------------- کمکی -------------------
bool isReservedPin(int p) {
  for (unsigned i = 0; i < sizeof(reservedPins)/sizeof(reservedPins[0]); i++) {
    if (p == reservedPins[i]) return true;
  }
  return false;
}

void setupPins() {
  for (int p = 3; p <= 49; p++) {
    if (!isReservedPin(p)) {
      pinMode(p, OUTPUT);
      digitalWrite(p, LOW);
    }
  }
  pinMode(DHT_PIN, INPUT);  // رزرو برای DHT11
}

bool httpRequest(const String& method, const String& path, const String& body, String& responseBody) {
  responseBody = "";

  if (!client.connect(serverIp, serverPort)) {
    Serial.println("❌ HTTP connect failed");
    return false;
  }

  // ساخت هدر
  String req = method + " " + path + " HTTP/1.1\r\n";
  req += "Host: 192.168.1.3:" + String(serverPort) + "\r\n";
  if (method == "POST") {
    req += "Content-Type: application/json\r\n";
    req += "Content-Length: " + String(body.length()) + "\r\n";
  }
  req += "Connection: close\r\n";
  req += "\r\n";

  // ارسال
  client.print(req);
  if (method == "POST") client.print(body);

  // خواندن پاسخ
  unsigned long t0 = millis();
  String resp;
  while (millis() - t0 < 5000) {
    while (client.available()) {
      char c = client.read();
      resp += c;
    }
    if (!client.connected()) break;
  }
  client.stop();

  Serial.println("RAW Response:");
  Serial.println(resp);
  int idx = resp.indexOf("\r\n\r\n");
  if (idx >= 0) {
    responseBody = resp.substring(idx + 4);
    return true;
  } else {
    Serial.println("❌ Bad HTTP response");
    return false;
  }
}

void postSensorDHT() {
  DHT.read(DHT_PIN);
  tmp = DHT.temperature;
  hum = DHT.humidity;
  StaticJsonDocument<256> doc;
  doc["mac"]  = MAC_STR;
  doc["type"] = "DHT11";
  JsonObject data = doc.createNestedObject("data");
  data["temperature"] = tmp;
  data["humidity"]    = hum;

  String body;
  serializeJson(doc, body);

  String resp;
  if (httpRequest("POST", "/api/arduino/data", body, resp)) {
    Serial.println("📡 Sensor POST OK");
  } else {
    Serial.println("❌ Sensor POST failed");
  }
}
void handleDigitalWrite(JsonObject cmd) {
  int pin = cmd["pin"] | -1;
  int value = cmd["value"] | 0;
  if (pin < 0) return;
  pinMode(pin, OUTPUT);
  if(value == 1)
  {digitalWrite(pin,HIGH);}
  else
  {digitalWrite(pin,LOW);}
  Serial.print("➡ digitalWrite pin "); Serial.print(pin);
  Serial.print(" = "); Serial.println(value);
}
int speed = 0;
int A  = -1;
int B  =  -1;
int A_ = -1;
int B_ = -1;
int dir = 0;
void handleStepper(JsonObject cmd) {
  JsonObject pins = cmd["pins"];
  A  = pins["A"]  | -1;
  B  = pins["B"]  | -1;
  A_ = pins["A_"] | -1;
  B_ = pins["B_"] | -1;
  dir = cmd["direction"] | 0;
  if(!(speed == 10 && dir > 0) && !(speed == -10 && dir < 0))
  speed += dir;
  Serial.print("➡ stepper dir="); Serial.println(dir);
  Serial.print("➡ stepper speed="); Serial.println(speed);

  }
  int stepperPhase = 0;
  void nextPhase()
  {
    if(speed == 0) return;
    if(speed > 0) { stepperPhase = (stepperPhase + 3) % 4 ;}
    if(speed < 0) { stepperPhase = (stepperPhase + 1) % 4 ;}
  }
  void updateStepper()
  {
    if (A<0 || B<0 || A_<0 || B_<0 || speed == 0) return;

  pinMode(A, OUTPUT); pinMode(B, OUTPUT);
  pinMode(A_, OUTPUT); pinMode(B_, OUTPUT);

    switch(stepperPhase) {
    case 0:
    digitalWrite(A,  HIGH);
    digitalWrite(B,  LOW);
    digitalWrite(A_, LOW);
    digitalWrite(B_, LOW);
    break;

    case 1:
    digitalWrite(A,  LOW);
    digitalWrite(B,  HIGH);
    digitalWrite(A_, LOW);
    digitalWrite(B_, LOW);
    break;

    case 2:
    digitalWrite(A,  LOW);
    digitalWrite(B,  LOW);
    digitalWrite(A_, HIGH);
    digitalWrite(B_, LOW);
    break;

    case 3:
    digitalWrite(A,  LOW);
    digitalWrite(B,  LOW);
    digitalWrite(A_, LOW);
    digitalWrite(B_, HIGH);
    break;
    }
    nextPhase();  

  }

float spd=0;
int unsignedSpeed;
static unsigned long tCmd = 0, tSens = 0, tStp = 0;

void fetchAndRunCommands() {
  unsigned long now = millis();

  String resp;
  String path = String("/api/arduino/commands?mac=") + MAC_STR;
  if (!httpRequest("GET", path, "", resp)) {
    Serial.println("❌ GET commands failed");
    return;
  }
  if(now - tStp > spd)
  {
    tStp = now;
    updateStepper();
  }

  if (resp.length() == 0) return;

  StaticJsonDocument<768> doc;
  DeserializationError err = deserializeJson(doc, resp);
  if (err) {
    Serial.println("❌ JSON parse error (commands)");
    return;
  }

  if (!(doc["success"] | false)) return;

  JsonArray cmds = doc["commands"].as<JsonArray>();
  for (JsonObject cmd : cmds) {
    const char* action = cmd["action"] | "";
    if (strcmp(action, "digitalWrite") == 0) {
      handleDigitalWrite(cmd);
    } else if (strcmp(action, "stepper") == 0) {
      handleStepper(cmd);
    }
  }
}

void setup() {
  Serial.begin(9600);
  Ethernet.init(53); // CS روی Mega = 53
  Ethernet.begin(macHW, ip, gw, gw);
  delay(1000);

  Serial.print("آی‌پی آردوینو: ");
  Serial.println(Ethernet.localIP());

  setupPins();
}

void loop() {
  unsigned long now = millis();

  if(speed >= 0) unsignedSpeed = speed;
  else unsignedSpeed = speed * -1;
  spd = 530 - (unsignedSpeed*50);

  // هر 2 ثانیه: دریافت فرمان
  if (now - tCmd > 2000) {
    tCmd = now;
    fetchAndRunCommands();
  }

  // هر 10 ثانیه: ارسال داده تستی
  if (now - tSens > 3010) {
    tSens = now;
    postSensorDHT();
  }

  if(now - tStp > spd)
  {
    tStp = now;
    updateStepper();
  }

}
