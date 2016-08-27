#Серверная часть супер проекта pepo

[![Build Status](https://travis-ci.org/volchata/pepo_server.svg?branch=travis)](https://travis-ci.org/volchata/pepo_server)

1. [Установка и настройка](#Установка-и-настройка)
1. [Формат объектов](#Формат-объектов)
1. [Аутентификация](#Аутентификация)
1. [Учётные записи](#Учётные-записи)
1. [Твиты](#Твиты)


##Установка и настройка

Для работы сервера необходима база данных [MongoDB](https://www.mongodb.com/download-center?jmp=docs&_ga=1.87217368.1371980347.1467984456).

Её необходимо скачать и запустить с параметрами по умолчанию.

После этого нужно склонировать репозиторий проекта:


    git clone https://github.com/volchata/pepo_server.git

И в папке проекта (pepo_server) выполнить команды установки необходимых модулей и запуска сервера

    npm install
    npm start


##Описание REST API pepo-сервиса


### Формат объектов

#### Твит
	{
	    "id": 133, 		// идентификатор твита
	    "author": 17,	// идентификатор автора
	    "content": "tweet text ok ok ok ok. hello",		// содержание
	    "timestamp": "2016-12-12 10:45:33",			// дата создания
		"like": // true - пользователь поставил like
	    "extras": {
		        "parent": { twitObj },		// если это ретвит, то это его "родительский" твит
		        "source": { twitObj },		// если это коментарий, то его "исходный" твит
				"likes": [{ userObj }],
		        "image": "http://cool-image.ru/1.jpg",	// если в твите картинка, то ссылка на неё
		        "url": null,			// ???
		        "geo": null,			// гео-метка
				"comments": [ { twitObj2 }, { twitObj1 } ]
		}
	}

#### Учётная запись пользователя

	{
		"id": 17,
		"login": "iivan",
		"firstName": "Ivan",
		"lastName": "Ivanov",
		"photo": "http://cool-image.ru/2.jpg",
		"folowers": 17,
		"friends": 3
	}

----------

### Начальная страница

>GET  /

1. Если пользователь аутентифицирован,
	1. Если в его записи в базе есть поле *login*, то перенаправление на интерфесную часть **/feed**
	1. Иначе на /signup
1. Иначе на /auth

----------

### Аутентификация

>GET  /auth/vk  
	GET  /auth/fb

* Точки входа для аутентификации через соответствующую службу.
	Интерфейс выполняет перенаправление на эти точки в зависимости от выбора пользователя.
	После выполнения процедуры аутентификации, пользователь перенаправляется на стартовую страницу.

----------

### Учётные записи

>GET  /api/user/

* Получение данных своего профиля аутентифицированного пользователя
	(ФИО, ссылку на аватарку, и т.д. См. *формат данных пользователя*)
	Коды ответов:
	* 200 --- в поле ответа передаётся JSON содержащий объект
		пользователя. content-type: application/json
	* 403 --- (здесь и далее):
		* пользователь не аутентифицирован, { "status":"Unauthenticated"} -> /auth/(vk|fb)
		* его аутентификационный маркер устарел { "status":"Unauthenticated"} -> /auth/(vk|fb)
		* регистрация не завершена  			{ "status":"PartialRegistration"} -> /signup
		* дополнительные причины в зависимости от вызванного api
		При получении ответа с данным кодом состояния, интерфейс должен
			выполнить переход на соответствующий адрес или показать уведомление


>POST /api/user/

* Выполнить регистрацию в системе или редактировать профиль.
	Тело ответа должно содержать JSON со следующими полями ( формат данных --- multipart/form-data ):
	* *login* (это поле должно быть только первый раз при регистрации, иначе оно игнорируется)
	* *firstName*, *lastName*
	* *photo*


* Ответы:
	* 200
	* 403
	* 409 --- ответ при попытке зарегистрировать пользователя с уже существующим логином.
		Пользователю необходимо выбрать другой логин.


>GET  /api/user/:login 	

- профиль пользователя (JSON с данными пользователя по login)
	- 200 --- в теле ответа JSON с объектом пользователя
	- 403
	- 404 --- если такой пользователь не обнаружен


>~~POST /api/user/:login~~

- ~~редактировать профиль пользователя (не уверен, что это нужно, работает только для самого себя)~~
	- ~~200~~
	- ~~403~~
	- ~~404~~


>GET  /api/user/:login/follower

- список фоловеров указанного пользователя, по умолчанию, первые 50. Параметры:
	- limit - количество для передачи,
	- offset - количество уже полученных
- Ответы
	- 200 --- в теле ответа JSON с массивом объектов пользователя
	- 403 --- (тут могут быть правила, например, только подписчик может увидеть список фоловеров)
	- 404


>GET  /api/user/:login/friends

- список на кого подписан указанный пользователь, по умолчанию, первые 50. Параметры:
	- limit - количество для передачи,
	- offset - количество уже полученных
- Ответы
	- 200 --- в теле ответа JSON с массивом объектов пользователя
	- 403 --- (тут могут быть правила, например, только подписчик может увидеть список фоловеров)
	- 404


>POST /api/user/:login/friends

- подписаться/отписаться на/от ленты пользователя
	- 200 --- (новое состояние, т.е. подписан или нет {friend: true})
	- 403
	- 404



----------

### Твиты


>GET  /api/user/:login/feed

- таймлайн --- получить наиболее новые твиты пользователя, параметры:
	- limit - количество (максимум 50, по умолчанию 10),
	- offset - timestamp самого **нового** полученного твита (передаются твиты новее указанного)
	- timeout - при наличии данного параметра, запрос считается long-poll запросом и
		удерживается пока не истечёт **timeout**(в милисекундах) или не наберётся **limit**
		твитов новее чем **offset**.

- Если пользователь не является подписчиком автора, то можно получить только 50 самых свежих твитов.
- При этом можно получить твиты свои или тех, кого аутентифицированный пользователь воловерит.
	- 200
	- 403 + при попытке получить чужой фид (того, кого не фоловерим) { "status":"NotFollowed",
		msg:"Для получения ленты пользователя необходимо стать его подписчиком"}
	- 404


>GET  /api/user/:login/feed/history

- точка входа для получения более старых твитов, параметры:
	- limit - максимальное количество твитов (максимум 50, по умолчанию 10),
	- offset - timestamp самого **старого** полученного твита (передаются твиты старее данного)
- без параметров ../feed и ../feed/history получат одинаковый набор твитов
- Если пользователь не является подписчиком автора, то можно получить только 50 самых свежих твитов.
- Ответы
	- 200
	- 403 + при попытке получить чужой фид (того, кого не фоловерим) { "status":"NotFollowed",
		msg:"Для получения ленты пользователя необходимо стать его подписчиком"}
	- 404


>POST /api/user/:login/feed

- твитнуть. При твите картинкой, данные должны быть multipart/form-data

	- 200
	- 403 + при попытке запостить на чужой фид { "status":"NotFollowed",
		msg:"Данная операция не позволяется"}
	- 404


>GET  /api/tweet/:id

- получить твит по его id

	- 200 --- JSON обект твит
	- 403
	- 404


>POST /api/tweet/:id

- комментить твит. Отправляется JSON с объектом твитом.

	- 200
	- 403
	- 404


>POST /api/tweet/:id/retweet

- ретвитнуть твит

	- 200
	- 403
	- 404


>POST /api/tweet/:id/like

- like твит, параметры: 
	- like=true -- поставить like. JSON {like: true, likes: количество лайков}
	- без параметров -- убрать like(если был лайкнут этим пользователем). JSON {like: false, likes: количество лайков}

- 200
- 403
- 404
