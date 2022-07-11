<h2>Qust - messenger<h2>

<br><hr><br>

<h3>Stack:<h3>
<h5>NestJS - Node.js framework<h5>
<h5>Typescript<h5>
<h5>PostgreSQL - основная база данных<h5>
<h5>Redis - для хранения refresh токенов<h5>



<h3>Немного о приложении<h3>
<p>Qust - мессенджер, повторяющий многие функции популярного приложения Discord:<p>

* Списки друзей
* Статусы пользователей (онлайн/оффлайн/невидимка)
* ЛС, чаты
* Метки "не прочитаное сообщение"
* Группы (в клиенте Discord - серверы, в Discord API - guilds)
* Категории и текстовые каналы в группах
* Пользовательские роли в группах
* Гибкая настройка разрешений ролей (например, может ли пользователь писать в определённый текстовый канал или редактировать каналы/роли, может ли создавать приглашения в группу и т. д.)
* Журнал аудита группы
* Упоминания пользователей

<p>Будет добавлено в будушем:<p>

* Упоминания ролей
* Public API для разработчиков
* "Мьют" текстовых каналов и чатов
* Авторизация с подтверждением почты
* Кэширование
* Статические файлы - аватарки пользователей, групп, прикреплённые к сообщениям файлы
* Документация



<h3>Совсем немного об архитектурных решениях (будет дополняться)<h3>

<p>На многие действия в приложении, такие как написание сообщения в текстовый канал или обновление названия группы (группа в моём проекте - эквивалент "серверу" в Discord), генерируются соответствующие внутренние ивенты (за исключением очевидных WebSocket ивентов, отправляемых клиентам). Благодаря этому модули могут удобно передавать данные между собой. Например, при изменении названия текстового канала TextChannelsService генерирует ивент об изменении и передаёт в сообщение ивента нужные данные - в данном случае объект TextChannel (в приложении используется ORM). TextChannelsGateway подхватывает ивент и передаёт новое имя канала всем пользователям, которые подключены к комнате "group:*ID группы*" (т. к. именно эти пользователи в данный момент просматривают названия каналов этой группы). Также, GroupAuditLogger подхватывает ивент и записывает в журнал аудита соответствующую строчку об изменении.<p>
