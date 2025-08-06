# Portfolio REST API

This is a test project for LANARS - building a RESTful API for a portfolio platform. The application allows users to register, create portfolios with images, interact through comments, and explore other users' portfolios. It is built using **NestJS**, **MySQL**, and various best practices to ensure scalability, performance, and maintainability.

## Features Implemented

- **User Authentication**
  - Local registration & login
  - JWT token issuance
  - Profile deletion

- **Portfolios**
  - Each user can create multiple portfolios
  - Each portfolio has a name, description, and a set of images
  - Portfolios are listed and accessible by creation date
  - Users can delete individual images from their portfolios

- **Images**
  - Each image has a name and description
  - Images support uploading, updating, and deletion
  - Pagination is implemented for image feeds and portfolio views
  - Image validation includes:
    - Maximum file size
    - Allowed MIME types
    - Dimension limits (width & height)

- **Comments**
  - Comments can be added to images
  - Supports root comments and nested replies (child comments)
  - Replies are fetched via a separate query for performance optimization
  - `childrenCount` field is stored for each comment to help frontend rendering

- **Validation & Error Handling**
  - All incoming requests are validated via DTOs and class-validator
  - Global error handling for HTTP errors: 400, 401, 403, 404
  - Swagger examples provided for every DTO body

- **Caching**
  - Selective caching is used to reduce database load and speed up read operations

- **Events**
  - `EventEmitterModule` is used to emit and subscribe to system events
  - Logging is implemented for comment creation events (extensible for notifications)

- **Pagination**
  - Implemented on all modules with flexible query parameters

- **Testing**
  - Unit tests are provided for all service layers

---

## Architectural Decisions

### 1. **Modular Architecture**

Each domain is implemented as a separate NestJS module, improving maintainability and scalability.

### 2. **Abstract Base Entity**

A reusable base entity was created for all models to include shared fields:

- `id`
- `created_at`
- `updated_at`

This reduces boilerplate code and ensures consistency across entities.

### 3. **DTO + Swagger Integration**

Using DTOs with `@ApiProperty` decorators allowed for generating clear Swagger documentation. It enhances developer experience and speeds up testing and debugging.

### 4. **Image Handling via Custom Pipe**

A custom pipe was implemented to:

- Validate file type and dimensions
- Limit upload size
  This guarantees that only appropriate images are processed, ensuring security and storage efficiency.

### 5. **Separation of Concerns in Image & Portfolio Queries**

Images are fetched via a separate endpoint from portfolios. This makes lazy loading via pagination easier in large-scale production environments.

### 6. **Nested Comments Handling**

Root and child comments are fetched with different endpoints. This:

- Improves performance when there are many comments
- Supports threaded replies cleanly
- Enables displaying comment hierarchy on the frontend without overfetching

### 7. **Caching & Optimization**

Caching mechanisms (e.g., in-memory or Redis, configurable) reduce redundant database queries for high-traffic endpoints like image feed.

### 8. **EventEmitter for Extensibility**

Using events decouples logic, making it easy to extend features later, such as:

- Email notifications when someone replies to a comment (in future)
- Activity logs
- Real-time updates

---

## Technology Stack

- **Backend Framework**: NestJS
- **Database**: MySQL
- **ORM**: TypeORM
- **Validation**: class-validator, DTOs
- **Authentication**: Passport.js with JWT strategy
- **Documentation**: Swagger (OpenAPI)
- **Caching**: In-memory (configurable for Redis)
- **Testing**: Jest
- **Event Handling**: @nestjs/event-emitter
- **File Upload**: Multer + Custom validation pipes

---

## Potential Future Enhancements

- **WebSocket Integration**  
  Implement WebSocket (e.g., using `@nestjs/websockets`) to allow real-time updates — particularly for:
  - New comments and replies
  - Live feed updates
  - Real-time notification counters

- **Comment Subscriptions**  
  Allow users to subscribe to image threads or comment chains to receive instant updates when replies are posted.

- **Email Provider Integration**  
  Connect an email service (e.g., SendGrid, AWS SES) for:
  - Notifications about replies or activity
  - Email verification via one-time password (OTP)
  - Password reset functionality
  - Transactional messaging

## Getting Started

### Installation

1. **Clone the repository**

```bash
git init
git remote add origin https://github.com/NikitaShatunov/lanars_test.git
git pull origin main
```

2. **Install all dependencies**

```bash
npm install
```

3. **Create `.env` file**

Copy the example environment configuration:

```bash
cp .env.example .env
```

Then open `.env` and replace the placeholder values with your actual configuration.

4. **Build the project**

```bash
npm run build
```

5. **Run the application**

```bash
npm run start
```

6. **Access API documentation**

After launching the application, open your browser and go to:

```
http://localhost:3000/api
```

This will open the **Swagger UI**, which includes all available endpoints, example request bodies, and detailed response formats.
