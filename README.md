# Inkspire — Real-time Collaborative Whiteboard

---

- **Frontend**: Next.js, HTML Canvas  
- **HTTP (Express)** for auth, room management, and fetching chat history.  
- **WebSocket (ws)** for real-time chat, drawing (`shape_add` / `undo` / `redo` / `move`) and live sync.  
- **Postgresql + Prisma** for persistence.

---

## Key features

- Email/password auth (JWT)  
- Create/join rooms (unique `slug`)  
- Persistent chat messages with soft-delete (`deleted`)  
- Real-time drawing sync (shape add/undo/redo/move) via WebSocket  
- Minimal in-memory connection state for socket rooms  

---

## Data model (summary)

- **User**: `id (uuid)`, `email (unique)`, `password`, `name`, `photo?`  
- **Room**: `id (int)`, `slug (unique)`, `createdAt`, `adminId -> User`  
- **Chat**: `id (int)`, `roomId -> Room`, `userId -> User`, `message`, `shapeId?`, `deleted`  

---

## Important endpoints (HTTP)

- `POST /signup` — create user  
- `POST /signin` — returns JWT  
- `POST /room` — create room (auth required)  
- `GET /chats/:roomId` — fetch room messages  
- `GET /room/:slug` — fetch room details  

---

## WebSocket events (client ↔ server)

- `join_room` / `leave_room` — manage in-memory membership  
- `chat` — save to DB and broadcast  
- `shape_add` — save shape metadata (chat row) and broadcast  
- `shape_undo` / `shape_redo` — soft-delete / undelete in DB and broadcast  
- `shape_move` — broadcast new position  

---