# BiteSpeed Identity Reconciliation API

A production-ready Node.js & Express REST API for identity reconciliation, built with TypeScript and PostgreSQL (Prisma ORM).

## Setup Instructions

1. Clone the repository and navigate to the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your actual Postgres `DATABASE_URL`.

## Migration Steps

To initialize the database schema, run the Prisma migration:
```bash
npx prisma migrate dev --name init
```

This will generate the Prisma Client automatically and create the necessary `Contact` table with proper indices.

## Run Locally

1. Build the TypeScript code:
   ```bash
   npm run build
   ```
2. Start the development server using `ts-node`:
   ```bash
   npm run dev
   ```
   Or start the compiled production server:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:3000` (or the `PORT` specified in `.env`).

## Deployment Steps (Render)

1. Connect your GitHub repository to Render as a "Web Service".
2. Link your preferred PostgreSQL Database on Render.
3. Configure the Environment Variables:
   - Add `DATABASE_URL` pointing to your Render Postgres instance (e.g. Internal Database URL).
4. **Build Command**: 
   ```bash
   npm install && npm run build:render
   ```
5. **Start Command**: 
   ```bash
   npm start
   ```
6. Render will build and deploy your service, automatically running `npx prisma db push` to synchronize the database schema.

## Testing with Postman (Deployed API)

1. Open Postman and create a new request.
2. Set the method to **POST**.
3. Enter your assigned Render URL appended with `/identify` (e.g., `https://bitespeed-api-7p7t.onrender.com/identify`).
4. Under the URL bar, go to the **Body** tab.
5. Select **raw** and choose **JSON** from the dropdown menu.
6. Paste the following JSON:
   ```json
   {
     "email": "mcfly@hillvalley.edu",
     "phoneNumber": "123456"
   }
   ```
7. Click **Send** to receive the 200 OK JSON response.

## Example Request

**Endpoint:** `POST /identify`

```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mcfly@hillvalley.edu",
    "phoneNumber": "123456"
  }'
```

**Example Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```
