# Pinterest Clone

This is a full-stack Pinterest clone application built using the MERN stack (MongoDB, Express, React, Node.js). The application allows users to view and interact with pins, similar to the functionality provided by Pinterest.

## Features

- View a collection of pins
- Responsive design

## Technologies Used

### Frontend

- React: A JavaScript library for building user interfaces
- Vite: A build tool that provides a fast development environment
- ESLint: A tool for identifying and fixing problems in JavaScript code

### Backend

- Node.js: A JavaScript runtime built on Chrome's V8 JavaScript engine
- Express: A minimal and flexible Node.js web application framework
- MongoDB: A document-oriented NoSQL database

To start the backend server, run the following command:

```bash
$ cd backend
$ npm start
```

This will start the Express server and connect to the MongoDB database.

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- Node.js (v14 or later)
- npm (v6 or later)
- MongoDB

### Project Structure

- `backend/`: Contains the backend code of the application
  - `src/`: Contains the source code of the backend
    - `index.js`: The entry point of the backend application
    - `config/`: Contains configuration files
      - `db.js`: Database connection configuration
    - `controllers/`: Contains controller files
      - `pinController.js`: Controller file for pins
    - `routes/`: Contains the route files
      - `pins.js`: Route file for pins
- `frontend/`: Contains the frontend code of the application
  - `public/`: Contains static assets such as images and icons
  - `src/`: Contains the source code of the application
    - `App.jsx`: The main component of the application
    - `main.jsx`: The entry point of the application
    - `app.css`: The main stylesheet of the application
