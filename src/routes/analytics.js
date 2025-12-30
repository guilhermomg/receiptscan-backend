const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get expense summary
 *     description: |
 *       Retrieves comprehensive expense summary for the authenticated user.
 *       Includes totals, averages, and breakdowns by category.
 *       
 *       **Rate Limit:** 50 requests per minute
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analysis (YYYY-MM-DD)
 *         example: 2024-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analysis (YYYY-MM-DD)
 *         example: 2024-01-31
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           default: USD
 *         description: Currency for amounts
 *         example: USD
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/AnalyticsSummary'
 *             example:
 *               data:
 *                 totalSpent: 1250.50
 *                 totalReceipts: 45
 *                 averageAmount: 27.79
 *                 currency: USD
 *                 period:
 *                   startDate: 2024-01-01
 *                   endDate: 2024-01-31
 *                 byCategory:
 *                   - category: Food & Dining
 *                     amount: 450.00
 *                     count: 15
 *                     percentage: 36.0
 *                   - category: Transportation
 *                     amount: 350.00
 *                     count: 12
 *                     percentage: 28.0
 *                   - category: Office Supplies
 *                     amount: 250.50
 *                     count: 10
 *                     percentage: 20.0
 *                   - category: Entertainment
 *                     amount: 200.00
 *                     count: 8
 *                     percentage: 16.0
 *                 topMerchants:
 *                   - merchantName: Starbucks Coffee
 *                     amount: 150.00
 *                     count: 8
 *                   - merchantName: Uber
 *                     amount: 120.00
 *                     count: 15
 *                 trends:
 *                   weeklyAverage: 312.63
 *                   monthOverMonth: 5.2
 *                   comparedToPrevious:
 *                     previousTotal: 1187.50
 *                     change: 63.00
 *                     percentChange: 5.3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/summary', (req, res) => {
  res.status(200).json({
    data: {
      totalSpent: 1250.50,
      totalReceipts: 45,
      averageAmount: 27.79,
      currency: 'USD',
      period: {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      },
      byCategory: [
        {
          category: 'Food & Dining',
          amount: 450.00,
          count: 15,
          percentage: 36.0
        },
        {
          category: 'Transportation',
          amount: 350.00,
          count: 12,
          percentage: 28.0
        },
        {
          category: 'Office Supplies',
          amount: 250.50,
          count: 10,
          percentage: 20.0
        },
        {
          category: 'Entertainment',
          amount: 200.00,
          count: 8,
          percentage: 16.0
        }
      ],
      topMerchants: [
        {
          merchantName: 'Starbucks Coffee',
          amount: 150.00,
          count: 8
        },
        {
          merchantName: 'Uber',
          amount: 120.00,
          count: 15
        }
      ],
      trends: {
        weeklyAverage: 312.63,
        monthOverMonth: 5.2,
        comparedToPrevious: {
          previousTotal: 1187.50,
          change: 63.00,
          percentChange: 5.3
        }
      }
    }
  });
});

/**
 * @swagger
 * /api/analytics/by-category:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get expenses by category
 *     description: |
 *       Retrieves detailed expense breakdown by category.
 *       Useful for pie charts and category analysis.
 *       
 *       **Rate Limit:** 50 requests per minute
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analysis (YYYY-MM-DD)
 *         example: 2024-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analysis (YYYY-MM-DD)
 *         example: 2024-01-31
 *     responses:
 *       200:
 *         description: Category breakdown retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                         example: Food & Dining
 *                       amount:
 *                         type: number
 *                         format: float
 *                         example: 450.00
 *                       count:
 *                         type: number
 *                         example: 15
 *                       percentage:
 *                         type: number
 *                         format: float
 *                         example: 36.0
 *                       averagePerReceipt:
 *                         type: number
 *                         format: float
 *                         example: 30.00
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/by-category', (req, res) => {
  res.status(200).json({
    data: [
      {
        category: 'Food & Dining',
        amount: 450.00,
        count: 15,
        percentage: 36.0,
        averagePerReceipt: 30.00
      },
      {
        category: 'Transportation',
        amount: 350.00,
        count: 12,
        percentage: 28.0,
        averagePerReceipt: 29.17
      },
      {
        category: 'Office Supplies',
        amount: 250.50,
        count: 10,
        percentage: 20.0,
        averagePerReceipt: 25.05
      }
    ]
  });
});

/**
 * @swagger
 * /api/analytics/by-date:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get expenses by date range
 *     description: |
 *       Retrieves expense data grouped by day, week, or month.
 *       Useful for line charts and trend analysis.
 *       
 *       **Rate Limit:** 50 requests per minute
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analysis (YYYY-MM-DD)
 *         example: 2024-01-01
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analysis (YYYY-MM-DD)
 *         example: 2024-01-31
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Time grouping interval
 *         example: day
 *     responses:
 *       200:
 *         description: Date-based expenses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: 2024-01-15
 *                       amount:
 *                         type: number
 *                         format: float
 *                         example: 125.50
 *                       count:
 *                         type: number
 *                         example: 5
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalAmount:
 *                       type: number
 *                       example: 1250.50
 *                     totalReceipts:
 *                       type: number
 *                       example: 45
 *                     averagePerDay:
 *                       type: number
 *                       example: 40.34
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/by-date', (req, res) => {
  res.status(200).json({
    data: [
      {
        date: '2024-01-01',
        amount: 45.50,
        count: 2
      },
      {
        date: '2024-01-02',
        amount: 78.25,
        count: 3
      },
      {
        date: '2024-01-03',
        amount: 125.50,
        count: 5
      }
    ],
    summary: {
      totalAmount: 1250.50,
      totalReceipts: 45,
      averagePerDay: 40.34
    }
  });
});

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get spending trends
 *     description: |
 *       Retrieves spending trends and comparisons over time.
 *       Includes month-over-month, year-over-year comparisons.
 *       
 *       **Rate Limit:** 50 requests per minute
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Trend period
 *         example: month
 *     responses:
 *       200:
 *         description: Trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentPeriod:
 *                       type: object
 *                       properties:
 *                         totalSpent:
 *                           type: number
 *                           example: 1250.50
 *                         receiptCount:
 *                           type: number
 *                           example: 45
 *                         averageAmount:
 *                           type: number
 *                           example: 27.79
 *                     previousPeriod:
 *                       type: object
 *                       properties:
 *                         totalSpent:
 *                           type: number
 *                           example: 1187.50
 *                         receiptCount:
 *                           type: number
 *                           example: 42
 *                         averageAmount:
 *                           type: number
 *                           example: 28.27
 *                     comparison:
 *                       type: object
 *                       properties:
 *                         amountChange:
 *                           type: number
 *                           example: 63.00
 *                         percentChange:
 *                           type: number
 *                           example: 5.3
 *                         receiptCountChange:
 *                           type: number
 *                           example: 3
 *                         trend:
 *                           type: string
 *                           enum: [increasing, decreasing, stable]
 *                           example: increasing
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/trends', (req, res) => {
  res.status(200).json({
    data: {
      currentPeriod: {
        totalSpent: 1250.50,
        receiptCount: 45,
        averageAmount: 27.79
      },
      previousPeriod: {
        totalSpent: 1187.50,
        receiptCount: 42,
        averageAmount: 28.27
      },
      comparison: {
        amountChange: 63.00,
        percentChange: 5.3,
        receiptCountChange: 3,
        trend: 'increasing'
      }
    }
  });
});

module.exports = router;
