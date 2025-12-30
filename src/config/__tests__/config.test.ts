import config from '../index';

describe('Configuration', () => {
  it('should load default configuration', () => {
    expect(config).toBeDefined();
    expect(config.nodeEnv).toBeDefined();
    expect(config.firebase).toBeDefined();
    expect(config.firebase.projectId).toBeDefined();
  });

  it('should have required configuration properties', () => {
    expect(config).toHaveProperty('nodeEnv');
    expect(config).toHaveProperty('firebase');
    expect(config).toHaveProperty('api');
    expect(config).toHaveProperty('openai');
    expect(config).toHaveProperty('stripe');
    expect(config).toHaveProperty('firestore');
    expect(config).toHaveProperty('storage');
    expect(config).toHaveProperty('monitoring');
    expect(config).toHaveProperty('cors');
  });

  it('should have valid Firebase configuration', () => {
    expect(config.firebase.projectId).toBeTruthy();
    expect(config.firebase.region).toBeTruthy();
    expect(config.firebase.region).toMatch(/^[a-z]+-[a-z]+\d+$/);
  });

  it('should have valid API configuration', () => {
    expect(config.api.baseUrl).toBeTruthy();
    expect(config.api.port).toBeGreaterThan(0);
    expect(config.api.port).toBeLessThan(65536);
  });

  it('should have valid monitoring configuration', () => {
    expect(typeof config.monitoring.enabled).toBe('boolean');
    expect(config.monitoring.logLevel).toMatch(/^(debug|info|warn|error)$/);
  });
});
