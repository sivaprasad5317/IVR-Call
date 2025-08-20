# IVR Call Testing Tool

This project is an **IVR Testing Tool** built to test, simulate, and validate telephony flows using **Azure Communication Services (ACS)** for telephony integration and **Azure Cosmos DB** for backend data storage.

## 📂 Project Structure

```
ivr-call/
│
├── client/               # React frontend for IVR call management
│   ├── public/           
│   └── src/              
│
├── server/               # Node.js backend
│   ├── src/
│   │   ├── config/       # Configuration files (DB, environment, Azure setup)
│   │   ├── controllers/  # Request handlers for different routes
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # Business logic, integrates with Azure & Cosmos DB
│   │   ├── app.js        # Express app initialization
│   │   └── server.js     # Server entry point
│
├── README.md             # Project documentation
└── package.json

```

## 🚀 Features

* **IVR Flow Simulation** – Test inbound IVR call flows.
* **Azure Communication Services Integration** – Handles telephony operations.
* **Cosmos DB Backend** – Stores IVR test cases, call logs, and results.
* **React Frontend** – Provides an interface for managing and running tests.
* **Node.js/Express API** – Serves as middleware between client, ACS, and Cosmos DB.

## 🛠️ Tech Stack

* **Frontend**: React (with Tailwind / Material UI as needed)
* **Backend**: Node.js + Express
* **Database**: Azure Cosmos DB
* **Telephony**: Azure Communication Services (ACS)

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/sivaprasad5317/IVR-Call.git
cd ivr-call
```

### 2. Install dependencies

Install both frontend and backend dependencies:

```bash
cd client && npm install
cd ../server && npm install
```

### 3. Setup environment variables

Create a `.env` file inside the **server** directory with:

```
AZURE_ACS_CONNECTION_STRING=<your-acs-connection-string>
COSMOS_DB_ENDPOINT=<your-cosmos-db-endpoint>
COSMOS_DB_KEY=<your-cosmos-db-key>
COSMOS_DB_DATABASE=<database-name>
COSMOS_DB_CONTAINER=<container-name>
```

### 4. Run the project

Start backend:

```bash
cd server
npm run dev
```

Start frontend:

```bash
cd client
npm run dev
```

The app will be available at:
👉 **[http://localhost:5173](http://localhost:5173)** (client)
👉 **[http://localhost:4000](http://localhost:4000)** (server API)

## 📊 Future Enhancements

* Call flow visualization dashboard.
* Automated regression testing for IVR scenarios.
* Integration with CI/CD pipelines for continuous testing.
* Support for multiple cloud telephony providers.