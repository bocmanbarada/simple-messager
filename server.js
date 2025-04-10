const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["https://bocmanbarada.ru", "https://messenger.bocmanbarada.ru"], // Разрешить все домены (замените на ваш домен Tilda в продакшене)
    methods: ["GET", "POST"]
  }
});

// Раздача статики (если нужно)
app.use(express.static(path.join(__dirname, 'public')));

// Хранилище сообщений
const messages = [];

// Socket.io логика
io.on('connection', (socket) => {
  socket.emit('message history', messages);

  socket.on('send message', (msg) => {
    const message = {
      id: Date.now(),
      text: msg.text,
      user: msg.user || 'Аноним',
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow'})
    };
    messages.push(message);
    io.emit('new message', message);

    // Отправляем событие для уведомления всем, кроме отправителя
    socket.broadcast.emit('notification', {
      title: 'Новое сообщение',
      body: `${message.user}: ${message.text}`,
      icon: 'https://messenger.bocmanbarada.ru/assets/icons/icon-512x512.png' // Замените на реальный URL иконки
    });
  });
});

const webpush = require('web-push');

// Установка VAPID-ключей
webpush.setVapidDetails(
  'mailto: <x9037758413@gmail.com>', // Контактная почта
  process.env.PUBLIC_KEY, // Из переменных среды
  process.env.PRIVATE_KEY
);

// Отправка уведомления
// webpush.sendNotification(subscription, 'Новое сообщение в чате!');
webpush.sendNotification(subscription, {
  title: 'Новое сообщение',
  body: `${message.user}: ${message.text}`,
  icon: 'https://messenger.bocmanbarada.ru/assets/icons/icon-192x192.png' // Замените на реальный URL иконки
});

// Старт сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
