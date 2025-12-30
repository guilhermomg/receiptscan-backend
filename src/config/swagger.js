const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ReceiptScan API',
      version: '1.0.0',
      description: 'AI-powered receipt scanning and expense tracking API for receiptscan.ai',
      contact: {
        name: 'API Support',
        email: 'support@receiptscan.ai',
        url: 'https://receiptscan.ai'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.receiptscan.ai',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your Bearer token in the format: Bearer <token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com'
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password (hashed)',
              example: 'SecurePassword123!'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role',
              example: 'user'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
              example: '2024-01-15T10:30:00Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
              example: '2024-01-20T14:45:00Z'
            }
          }
        },
        Receipt: {
          type: 'object',
          required: ['merchantName', 'totalAmount', 'date'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique receipt identifier',
              example: '660e8400-e29b-41d4-a716-446655440001'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User who owns this receipt',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            merchantName: {
              type: 'string',
              description: 'Name of the merchant',
              example: 'Starbucks Coffee'
            },
            merchantAddress: {
              type: 'string',
              description: 'Merchant address',
              example: '123 Main St, Seattle, WA 98101'
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Receipt date and time',
              example: '2024-01-15T14:30:00Z'
            },
            totalAmount: {
              type: 'number',
              format: 'float',
              description: 'Total amount on receipt',
              example: 24.99
            },
            subtotal: {
              type: 'number',
              format: 'float',
              description: 'Subtotal before taxes',
              example: 22.50
            },
            tax: {
              type: 'number',
              format: 'float',
              description: 'Tax amount',
              example: 2.49
            },
            currency: {
              type: 'string',
              description: 'Currency code',
              example: 'USD',
              default: 'USD'
            },
            category: {
              type: 'string',
              description: 'Expense category',
              example: 'Food & Dining'
            },
            paymentMethod: {
              type: 'string',
              enum: ['cash', 'credit', 'debit', 'digital'],
              description: 'Payment method used',
              example: 'credit'
            },
            lineItems: {
              type: 'array',
              description: 'Individual items on receipt',
              items: {
                $ref: '#/components/schemas/LineItem'
              }
            },
            imageUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL to receipt image',
              example: 'https://storage.receiptscan.ai/receipts/660e8400.jpg'
            },
            ocrConfidence: {
              type: 'number',
              format: 'float',
              description: 'OCR confidence score (0-1)',
              example: 0.95,
              minimum: 0,
              maximum: 1
            },
            tags: {
              type: 'array',
              description: 'Custom tags',
              items: {
                type: 'string'
              },
              example: ['business', 'client-meeting']
            },
            notes: {
              type: 'string',
              description: 'Additional notes',
              example: 'Team lunch with client'
            },
            status: {
              type: 'string',
              enum: ['draft', 'verified', 'flagged', 'archived'],
              description: 'Receipt status',
              example: 'verified'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
              example: '2024-01-15T15:00:00Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
              example: '2024-01-15T15:30:00Z'
            }
          }
        },
        LineItem: {
          type: 'object',
          required: ['description', 'quantity', 'unitPrice', 'totalPrice'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique line item identifier',
              example: '770e8400-e29b-41d4-a716-446655440002'
            },
            description: {
              type: 'string',
              description: 'Item description',
              example: 'Grande Latte'
            },
            quantity: {
              type: 'number',
              description: 'Item quantity',
              example: 2
            },
            unitPrice: {
              type: 'number',
              format: 'float',
              description: 'Price per unit',
              example: 5.50
            },
            totalPrice: {
              type: 'number',
              format: 'float',
              description: 'Total price for this item',
              example: 11.00
            },
            category: {
              type: 'string',
              description: 'Item category',
              example: 'Beverages'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Category identifier',
              example: '880e8400-e29b-41d4-a716-446655440003'
            },
            name: {
              type: 'string',
              description: 'Category name',
              example: 'Food & Dining'
            },
            icon: {
              type: 'string',
              description: 'Category icon',
              example: '🍔'
            },
            color: {
              type: 'string',
              description: 'Category color hex code',
              example: '#FF6B6B'
            }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Subscription identifier',
              example: '990e8400-e29b-41d4-a716-446655440004'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User identifier',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            planId: {
              type: 'string',
              description: 'Plan identifier',
              example: 'pro_monthly'
            },
            planName: {
              type: 'string',
              description: 'Plan name',
              example: 'Professional'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'cancelled', 'expired'],
              description: 'Subscription status',
              example: 'active'
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'Subscription start date',
              example: '2024-01-01T00:00:00Z'
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'Subscription end date',
              example: '2024-02-01T00:00:00Z'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Monthly price',
              example: 19.99
            },
            currency: {
              type: 'string',
              description: 'Currency code',
              example: 'USD'
            }
          }
        },
        SubscriptionPlan: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Plan identifier',
              example: 'pro_monthly'
            },
            name: {
              type: 'string',
              description: 'Plan name',
              example: 'Professional'
            },
            description: {
              type: 'string',
              description: 'Plan description',
              example: 'Perfect for small businesses'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Monthly price',
              example: 19.99
            },
            currency: {
              type: 'string',
              description: 'Currency code',
              example: 'USD'
            },
            features: {
              type: 'array',
              description: 'Plan features',
              items: {
                type: 'string'
              },
              example: ['100 receipts/month', 'AI-powered OCR', 'Export to CSV/PDF', 'Email support']
            },
            limits: {
              type: 'object',
              properties: {
                receiptsPerMonth: {
                  type: 'number',
                  example: 100
                },
                storageGB: {
                  type: 'number',
                  example: 10
                }
              }
            }
          }
        },
        AnalyticsSummary: {
          type: 'object',
          properties: {
            totalSpent: {
              type: 'number',
              format: 'float',
              description: 'Total amount spent',
              example: 1250.50
            },
            totalReceipts: {
              type: 'number',
              description: 'Total number of receipts',
              example: 45
            },
            averageAmount: {
              type: 'number',
              format: 'float',
              description: 'Average receipt amount',
              example: 27.79
            },
            currency: {
              type: 'string',
              description: 'Currency code',
              example: 'USD'
            },
            period: {
              type: 'object',
              properties: {
                startDate: {
                  type: 'string',
                  format: 'date',
                  example: '2024-01-01'
                },
                endDate: {
                  type: 'string',
                  format: 'date',
                  example: '2024-01-31'
                }
              }
            },
            byCategory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: {
                    type: 'string',
                    example: 'Food & Dining'
                  },
                  amount: {
                    type: 'number',
                    format: 'float',
                    example: 450.00
                  },
                  count: {
                    type: 'number',
                    example: 15
                  }
                }
              }
            }
          }
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            expiresIn: {
              type: 'number',
              description: 'Token expiry time in seconds',
              example: 3600
            },
            tokenType: {
              type: 'string',
              description: 'Token type',
              example: 'Bearer'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Invalid credentials'
            },
            code: {
              type: 'string',
              description: 'Error code',
              example: 'AUTH_001'
            },
            status: {
              type: 'number',
              description: 'HTTP status code',
              example: 401
            },
            details: {
              type: 'object',
              description: 'Additional error details',
              additionalProperties: true
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed'
            },
            code: {
              type: 'string',
              description: 'Error code',
              example: 'VALIDATION_ERROR'
            },
            status: {
              type: 'number',
              description: 'HTTP status code',
              example: 400
            },
            fields: {
              type: 'object',
              description: 'Field-specific validation errors',
              additionalProperties: {
                type: 'string'
              },
              example: {
                email: 'Email is required',
                password: 'Password must be at least 8 characters'
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Authentication required',
                code: 'AUTH_001',
                status: 401
              }
            }
          }
        },
        ForbiddenError: {
          description: 'User does not have permission to access this resource',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Access forbidden',
                code: 'AUTH_002',
                status: 403
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Resource not found',
                code: 'NOT_FOUND',
                status: 404
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Too many requests. Please try again later.',
                code: 'RATE_LIMIT',
                status: 429
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Internal server error',
                code: 'SERVER_ERROR',
                status: 500
              }
            }
          }
        }
      },
      parameters: {
        PageParam: {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Page number for pagination'
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          description: 'Number of items per page'
        },
        SortParam: {
          in: 'query',
          name: 'sort',
          schema: {
            type: 'string',
            enum: ['date', '-date', 'amount', '-amount', 'merchant', '-merchant']
          },
          description: 'Sort order (prefix with - for descending)'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Receipts',
        description: 'Receipt management endpoints'
      },
      {
        name: 'File Upload',
        description: 'File upload and attachment endpoints'
      },
      {
        name: 'Billing',
        description: 'Subscription and billing endpoints'
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting endpoints'
      },
      {
        name: 'Export',
        description: 'Data export endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
