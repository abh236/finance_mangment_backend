module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Finance Dashboard Platform API",
    version: "1.0.0",
    description:
      "Role-based finance dashboard API. Roles: viewer (dashboard only), analyst (dashboard + read records), admin (full access). All IDs are MongoDB ObjectIds.",
  },
  servers: [
    { url: "https://finance-mangment-backend-k6zr.vercel.app/api", description: "Production (Vercel + Atlas)" },
    { url: "http://localhost:4000/api", description: "Local development" },
  ],
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
          details: { type: "array", items: { type: "object" } },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["viewer", "analyst", "admin"] },
          status: { type: "string", enum: ["active", "inactive"] },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Record: {
        type: "object",
        properties: {
          id: { type: "string" },
          amount: { type: "number", example: 1500.5 },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string", example: "Salary" },
          date: { type: "string", format: "date-time" },
          notes: { type: "string" },
          created_by: { type: "string" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Jane Doe" },
          email: { type: "string", format: "email", example: "jane@example.com" },
          password: { type: "string", minLength: 6, example: "secret123" },
          role: { type: "string", enum: ["viewer", "analyst", "admin"], default: "viewer" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@example.com" },
          password: { type: "string", example: "admin123" },
        },
      },
      RecordRequest: {
        type: "object",
        required: ["amount", "type", "category", "date"],
        properties: {
          amount: { type: "number", example: 1500.5 },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string", example: "Salary" },
          date: { type: "string", format: "date-time", example: "2026-04-01T10:00:00.000Z" },
          notes: { type: "string", example: "Monthly salary" },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: {
          201: { description: "User created successfully" },
          409: { description: "Email already in use", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          422: { description: "Validation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and receive JWT token",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          200: { description: "Login successful — returns token" },
          401: { description: "Invalid credentials" },
          403: { description: "Account inactive" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Current user profile" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/users": {
      get: {
        tags: ["Users"],
        summary: "List all users — admin only",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: { description: "Paginated user list" },
          403: { description: "Admin role required" },
        },
      },
    },
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID — admin only",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "User found" },
          404: { description: "User not found" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update user name, role, or status — admin only",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  role: { type: "string", enum: ["viewer", "analyst", "admin"] },
                  status: { type: "string", enum: ["active", "inactive"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "User updated" },
          404: { description: "User not found" },
        },
      },
    },
    "/records": {
      get: {
        tags: ["Records"],
        summary: "List financial records — analyst, admin",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "type", in: "query", schema: { type: "string", enum: ["income", "expense"] } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "q", in: "query", schema: { type: "string" }, description: "Search in category and notes" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: { description: "Paginated records list" },
          403: { description: "Analyst or admin role required" },
        },
      },
      post: {
        tags: ["Records"],
        summary: "Create a financial record — admin only",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RecordRequest" } } },
        },
        responses: {
          201: { description: "Record created" },
          403: { description: "Admin role required" },
          422: { description: "Validation failed" },
        },
      },
    },
    "/records/{id}": {
      get: {
        tags: ["Records"],
        summary: "Get a single record — analyst, admin",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Record found" },
          404: { description: "Record not found" },
        },
      },
      patch: {
        tags: ["Records"],
        summary: "Update a record — admin only",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/RecordRequest" } } },
        },
        responses: {
          200: { description: "Record updated" },
          404: { description: "Record not found" },
        },
      },
      delete: {
        tags: ["Records"],
        summary: "Soft delete a record — admin only",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Record soft deleted" },
          404: { description: "Record not found" },
        },
      },
    },
    "/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Total income, expenses, net balance — viewer+",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Summary totals" }, 401: { description: "Unauthorized" } },
      },
    },
    "/dashboard/categories": {
      get: {
        tags: ["Dashboard"],
        summary: "Totals grouped by category and type — viewer+",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Category breakdown" } },
      },
    },
    "/dashboard/trends/monthly": {
      get: {
        tags: ["Dashboard"],
        summary: "Monthly income/expense/net trends — viewer+",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "months", in: "query", schema: { type: "integer", default: 6, minimum: 1, maximum: 24 }, description: "Number of months to look back" },
        ],
        responses: { 200: { description: "Monthly trend data" } },
      },
    },
    "/dashboard/trends/weekly": {
      get: {
        tags: ["Dashboard"],
        summary: "Weekly income/expense trends (last 8 weeks) — viewer+",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Weekly trend data" } },
      },
    },
    "/dashboard/activity": {
      get: {
        tags: ["Dashboard"],
        summary: "Recent financial activity — viewer+",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
        ],
        responses: { 200: { description: "Recent records list" } },
      },
    },
  },
};
