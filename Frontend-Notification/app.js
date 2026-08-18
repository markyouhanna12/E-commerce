import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import {
  getMessaging,
  getToken,
  onMessage,
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDy9oibM5wYmsqsw9TOiChV9VMbM2OCM2U',
  authDomain: 'e-commerce-notification-8c75b.firebaseapp.com',
  projectId: 'e-commerce-notification-8c75b',
  storageBucket: 'e-commerce-notification-8c75b.firebasestorage.app',
  messagingSenderId: '524851058495',
  appId: '1:524851058495:web:0333c3c2eee6dc0f96658a',
  measurementId: 'G-8KC05V07J5',
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const enableButton = document.getElementById('enableNotifications');

const tokenElement = document.getElementById('token');

const statusElement = document.getElementById('status');

enableButton.addEventListener('click', async () => {
  try {
    statusElement.textContent = 'Requesting notification permission...';

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      statusElement.textContent = 'Notification permission was denied.';

      return;
    }

    statusElement.textContent = 'Getting FCM token...';

    const token = await getToken(messaging, {
      vapidKey:
        'BG5JM5SCk0lcWc3WOr0NWkWAbZ3dh0A-LQAVPOfdLushE-XdR5vwpYwbi_LCvdtr0L-IV-v7hjM4o7trz0c9N60',
    });

    if (!token) {
      statusElement.textContent = 'FCM token was not generated.';

      return;
    }

    console.log('FCM Token:', token);

    tokenElement.value = token;

    statusElement.textContent = 'FCM token generated successfully.';

    // ======================================
    // Register token with NestJS
    // ======================================

    await registerDevice(token);
  } catch (error) {
    console.error(error);

    statusElement.textContent = `Error: ${error.message}`;
  }
});

// ==========================================
// Register Device
// ==========================================

async function registerDevice(token) {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    statusElement.textContent =
      'FCM token generated, but no access token was found.';

    return;
  }

  const response = await fetch(
    'http://localhost:3000/notification/register-device',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',

        Authorization: `USER ${accessToken}`,
      },

      body: JSON.stringify({
        token,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || data?.message || 'Failed to register device',
    );
  }

  statusElement.textContent =
    'FCM token generated and registered successfully!';

  console.log('Device registration:', data);
}

// ==========================================
// Foreground Messages
// ==========================================

onMessage(messaging, (payload) => {
  console.log('Foreground notification:', payload);

  alert(
    `${payload.notification?.title || 'Notification'}\n\n` +
      `${payload.notification?.body || ''}`,
  );
});
