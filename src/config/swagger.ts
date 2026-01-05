import swaggerJsdoc from 'swagger-jsdoc';
import config from './index';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ReceiptScan API',
    version: '1.0.0',
    description: 'AI-powered receipt scanning and expense tracking API for receiptscan.ai',
    contact: {
      name: 'ReceiptScan Support',
      url: 'https://receiptscan.ai',
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}${config.apiPrefix}`,
      description: 'Development server',
    },
    {
      url: `https://api.receiptscan.ai${config.apiPrefix}`,
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Firebase ID token. Obtain from Firebase Authentication.',
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for programmatic access (format: rsk_[live|test]_[key])',
      },
    },
    schemas: {
      // User Models
      UserRole: {
        type: 'string',
        enum: ['user', 'admin'],
        description: 'User role for access control',
      },
      SubscriptionTier: {
        type: 'string',
        enum: ['free', 'pro', 'premium', 'enterprise'],
        description: 'Subscription tier (premium and enterprise are reserved for future use)',
      },
      SubscriptionStatus: {
        type: 'string',
        enum: ['active', 'canceled', 'past_due', 'trialing', 'unpaid', 'incomplete'],
        description: 'Subscription status from Stripe',
      },
      UserProfile: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'Unique user identifier from Firebase',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          displayName: {
            type: 'string',
            description: 'User display name',
            nullable: true,
          },
          role: {
            $ref: '#/components/schemas/UserRole',
          },
          subscriptionTier: {
            $ref: '#/components/schemas/SubscriptionTier',
          },
          stripeCustomerId: {
            type: 'string',
            description: 'Stripe customer ID',
            nullable: true,
          },
          subscriptionId: {
            type: 'string',
            description: 'Stripe subscription ID',
            nullable: true,
          },
          subscriptionStatus: {
            $ref: '#/components/schemas/SubscriptionStatus',
            nullable: true,
          },
          currentPeriodEnd: {
            type: 'string',
            format: 'date-time',
            description: 'Current billing period end date',
            nullable: true,
          },
          receiptUsageThisMonth: {
            type: 'number',
            description: 'Number of receipts processed this month',
          },
          usagePeriodStart: {
            type: 'string',
            format: 'date-time',
            description: 'Start of current usage period',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },

      // Receipt Models
      Currency: {
        type: 'string',
        enum: ['USD', 'EUR', 'BRL', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'],
        description: 'ISO 4217 currency code',
      },
      ReceiptStatus: {
        type: 'string',
        enum: ['uploaded', 'parsing', 'completed', 'failed'],
        description: 'Receipt processing status',
      },
      ReceiptCategory: {
        type: 'string',
        enum: [
          'Food & Dining',
          'Transportation',
          'Office Supplies',
          'Travel',
          'Healthcare',
          'Other',
        ],
        description: 'Receipt category (predefined categories, custom categories also supported)',
      },
      LineItem: {
        type: 'object',
        required: ['description', 'quantity', 'unitPrice', 'total'],
        properties: {
          description: {
            type: 'string',
            description: 'Item description',
            example: 'Organic Bananas',
          },
          quantity: {
            type: 'number',
            description: 'Item quantity',
            example: 2,
          },
          unitPrice: {
            type: 'number',
            description: 'Price per unit',
            example: 0.79,
          },
          total: {
            type: 'number',
            description: 'Total item price',
            example: 1.58,
          },
          category: {
            type: 'string',
            description: 'Item category',
            nullable: true,
          },
        },
      },
      Receipt: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique receipt identifier',
          },
          userId: {
            type: 'string',
            description: 'Owner user ID',
          },
          merchant: {
            type: 'string',
            description: 'Merchant/store name',
            example: 'Whole Foods Market',
          },
          date: {
            type: 'string',
            format: 'date-time',
            description: 'Receipt transaction date',
          },
          total: {
            type: 'number',
            description: 'Total amount',
            example: 127.45,
          },
          tax: {
            type: 'number',
            description: 'Tax amount',
            nullable: true,
            example: 11.25,
          },
          currency: {
            $ref: '#/components/schemas/Currency',
          },
          category: {
            type: 'string',
            description: 'Receipt category (predefined or custom)',
            example: 'Food & Dining',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Custom tags for organization',
            example: ['groceries', 'organic'],
          },
          lineItems: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/LineItem',
            },
            description: 'Individual items on receipt',
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
            description: 'URL to receipt image',
            nullable: true,
          },
          status: {
            $ref: '#/components/schemas/ReceiptStatus',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
          deletedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Soft delete timestamp',
            nullable: true,
          },
        },
      },
      CreateReceiptDto: {
        type: 'object',
        required: ['merchant', 'date', 'total', 'currency', 'category'],
        properties: {
          merchant: {
            type: 'string',
            example: 'Whole Foods Market',
          },
          date: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T00:00:00.000Z',
          },
          total: {
            type: 'number',
            example: 127.45,
          },
          tax: {
            type: 'number',
            example: 11.25,
          },
          currency: {
            $ref: '#/components/schemas/Currency',
          },
          category: {
            type: 'string',
            example: 'Food & Dining',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['groceries', 'organic'],
          },
          lineItems: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/LineItem',
            },
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
          },
          status: {
            $ref: '#/components/schemas/ReceiptStatus',
          },
        },
      },
      UpdateReceiptDto: {
        type: 'object',
        properties: {
          merchant: {
            type: 'string',
          },
          date: {
            type: 'string',
            format: 'date-time',
          },
          total: {
            type: 'number',
          },
          tax: {
            type: 'number',
          },
          currency: {
            $ref: '#/components/schemas/Currency',
          },
          category: {
            type: 'string',
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          lineItems: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/LineItem',
            },
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
          },
          status: {
            $ref: '#/components/schemas/ReceiptStatus',
          },
        },
      },

      // Parsed Receipt Models
      ConfidenceLevel: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description:
          'Confidence level for extracted fields (high: >0.8, medium: 0.5-0.8, low: <0.5)',
      },
      ConfidentField: {
        type: 'object',
        properties: {
          value: {
            description: 'Extracted value',
          },
          confidence: {
            type: 'number',
            format: 'float',
            minimum: 0,
            maximum: 1,
          },
          confidenceLevel: {
            $ref: '#/components/schemas/ConfidenceLevel',
          },
        },
      },
      ContactInfo: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Whole Foods Market' },
          address: { type: 'string', example: '123 Main St' },
          city: { type: 'string', example: 'Austin' },
          state: { type: 'string', example: 'TX' },
          zip: { type: 'string', example: '73301' },
          country: { type: 'string', example: 'USA' },
          phone: { type: 'string', example: '+1-512-555-1234' },
          email: { type: 'string', example: 'info@wholefoods.com' },
        },
      },
      PaymentDetails: {
        type: 'object',
        properties: {
          method: { type: 'string', example: 'card' },
          cardNetwork: { type: 'string', example: 'Visa' },
          last4: { type: 'string', example: '4242' },
        },
      },
      ParsedReceipt: {
        type: 'object',
        properties: {
          merchant: {
            allOf: [
              { $ref: '#/components/schemas/ConfidentField' },
              { properties: { value: { $ref: '#/components/schemas/ContactInfo' } } },
            ],
          },
          customer: {
            allOf: [
              { $ref: '#/components/schemas/ConfidentField' },
              { properties: { value: { $ref: '#/components/schemas/ContactInfo' } } },
            ],
            nullable: true,
          },
          date: {
            allOf: [
              { $ref: '#/components/schemas/ConfidentField' },
              { properties: { value: { type: 'string', format: 'date-time' } } },
            ],
          },
          total: {
            allOf: [
              { $ref: '#/components/schemas/ConfidentField' },
              { properties: { value: { type: 'number', example: 127.45 } } },
            ],
          },
          tax: {
            allOf: [
              { $ref: '#/components/schemas/ConfidentField' },
              { properties: { value: { type: 'number', example: 11.25 } } },
            ],
            nullable: true,
          },
          currency: {
            allOf: [
              { $ref: '#/components/schemas/ConfidentField' },
              { properties: { value: { $ref: '#/components/schemas/Currency' } } },
            ],
          },
          category: {
            allOf: [
              { $ref: '#/components/schemas/ConfidentField' },
              { properties: { value: { type: 'string', example: 'Food & Dining' } } },
            ],
            nullable: true,
          },
          payment: {
            allOf: [
              { $ref: '#/components/schemas/ConfidentField' },
              { properties: { value: { $ref: '#/components/schemas/PaymentDetails' } } },
            ],
            nullable: true,
          },
          lineItems: {
            type: 'array',
            items: {
              allOf: [
                { $ref: '#/components/schemas/LineItem' },
                {
                  type: 'object',
                  properties: {
                    confidence: {
                      type: 'number',
                      example: 0.75,
                    },
                  },
                },
              ],
            },
          },
          overallConfidence: {
            type: 'number',
            description: 'Average confidence across all fields',
            example: 0.92,
          },
        },
      },

      // Response Models
      SuccessResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'success',
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully',
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'error',
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'INVALID_REQUEST',
              },
              details: {
                type: 'object',
                description: 'Additional error details',
              },
            },
          },
        },
      },
      PaginationInfo: {
        type: 'object',
        properties: {
          total: {
            type: 'number',
            description: 'Total number of items',
            example: 150,
          },
          limit: {
            type: 'number',
            description: 'Items per page',
            example: 20,
          },
          hasMore: {
            type: 'boolean',
            description: 'Whether there are more pages',
            example: true,
          },
          nextCursor: {
            type: 'string',
            description: 'Cursor for next page (document ID)',
            nullable: true,
            example: 'receipt-id-123',
          },
        },
      },

      // Upload Models
      UploadResponse: {
        type: 'object',
        description: 'Receipt object returned after upload',
        allOf: [{ $ref: '#/components/schemas/Receipt' }],
      },

      // Billing Models
      SubscriptionInfo: {
        type: 'object',
        properties: {
          tier: {
            $ref: '#/components/schemas/SubscriptionTier',
          },
          status: {
            $ref: '#/components/schemas/SubscriptionStatus',
            nullable: true,
          },
          currentPeriodEnd: {
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          receiptUsageThisMonth: {
            type: 'number',
            example: 25,
          },
          receiptLimit: {
            type: 'number',
            description: 'Monthly receipt limit (null for unlimited)',
            nullable: true,
            example: 10,
          },
        },
      },

      // Analytics Models
      AnalyticsSummary: {
        type: 'object',
        properties: {
          totalAmount: {
            type: 'number',
            example: 5234.56,
          },
          totalReceipts: {
            type: 'number',
            example: 42,
          },
          avgAmount: {
            type: 'number',
            example: 124.63,
          },
          period: {
            type: 'object',
            properties: {
              start: {
                type: 'string',
                format: 'date-time',
              },
              end: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
        },
      },
      CategoryAnalytics: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            example: 'Food & Dining',
          },
          amount: {
            type: 'number',
            example: 2100.0,
          },
          count: {
            type: 'number',
            example: 25,
          },
          percentage: {
            type: 'number',
            example: 40.1,
          },
        },
      },
      MonthlyTrend: {
        type: 'object',
        properties: {
          month: {
            type: 'string',
            example: '2024-12',
          },
          amount: {
            type: 'number',
            example: 5234.56,
          },
          count: {
            type: 'number',
            example: 42,
          },
        },
      },
      TopMerchant: {
        type: 'object',
        properties: {
          merchant: {
            type: 'string',
            example: 'Whole Foods Market',
          },
          amount: {
            type: 'number',
            example: 850.0,
          },
          count: {
            type: 'number',
            example: 12,
          },
          avgAmount: {
            type: 'number',
            example: 70.83,
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
    {
      name: 'Authentication',
      description: 'User authentication and profile management',
    },
    {
      name: 'Billing',
      description: 'Subscription billing and payment management',
    },
    {
      name: 'Upload',
      description: 'File upload and management',
    },
    {
      name: 'Receipt Parsing',
      description: 'AI-powered receipt data extraction',
    },
    {
      name: 'Receipts',
      description: 'Receipt CRUD operations',
    },
    {
      name: 'Analytics',
      description: 'Spending analytics and insights',
    },
    {
      name: 'Export',
      description: 'Data export in CSV and PDF formats',
    },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  // Path to the API routes where JSDoc comments are located
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/config/swagger.ts', // Include this file for additional schema definitions
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
