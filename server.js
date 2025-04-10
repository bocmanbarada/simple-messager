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
const cors = require('cors');
app.use(cors({
  origin: ["https://bocmanbarada.ru", "https://messenger.bocmanbarada.ru"]
}));

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
  'mailto:x9037758413@gmail.com', // Контактная почта
  process.env.PUBLIC_KEY, // Из переменных среды
  process.env.PRIVATE_KEY
);

// Middleware для работы с JSON
app.use(express.json());

// 2. Хранилище подписок (в реальном проекте используйте БД)
const subscriptions = [];

// 3. Роут для сохранения подписки
app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  
  // Проверка подписки
  if (!subscription) {
    return res.status(400).json({ error: 'Subscription is required' });
  }

  subscriptions.push(subscription); // Сохраняем подписку
  console.log('Новая подписка:', subscription);
  res.status(201).json({ message: 'Подписка сохранена' });
});

// 4. Роут для отправки уведомления
app.get('/send-notification', (req, res) => {
  if (subscriptions.length === 0) {
    return res.status(400).json({ error: 'Нет активных подписок' });
  }

  // Отправляем уведомление всем подписчикам
  subscriptions.forEach(sub => {
    webpush.sendNotification(sub, JSON.stringify({
      title: 'Новое сообщение!',
      body: `${message.user}: ${message.text}`,
      icon: 'https://messenger.bocmanbarada.ru/assets/icons/icon-192x192.png'
    })).catch(err => console.error('Ошибка отправки:', err));
  });

  res.json({ message: 'Уведомления отправлены' });
});

// Старт сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
