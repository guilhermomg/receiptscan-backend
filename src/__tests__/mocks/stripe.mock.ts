/**
 * Mock Stripe SDK for testing
 */

export const mockStripeCustomer = {
  id: 'cus_test123',
  email: 'test@example.com',
  created: Date.now(),
};

export const mockStripeCheckoutSession = {
  id: 'cs_test123',
  url: 'https://checkout.stripe.com/c/pay/cs_test123',
  payment_status: 'unpaid',
  status: 'open',
};

export const mockStripeBillingPortalSession = {
  id: 'bps_test123',
  url: 'https://billing.stripe.com/p/session/test123',
};

export const mockStripeSubscription = {
  id: 'sub_test123',
  customer: 'cus_test123',
  status: 'active',
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  items: {
    data: [
      {
        price: {
          id: 'price_test123',
        },
      },
    ],
  },
};

export const mockStripe = {
  customers: {
    create: jest.fn().mockResolvedValue(mockStripeCustomer),
    retrieve: jest.fn().mockResolvedValue(mockStripeCustomer),
    update: jest.fn().mockResolvedValue(mockStripeCustomer),
    list: jest.fn().mockResolvedValue({ data: [mockStripeCustomer] }),
  },
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue(mockStripeCheckoutSession),
      retrieve: jest.fn().mockResolvedValue(mockStripeCheckoutSession),
    },
  },
  billingPortal: {
    sessions: {
      create: jest.fn().mockResolvedValue(mockStripeBillingPortalSession),
    },
  },
  subscriptions: {
    retrieve: jest.fn().mockResolvedValue(mockStripeSubscription),
    update: jest.fn().mockResolvedValue(mockStripeSubscription),
    cancel: jest.fn().mockResolvedValue({ ...mockStripeSubscription, status: 'canceled' }),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

export class Stripe {
  customers = mockStripe.customers;
  checkout = mockStripe.checkout;
  billingPortal = mockStripe.billingPortal;
  subscriptions = mockStripe.subscriptions;
  webhooks = mockStripe.webhooks;
  constructor() {}
}

export default mockStripe;
