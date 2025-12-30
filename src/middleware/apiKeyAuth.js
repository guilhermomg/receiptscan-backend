/**
 * API Key Authentication Middleware
 * Validates API keys for secure API access
 */

const apiKeyAuth = (req, res, next) => {
  const apiKey = req.header(process.env.API_KEY_HEADER || 'X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'API key is missing. Please provide a valid API key in the request header.'
    });
  }
  
  // Get trusted API keys from environment
  const trustedKeys = (process.env.TRUSTED_API_KEYS || '').split(',').filter(k => k.trim());
  
  if (!trustedKeys.includes(apiKey)) {
    // Log potential unauthorized access attempt
    console.warn(`[Security] Invalid API key attempt from IP: ${req.ip}`);
    
    return res.status(403).json({
      error: 'Authentication failed',
      message: 'Invalid API key. Access denied.'
    });
  }
  
  // API key is valid, proceed
  req.apiKeyValid = true;
  next();
};

/**
 * Optional API Key Authentication
 * Allows requests with or without API key, but validates if present
 */
const optionalApiKeyAuth = (req, res, next) => {
  const apiKey = req.header(process.env.API_KEY_HEADER || 'X-API-Key');
  
  if (!apiKey) {
    req.apiKeyValid = false;
    return next();
  }
  
  const trustedKeys = (process.env.TRUSTED_API_KEYS || '').split(',').filter(k => k.trim());
  
  if (!trustedKeys.includes(apiKey)) {
    return res.status(403).json({
      error: 'Authentication failed',
      message: 'Invalid API key. Access denied.'
    });
  }
  
  req.apiKeyValid = true;
  next();
};

module.exports = {
  apiKeyAuth,
  optionalApiKeyAuth
};
