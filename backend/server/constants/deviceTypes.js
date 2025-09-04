module.exports = [
    {
      deviceType: "light",
      pinNames: ["signal"]
    },
    {
      deviceType: "lm35",
      pinNames: ["out"]
    },  
    {
      deviceType: "buzzer",
      pinNames: ["signal"]
    },
    {
      deviceType: "DHT11",
      pinNames: ["out"]
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
  