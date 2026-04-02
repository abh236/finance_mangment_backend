/**
 * API documentation (OpenAPI 3) — pattern inspired by Zorvyn-backend-task-main Swagger setup.
 * Base URL includes /api prefix (see servers).
 */
module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Finance Dashboard Platform API",
    version: "1.0.0",
    description:
      "Role-based finance dashboard backend (merged from `backend/finance-dashboard` + patterns from `Zorvyn-backend-task-main`).",
  },
  servers: [{ url: "http://localhost:4000/api", description: "Local" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
          role: { type: "string", enum: ["viewer", "analyst", "admin"] },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: {
          201: { description: "Created" },
          409: { description: "Email in use", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: { 200: { description: "JWT issued" } },
      },
    },
    "/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Totals & net balance (viewer+)",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" }, 401: { description: "Unauthorized" } },
      },
    },
    "/records": {
      get: {
        tags: ["Records"],
        summary: "List records (analyst, admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "type", in: "query", schema: { type: "string", enum: ["income", "expense"] } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "q", in: "query", schema: { type: "string" }, description: "Search notes/category" },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        tags: ["Records"],
        summary: "Create record (admin)",
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Created" }, 403: { description: "Forbidden" } },
      },
    },
  },
};
