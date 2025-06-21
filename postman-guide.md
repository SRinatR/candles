# Инструкция для тестирования через Postman

## 1. Проверка отладочного API (без авторизации)

**GET запрос:**
```
URL: http://localhost:9002/api/debug-session
Method: GET
Headers: Content-Type: application/json
```

Этот запрос покажет текущую сессию (если есть) или null если не авторизован.

## 2. Тестирование API логов (требует авторизации)

**GET запрос:**
```
URL: http://localhost:9002/api/admin/logs
Method: GET
Headers: Content-Type: application/json
```

Если не авторизован, вернет 403 ошибку с сообщением "Доступ запрещен".

## 3. Авторизация через NextAuth (сложный способ)

NextAuth использует cookies и CSRF токены, поэтому прямая авторизация через Postman сложна.

### Альтернативный способ - через браузер:

1. Откройте http://localhost:9002/admin/dashboard
2. Войдите с учетными данными:
   - Email: `superadmin@askimcandles.com`
   - Пароль: `superadmin123`
3. Откройте Developer Tools (F12)
4. Перейдите в Network tab
5. Сделайте любой запрос к API
6. Скопируйте Cookie из заголовков запроса
7. Используйте этот Cookie в Postman

### Пример использования Cookie в Postman:

```
URL: http://localhost:9002/api/admin/logs
Method: GET
Headers: 
  Content-Type: application/json
  Cookie: next-auth.session-token=СКОПИРОВАННЫЙ_ТОКЕН
```

## 4. Простая проверка доступности API

**Проверка что сервер работает:**
```
URL: http://localhost:9002/api/debug-session
Method: GET
```

Ожидаемый ответ:
```json
{
  "session": null,
  "user": null,
  "hasSession": false,
  "userRole": undefined,
  "userType": undefined,
  "isPredefined": undefined
}
```

## 5. Проверка защищенного API без авторизации

```
URL: http://localhost:9002/api/admin/logs
Method: GET
```

Ожидаемый ответ:
```json
{
  "error": "Доступ запрещен"
}
```
Статус: 403

## Рекомендация

Для полноценного тестирования лучше использовать браузер:
1. Войти в админку: http://localhost:9002/admin/dashboard
2. Перейти на страницу логов: http://localhost:9002/admin/logs
3. Если видите "Access Denied", значит проблема в передаче роли в сессию