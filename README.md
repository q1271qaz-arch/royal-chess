# Royal Chess

Веб-игра шахматы на Flask:

- регистрация и авторизация;
- личный кабинет;
- шахматы против бота;
- 5 уровней сложности;
- сохранение партий в базе;
- рейтинг игроков;
- таблица лидеров;
- приглашения другим игрокам;
- базовая заготовка Socket.IO для онлайн-игры;
- SQLite локально;
- PostgreSQL на Railway.

## 1. Запуск в VS Code

Откройте папку проекта в VS Code.

### Создание виртуального окружения

```powershell
python -m venv venv
```

### Активация

```powershell
venv\Scripts\activate
```

### Установка библиотек

```powershell
pip install -r requirements.txt
```

### Создание `.env`

Скопируйте `.env.example` и назовите копию `.env`.

Пример:

```env
SECRET_KEY=my-very-secret-key
DATABASE_URL=sqlite:///chess.db
STOCKFISH_PATH=
```

### Запуск

```powershell
python app.py
```

Откройте:

```text
http://127.0.0.1:5000
```

## 2. Умный бот Stockfish

Без Stockfish бот работает и делает случайные допустимые ходы.

Для настоящего сильного бота:

1. Установите Stockfish.
2. Найдите путь к `stockfish.exe`.
3. Добавьте путь в `.env`.

Пример:

```env
STOCKFISH_PATH=C:\stockfish\stockfish-windows-x86-64.exe
```

## 3. GitHub

В терминале VS Code:

```powershell
git init
git add .
git commit -m "Создан проект онлайн-шахмат"
git branch -M main
git remote add origin ВАША_ССЫЛКА_НА_REPOSITORY
git push -u origin main
```

## 4. Railway

1. Создайте новый проект Railway.
2. Подключите GitHub-репозиторий.
3. Добавьте PostgreSQL.
4. В Variables добавьте:

```text
SECRET_KEY=сложная_секретная_строка
```

Railway автоматически добавит `DATABASE_URL` от PostgreSQL.

5. Откройте Settings → Networking.
6. Нажмите Generate Domain.

Команда запуска уже находится в `Procfile`:

```text
web: gunicorn --worker-class eventlet -w 1 app:app
```

## 5. Что уже работает

- регистрация;
- вход и выход;
- статистика пользователя;
- рейтинг;
- партия против бота;
- 5 уровней;
- проверка допустимости ходов;
- автоматическое сохранение позиции;
- история партий;
- таблица лидеров;
- отправка приглашений.

## 6. Что подготовлено для следующего этапа

В проекте уже подключён Flask-SocketIO и созданы события:

- `join_game`;
- `online_move`;
- `opponent_move`.

Для полностью готовой онлайн-партии нужно добавить:

- принятие приглашения;
- создание партии на двух игроков;
- серверную проверку каждого онлайн-хода;
- страницу онлайн-доски;
- восстановление соединения;
- часы;
- ничью и сдачу;
- чат.
