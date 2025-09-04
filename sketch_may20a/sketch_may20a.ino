#include <SPI.h>
#include <Ethernet.h>
#include <DHT.h>
#include <AccelStepper.h>

// ================== تنظیمات شبکه ==================
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED }; // MAC خودت رو بزار
IPAddress ip(192, 168, 1, 50); // IP خودت رو بزار
EthernetServer server(80);

// ================== تنظیمات DHT11 ==================
#define DHTPIN 6
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ================== استپر موتور ==================
AccelStepper stepper(AccelStepper::FULL4WIRE, 2, 3, 4, 5); // A=2, B=3, ~A=4, ~B=5

// ================== پین‌ها ==================
int lightPin = 7;
int relayPin = 8;
int buzzerPin = 9;

void setup() {
  Serial.begin(9600);

  Ethernet.begin(mac, ip);
  server.begin();
  Serial.print("Server is at ");
  Serial.println(Ethernet.localIP());

  pinMode(lightPin, OUTPUT);
  pinMode(relayPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);

  dht.begin();
  stepper.setMaxSpeed(1000);
  stepper.setAcceleration(200);
}

void loop() {
  EthernetClient client = server.available();
  if (client) {
    String req = client.readStringUntil('\r');
    client.flush();

    // پارس درخواست
    if (req.indexOf("GET /device?") != -1) {
      String query = req.substring(req.indexOf('?') + 1, req.indexOf(' ', req.indexOf('?')));
      handleDeviceRequest(query, client);
    } else {
      // پاسخ پیش‌فرض
      client.println("HTTP/1.1 200 OK");
      client.println("Content-Type: text/plain");
      client.println("Connection: close");
      client.println();
      client.println("Smart Home Arduino Ready");
    }
    delay(1);
    client.stop();
  }

  // حرکت استپر
  stepper.run();
}

void handleDeviceRequest(String query, EthernetClient &client) {
  String type = getParam(query, "type");
  String action = getParam(query, "action");

  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: application/json");
  client.println("Connection: close");
  client.println();

  if (type == "light") {
    digitalWrite(lightPin, (action == "on") ? HIGH : LOW);
    client.print("{\"status\":\"ok\",\"light\":\"");
    client.print(action);
    client.print("\"}");
  } else if (type == "relay") {
    digitalWrite(relayPin, (action == "on") ? HIGH : LOW);
    client.print("{\"status\":\"ok\",\"relay\":\"");
    client.print(action);
    client.print("\"}");
  } else if (type == "buzzer") {
    digitalWrite(buzzerPin, (action == "on") ? HIGH : LOW);
    client.print("{\"status\":\"ok\",\"buzzer\":\"");
    client.print(action);
    client.print("\"}");
  } else if (type == "stepper") {
    if (action == "on") {
      int speed = getParam(query, "speed").toInt();
      String dir = getParam(query, "dir");
      stepper.setSpeed((dir == "CCW") ? -speed : speed);
    } else if (action == "off") {
      stepper.setSpeed(0);
    }
    client.print("{\"status\":\"ok\",\"stepper\":\"");
    client.print(action);
    client.print("\"}");
  } else if (type == "dht11") {
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    client.print("{\"temperature\":");
    client.print(t);
    client.print(",\"humidity\":");
    client.print(h);
    client.print("}");
  } else {
    client.print("{\"error\":\"Unknown type\"}");
  }
}

String getParam(String query, String name) {
  int idx = query.indexOf(name + "=");
  if (idx == -1) return "";
  int start = idx + name.length() + 1;
  int end = query.indexOf('&', start);
  if (end == -1) end = query.length();
  return query.substring(start, end);
}
