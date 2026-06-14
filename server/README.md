# 🚀 Інструкція з розгортання Node.js сервера на VPS

Ця інструкція допоможе вам перенести backend Comfort Plus з Supabase на власний віртуальний сервер (VPS) під управлінням Ubuntu/Debian.

---

## 📋 Крок 1: Встановлення Node.js на VPS

Підключіться до VPS через SSH та виконайте наступні команди:

```bash
# Оновлення списку пакетів
sudo apt update && sudo apt upgrade -y

# Встановлення Node.js (версія 20+) та npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Перевірка встановлення
node -v
npm -v
```

---

## 🛠 Крок 2: Завантаження коду сервера та встановлення залежностей

Створіть робочу директорію на VPS та перенесіть туди папку `server/` з вашого проекту (через SFTP/SCP або клонувавши Git-репозиторій):

```bash
# Перейдіть у директорію сервера
cd /path/to/comfort-plus/server

# Встановлення пакетів (включаючи SQLite3)
npm install
```

---

## 🛡 Крок 3: Налаштування фонового запуску (PM2)

Щоб сервер не вимикався після закриття консолі SSH, використовуйте PM2:

```bash
# Глобальне встановлення PM2
sudo npm install -y pm2 -g

# Запуск сервера через конфіг pm2.config.js
pm2 start pm2.config.js

# Збереження списку процесів для автозапуску після ребуту VPS
pm2 save
pm2 startup
```

Корисні команди PM2:
* `pm2 status` — перевірка статусу процесів
* `pm2 logs` — перегляд логів сервера у реальному часі
* `pm2 restart comfort-plus-backend` — перезапуск сервера

---

## 🌐 Крок 4: Налаштування Nginx (Reverse Proxy) та SSL (HTTPS)

Для доступу до API з браузера через безпечне з'єднання (HTTPS) налаштуємо проксі через Nginx.

```bash
# Встановлення Nginx
sudo apt install nginx -y

# Створення файлу конфігурації
sudo nano /etc/nginx/sites-available/comfortplus
```

Вставте наступний шаблон (замініть `api.yourdomain.com` або IP вашого VPS):

```nginx
server {
    listen 80;
    server_name api.yourdomain.com; # Введіть ваш домен або IP-адресу VPS

    location / {
        proxy_pass http://localhost:5000; # Наш Express-сервер
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активуйте конфігурацію та перезапустіть Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/comfortplus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 🔒 Отримання безкоштовного SSL сертифікату (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

---

## 🤖 Крок 5: Реєстрація Webhook для Telegram-бота

Щоб повідомлення з Telegram приходили на ваш новий сервер, зареєструйте webhook. Зробіть GET-запит через браузер або curl:

```bash
curl "https://api.telegram.org/bot8615069227:AAEiCjdj66e469JqarZxWSlfzFQs1jGkr4M/setWebhook?url=https://api.yourdomain.com/api/telegram/webhook"
```
*(Замініть `api.yourdomain.com` на реальний домен вашого VPS, який отримав SSL-сертифікат).*

Ви повинні отримати відповідь:
`{"ok":true,"result":true,"description":"Webhook was set"}`

---

## 📁 Крок 6: Резервне копіювання бази даних
Вся база даних зберігається в одному файлі `server/comfort_plus.db`. Для резервного копіювання достатньо періодично копіювати цей файл у безпечне місце.
