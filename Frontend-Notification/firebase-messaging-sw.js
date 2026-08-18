importScripts(
  'https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js',
);

importScripts(
  'https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js',
);

const firebaseConfig = {
  apiKey: 'AIzaSyDy9oibM5wYmsqsw9TOiChV9VMbM2OCM2U',
  authDomain: 'e-commerce-notification-8c75b.firebaseapp.com',
  projectId: 'e-commerce-notification-8c75b',
  storageBucket: 'e-commerce-notification-8c75b.firebasestorage.app',
  messagingSenderId: '524851058495',
  appId: '1:524851058495:web:0333c3c2eee6dc0f96658a',
  measurementId: 'G-8KC05V07J5',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();
