# Notifications App

<p>
  <img alt="GitHub language count" src="https://img.shields.io/github/languages/count/leandrolid/notifications-app?color=6E40C9&style=flat-square">
  <img alt="GitHub Top Language" src="https://img.shields.io/github/languages/top/leandrolid/notifications-app?color=6E40C9&style=flat-square">
  <a href="https://github.com/leandrolid/notifications-app/commits/main">
    <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/leandrolid/notifications-app?color=6E40C9&style=flat-square">
  </a>
</p>

## Description

This repository contains a NestJS project designed to handle sending and listing regular notifications and push notifications using Bull for efficient queue processing. The project provides a scalable and reliable solution for managing notifications in modern web applications.

## Features

- **Notification Queue Management:** Utilizes Bull for efficient processing of notification tasks.
- **Regular Notifications:** Sends notifications through various channels such as email, SMS, or in-app notifications.
- **Push Notifications:** Supports push notifications
- **Notification Listing:** Provides endpoints for listing notification history and status.
- **Scalable Architecture:** Built on NestJS for scalability and maintainability.
- **Modular Design:** Follows NestJS best practices for modular components.
- **Error Handling and Logging:** Implements robust error handling mechanisms and integrates logging for debugging.
- **Documentation:** Includes comprehensive documentation for setup and usage.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
