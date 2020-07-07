# Project2

Express/Mongo server application (to be used as backend for module 3)

# API DOC

## Quick reference

| ROUTE                                     | HTTP METHOD | CONSUMES      | RETURNS     | DESCRIPTION                        |
| ----------------------------------------- | ----------- | ------------- | ----------- | ---------------------------------- |
| [/register](#register)                    | POST        | JSON          | OAuth Token | Creates and athenticate the user   |
| [/login](#login)                          | POST        | JSON          | OAuth Token | Logs user in                       |
| [/refresh](#/refresh)                     | GET         | JSON          | OAuth Token | Refreshes user Token               |
| [/authorize](#authorize)                  | GET         | Bearer        | StatusCode  | Checks if user is still authorized |  
| [/updatePassword](#updatePassword)        | PUT         | Bearer & JSON | StatusCode  | Updates user password              |
| [/getTicket](#getTicket)                  | POST        | Bearer & JSON | StatusCode  | Reserves ticket for user           |
| [/userInfo](#userInfo)                    | GET         | Bearer        | JSON        | Returns user profile               |
| [/userInfo](#userInfo)                    | PUT         | Bearer & JSON | StatusCode  | Updates user profile               |
| [/trains](#trains)                        | GET         | N/A           | JSON        | Returns all trains                 |
| [/routes](#routes)                        | GET         | N/A           | JSON        | Returns JSON of available routes   |
| [/stations](#useruserId)                  | GET         | N/A           | JSON        | Returns list of Stations           |
| [/path/:fromto/:date](#/path/fromto/date) | GET         | Parameters    | JSON        | Returns route from station A to B  |


---

## Full Reference

---


## /register

### POST

### Headers

    - N/A

### Body

    {
        "email" : string,
        "password" : string,
        "firstName" : string,
        "lastName" : string,
        "trips" : Array[ Object{
                    "startStation" : string,
                    "destStation" : string,
                    "startTime" : Date,
                    "destTime" : Date} ]
    }

### Returns

    {
        "Bearer" : string,
        "user" : Object,
        "expiresIn" : int64
    }

#### [Back to top](#quick-reference)


---


## /login

### POST

### Headers

    - N/A

### Body

    {
        "email" : string,
        "password" : string
    }

### Returns

    {
        "Bearer" : string,
        "user" : Object,
        "expiresIn" : int64
    }

#### [Back to top](#quick-reference)


---


## /refresh

### GET

### Headers

    - N/A

### Body

    {
        "email" : string,
        "password" : string,
        "firstName" : string,
        "lastName" : string,
        "trips" : Array[ Object{
                    "startStation" : string,
                    "destStation" : string,
                    "startTime" : Date,
                    "destTime" : Date} ]
    }

### Returns

    {
        "Bearer" : string,
        "user" : Object,
        "expiresIn" : int64
    }

#### [Back to top](#quick-reference)


---


## /authorize

### GET

### Headers

    - "Bearer" : OAuth Token

### Body

    - N/A

### Returns

    - HTTP Status Code 200

#### [Back to top](#quick-reference)


---


## /updatePassword

### PUT

### Headers

    - "Bearer" : OAuth Token

### Body

    {
        "oldPassword" : string,
        "password" : string        
    }

### Returns

    - HTTP Status Code 200

#### [Back to top](#quick-reference)


---


## /getTicket

### POST

### Headers

    - "Bearer" : OAuth Token

### Body

    {   
        "startStation" : string,
        "destStation" : string,
        "startTime" : Date,
        "destTime" : Date
    }

### Returns

    - HTTP Status Code 200

#### [Back to top](#quick-reference)


---


## /userInfo

### GET

### Headers

    - "Bearer" : OAuth Token

### Body

    - N/A

### Returns

    {
        "email" : string,
        "password" : string,
        "firstName" : string,
        "lastName" : string,
        "trips" : Array[ Object{
                    "startStation" : string,
                    "destStation" : string,
                    "startTime" : Date,
                    "destTime" : Date} ]
    }

#### [Back to top](#quick-reference)


---


## /userInfo

### PUT

### Headers

    - "Bearer" : OAuth Token

### Body

    {
        "firstName" : string,
        "lastName" : string,
    }

### Returns

    - HTTP Status Code 200

#### [Back to top](#quick-reference)


---


## /trains

### GET

### Headers

    - N/A

### Body

    - N/A

### Returns

    {
        "trains" : Array[String]
    }

#### [Back to top](#quick-reference)


---


## /routes

### GET

### Headers

    - N/A

### Body

    - N/A

### Returns

    {
        "id" : int64,
        "startStation" : string,
        "destStation" : string,
        "trains" : Array[ string ],
        "trips" : Array[ Object{
                    "startStation" : string,
                    "destStation" : string,
                    "startTime" : Date,
                    "destTime" : Date} ]
    }

#### [Back to top](#quick-reference)


---


## /stations

### GET

### Headers

    - N/A

### Body

    - N/A

### Returns

    {
        "id" : int32,
        "abbreviation" : string,
        "fullname" : string,
        "timeToStation" : double,
        "routeBefore" : string
    }

#### [Back to top](#quick-reference)


---


## /path/:fromto/:date

### GET

### Headers

    - N/A

### Body

    - N/A

### Returns

    { 
        Array[ Object{
            "id" : int32,
            "routeID" : int64,
            "cost" : 100,
            "train" : string,
            "startStation" : string,
            "destStation" : string,
            "trips" : Array[ Object{
                            "startTime" : string, 
                            "destTime" : string} ]
        } ]
        
    }

#### [Back to top](#quick-reference)


---