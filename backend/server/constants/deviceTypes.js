module.exports = [
    {
      deviceType: "light",
      pinNames: ["signal"]
    },  
    {
      deviceType: "buzzer",
      pinNames: ["signal"]
    },
    {
      deviceType: "DHT11",
      fixedPin: 7
    },
    {
      deviceType: "stepper",
      pinNames: ["A", "B", "~A", "~B"]
    },
    {
      deviceType: "relay",
      pinNames: ["RLNo", "RLCOM", "RLNC", "RL"]
    }
  ];
  