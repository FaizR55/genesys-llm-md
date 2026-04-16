## About
Middleware to simplify api calling to personal llm. Support multi llm, header api key, chat history, redis to store chat history, and chat history to prompt for context.

## Project Structure
```
src/
├── app.module.ts                          ← ConfigModule + TypeORM + Redis + Chat
├── main.ts                                ← Global ValidationPipe
├── chat/
│   ├── chat.controller.ts                 ← POST /chat (guarded by ApiKeyGuard)
│   ├── chat.service.ts                    ← Full service flow
│   ├── chat.module.ts
│   └── dto/chat.dto.ts                    ← Validation + sanitization
├── conversation/
│   ├── conversation.entity.ts             ← TypeORM entity (uuid, enum role, index)
│   ├── conversation.service.ts            ← save/getHistory
│   └── conversation.module.ts
├── llm/
│   ├── llm.service.ts                     ← unified-llm library
│   └── llm.module.ts
├── redis/
│   ├── redis.service.ts                   ← ioredis with graceful fallback
│   └── redis.module.ts                    ← @Global()
├── common/
│   └── guards/api-key.guard.ts            ← x-api-key header validation
└── migrations/
    └── 1712678400000-CreateConversations.ts
data-source.ts                             ← TypeORM CLI data source
.env                                       ← All env vars
```
## Run the migration
```npm run migration:run```

## Start the server
```npm run start:dev```

## Payload example
```
POST http://localhost:3000/chat
Headers:
  x-api-key: your-secret-api-key-here
  Content-Type: application/json

Body:
{
  "message": "Hello, how are you?",
  "conversationId": "conv-123",
  "userId": "user-456"
}

Response:
{
  "reply": "I'm doing well, how can I help?",
  "success": true
}
```
