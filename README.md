# SpotBlitz — Multiplayer Spotting Game

A real-time, 2-player competitive spotting game where a laptop acts as the host display, and mobile phones act as the controllers.

## Prerequisites
- Node.js (v18+)
- MySQL (v8+)

## Setup Instructions

### 1. Database
1. Open your MySQL client (e.g., MySQL Workbench or CLI).
2. Run the `database/schema.sql` script to create the `spotblitz` database and tables.
3. Run the `database/seed.sql` script to populate the `items` table.

### 2. Backend
1. Open a terminal in the `backend` folder.
2. Run `npm install`
3. Edit `backend/.env` and set your `DB_PASSWORD`.
4. Run `npm run dev` to start the backend on port `3001`.

### 3. Frontend (Laptop Display)
1. Open a terminal in the `frontend` folder.
2. Run `npm install`
3. Run `npm run dev`
4. The host display will run on `http://localhost:5173`.

### 4. Mobile (Controller)
1. Open a terminal in the `mobile` folder.
2. Run `npm install`
3. Run `npm run dev`
4. The mobile controller will run on `http://<your-local-ip>:5174`.

## How to Play
1. Open the **Host Display** on your laptop. A room code and QR code will be generated.
2. Players connect their phones to the same WiFi network.
3. Players scan the QR code to open the **Mobile Controller** (or manually go to the IP address and enter the room code).
4. Enter a name and join the room.
5. Press **Ready** on the phones.
6. The host will start the game. First to tap the correct item on their phone wins the round!
