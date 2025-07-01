# Desky Auth Backend

This project is a serverless authentication backend built with TypeScript, AWS Lambda, and DynamoDB, managed via the Serverless Framework.

## Features

- User registration with email verification
- User login
- JWT-based authentication
- DynamoDB for user storage
- AWS SES for sending emails

## Project Structure

```
.
├── src/
│   ├── index.ts
│   ├── clients/
│   ├── handlers/
│   │   └── auth/
│   │       ├── register.ts
│   │       └── login.ts
│   ├── middleware/
│   ├── models/
│   ├── services/
│   └── utils/
├── serverless.yml
├── package.json
├── tsconfig.json
├── .env
└── ...
```

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- [pnpm](https://pnpm.io/) (or npm/yarn)
- AWS CLI configured with appropriate credentials
- Serverless Framework (`npm install -g serverless`)

### Installation

1. Install dependencies:

    ```sh
    pnpm install
    ```

2. Copy `.env.example` to `.env` and fill in required environment variables.

### Development

- TypeScript source is in [`src/`](src).
- Handlers for AWS Lambda are in [`src/handlers/`](src/handlers/).

### Build

```sh
pnpm build
```

### Deploy

```sh
serverless deploy
```

### Test

```sh
pnpm test
```

## Serverless Functions

Defined in [`serverless.yml`](serverless.yml):

- **POST /register**: User registration ([`src/handlers/auth/register.ts`](src/handlers/auth/register.ts))
- **POST /login**: User login ([`src/handlers/auth/login.ts`](src/handlers/auth/login.ts))

## Environment Variables

See `.env.example` for required variables.

## License

MIT