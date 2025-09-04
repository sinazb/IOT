document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const deviceList = document.getElementById('deviceList');
  const popupOverlay = document.getElementById('popupOverlay');
  const deviceTypeSelect = document.getElementById('deviceType');
  const pinFieldsContainer = document.getElementById('pinFields');
  const deviceForm = document.getElementById('deviceForm');
  const addDeviceBtn = document.getElementById('addDeviceBtn');

  let deviceTypeMap = {};
  window.deviceMapByMac = {}; // ⬅ تعریف سراسری برای WebSocket

  addDeviceBtn.addEventListener('click', async () => {
    await fetchDeviceTypes();
    popupOverlay.classList.remove('hidden');
  });

  function closePopup() {
    popupOverlay.classList.add('hidden');
    deviceForm.reset();
    pinFieldsContainer.innerHTML = '';
    deviceTypeSelect.dispatchEvent(new Event('change'));
  }

  window.closePopup = closePopup;

  async function fetchDeviceTypes() {
    try {
      const res = await fetch('/api/device-types');
      const data = await res.json();
      deviceTypeMap = {};
      deviceTypeSelect.innerHTML = '';
      data.deviceTypes.forEach((type) => {
        const filteredPins = type.pinNames;
        deviceTypeMap[type.deviceType] = filteredPins;
        const option = document.createElement('option');
        option.value = type.deviceType;
        option.textContent = type.deviceType;
        deviceTypeSelect.appendChild(option);
      });
      deviceTypeSelect.dispatchEvent(new Event('change'));
    } catch (err) {
      console.error(err);
      alert('خطا در دریافت نوع دستگاه‌ها');
    }
  }

  deviceTypeSelect.addEventListener('change', () => {
    const selected = deviceTypeSelect.value;
    const pinNames = deviceTypeMap[selected] || [];
    pinFieldsContainer.innerHTML = '';
    pinNames.forEach(pinName => {
      const label = document.createElement('label');
      label.textContent = `پین ${pinName}:`;
      label.classList.add('block', 'mt-2', 'font-medium');

      const input = document.createElement('input');
      input.type = 'text';
      input.name = pinName;
      input.required = true;
      input.classList.add('w-full', 'border', 'rounded', 'px-3', 'py-2');

      pinFieldsContainer.appendChild(label);
      pinFieldsContainer.appendChild(input);
    });
  });

  async function fetchDevices() {
    try {
      const res = await fetch('/api/devices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      deviceList.innerHTML = '';
      deviceMapByMac = {};

      data.devices.forEach(device => {
        deviceMapByMac[device.mac] = device;

        const card = document.createElement('div');
        card.className = 'bg-white p-5 rounded-lg shadow border flex flex-col space-y-3 transition hover:shadow-lg';

        const titleHTML = `
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">${device.name}</h3>
              <p class="text-sm text-gray-500">${device.deviceType}</p>
            </div>
            <div class="flex items-center text-xs text-green-600">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-1"></span>فعال
            </div>
          </div>
        `;

        const pinsText = device.pins.map(p => `${p.name}: ${p.pin}`).join(', ');
        const pinsHTML = `<div class="text-sm text-gray-700"><strong>پین‌ها:</strong> ${pinsText}</div>`;

        let controlsHTML = '';

        switch (device.deviceType.toUpperCase()) {
          case 'LIGHT':
          case 'BUZZER':
          case 'RELAY':
            controlsHTML = `
              <div class="flex space-x-2">
                <button class="bg-green-500 text-white px-4 py-1 rounded" onclick="sendCommand('${device.mac}', ${device.pins[0].pin}, 1)">روشن</button>
                <button class="bg-gray-500 text-white px-4 py-1 rounded" onclick="sendCommand('${device.mac}', ${device.pins[0].pin}, 0)">خاموش</button>
              </div>
            `;
            break;

          case 'LM35':
            controlsHTML = `
              <div class="text-sm text-blue-700">
                <strong>دما:</strong> <span id="temp-${device._id}">--</span>°C
              </div>
            `;
            break;

          case 'DHT11':
            controlsHTML = `
              <div class="text-sm text-blue-700">
                <strong>دما:</strong> <span id="temp-${device._id}">--</span>°C<br />
                <strong>رطوبت:</strong> <span id="hum-${device._id}">--</span>%
              </div>
            `;
            break;

          case 'STEPPER':
            const [A, B, A_, B_] = device.pins.map(p => p.pin);
            controlsHTML = `
              <div class="flex flex-col space-y-2">
                <div class="flex items-center space-x-2">
                  <button onclick="controlStepper('${device.mac}', ${A}, ${B}, ${A_}, ${B_}, 1)" class="bg-green-500 text-white px-3 py-1 rounded">+</button>
                  <button onclick="controlStepper('${device.mac}', ${A}, ${B}, ${A_}, ${B_}, -1)" class="bg-red-500 text-white px-3 py-1 rounded">-</button>
                </div>
                <div class="text-xs text-gray-500">با استفاده از دکمه‌های بالا جهت/سرعت تغییر می‌کند</div>
              </div>
            `;
            break;
        }

        const deleteButton = `
          <button class="delete-btn bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600 self-end" data-id="${device._id}">
            حذف
          </button>
        `;

        card.innerHTML = titleHTML + pinsHTML + controlsHTML + deleteButton;

        card.querySelector('.delete-btn').addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          if (confirm('آیا از حذف این دستگاه مطمئن هستید؟')) {
            await deleteDevice(id);
            fetchDevices();
          }
        });

        deviceList.appendChild(card);
      });
    } catch {
      alert('خطا در دریافت لیست دستگاه‌ها');
    }
  }

  async function deleteDevice(id) {
    try {
      const res = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'خطا در حذف دستگاه');
      }
    } catch (err) {
      alert('خطا در ارتباط با سرور هنگام حذف');
    }
  }

  deviceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const deviceType = deviceTypeSelect.value;
    const name = document.getElementById('deviceName').value;
    const inputs = pinFieldsContainer.querySelectorAll('input');
    const pins = Array.from(inputs).map(input => ({
      name: input.name,
      pin: input.value,
    }));

    try {
      const res = await fetch('/api/devices/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceType, name, pins }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('دستگاه با موفقیت اضافه شد.');
        closePopup();
        fetchDevices();
      } else {
        alert(data.message || 'خطا در ثبت دستگاه');
      }
    } catch (err) {
      alert('خطا در ارتباط با سرور');
    }
  });

  fetchDevices();
});

