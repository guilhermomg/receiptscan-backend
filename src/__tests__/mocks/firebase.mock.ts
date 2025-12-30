/**
 * Mock Firebase Admin SDK for testing
 */

export const mockFirestore = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  startAfter: jest.fn().mockReturnThis(),
  add: jest.fn(),
};

export const mockAuth = {
  verifyIdToken: jest.fn(),
  getUser: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

export const mockStorage = {
  bucket: jest.fn().mockReturnThis(),
  file: jest.fn().mockReturnThis(),
  save: jest.fn(),
  delete: jest.fn(),
  getSignedUrl: jest.fn(),
  upload: jest.fn(),
};

const mockFirebaseAdmin = {
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  firestore: jest.fn(() => mockFirestore),
  auth: jest.fn(() => mockAuth),
  storage: jest.fn(() => mockStorage),
};

export default mockFirebaseAdmin;