// خروج از حساب
function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}

// اتصال WebSocket
const socket = io();

socket.on('sensor-data', ({ mac, type, data }) => {
  const device = deviceMapByMac[mac];
  if (!device) return;

  switch (type.toUpperCase()) {
    case 'LM35':
      const tempEl = document.getElementById(`temp-${device._id}`);
      if (tempEl) tempEl.textContent = data.temperature;
      break;

    case 'DHT11':
      const tempElDHT = document.getElementById(`temp-${device._id}`);
      const humElDHT = document.getElementById(`hum-${device._id}`);
      if (tempElDHT) tempElDHT.textContent = data.temperature;
      if (humElDHT) humElDHT.textContent = data.humidity;
      break;
  }
});

// کنترل دستگاه‌های دیجیتال
function sendCommand(mac, pin, value) {
  fetch('/api/arduino/send-command', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mac,
      command: {
        action: 'digitalWrite',
        pin,
        value
      }
    })
  }).then(res => res.json())
    .then(data => {
      if (!data.success) {
        alert(data.message || 'خطا در ارسال فرمان');
      }
    }).catch(() => {
      alert('❌ خطا در ارتباط با سرور');
    });
}

// کنترل استپر موتور
function controlStepper(mac, A, B, A_, B_, direction) {
  fetch('/api/arduino/send-command', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mac,
      command: {
        action: 'stepper',
        pins: { A, B, A_, B_ },
        direction
      }
    })
  }).then(res => res.json())
    .then(data => {
      if (!data.success) {
        alert(data.message || 'خطا در ارسال فرمان به استپر');
      }
    }).catch(() => {
      alert('❌ ارتباط با سرور قطع شده');
    });
}
