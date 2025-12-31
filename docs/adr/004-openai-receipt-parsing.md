# ADR-004: Use OpenAI for Receipt Parsing

## Status

**Accepted** - December 2024

## Context

The core feature of receiptscan-backend is extracting structured data from receipt images. We need a solution that can:

- Read text from images (OCR)
- Understand receipt structure and format
- Extract specific fields (merchant, date, total, items, etc.)
- Handle various receipt formats and layouts
- Provide confidence scores for extracted data
- Support multiple languages (future requirement)

Traditional OCR solutions require significant post-processing and rules-based parsing. We need an intelligent solution that can understand context and handle diverse receipt formats.

## Decision

We will use **OpenAI's GPT-4 Vision API** (gpt-4o model) for receipt parsing.

### Implementation Approach

1. **Primary Method**: OpenAI GPT-4 Vision API
   - Send receipt image URL to API
   - Use structured prompts to extract data
   - Parse JSON response with extracted fields

2. **Confidence Scoring**: Assign confidence levels to extracted fields
   - HIGH: confidence > 0.8
   - MEDIUM: confidence 0.5-0.8
   - LOW: confidence < 0.5

3. **Error Handling**: Retry logic with exponential backoff

## Consequences

### Positive

- **High Accuracy**: GPT-4 Vision excels at understanding document structure
- **Context Understanding**: Can interpret ambiguous text based on context
- **Flexible Format Handling**: Works with various receipt layouts without manual rules
- **Structured Output**: Can return data in desired JSON format
- **Multi-language Support**: Handles multiple languages out-of-the-box
- **Line Item Extraction**: Can extract individual items and prices
- **Minimal Training**: No need to train custom models
- **Quick Implementation**: Fast to integrate and deploy
- **Continuous Improvement**: Model improves with OpenAI updates

### Negative

- **Cost**: Per-request pricing can add up at scale
  - GPT-4 Vision: ~$0.01 per image (varies by size)
- **API Dependency**: Relies on external service availability
- **Rate Limits**: Subject to OpenAI API rate limits
- **Latency**: Network request adds 2-5 seconds processing time
- **Data Privacy**: Images sent to OpenAI (mitigated by terms)
- **Vendor Lock-in**: Tightly coupled to OpenAI API

### Neutral

- **Model Updates**: OpenAI may update models (could improve or change behavior)
- **Prompt Engineering**: Requires crafting effective prompts

## Implementation

### Prompt Structure
```typescript
const prompt = `
Extract receipt information from this image and return as JSON:
{
  "merchant": "store name",
  "merchantConfidence": 0.0-1.0,
  "date": "YYYY-MM-DD",
  "dateConfidence": 0.0-1.0,
  "total": number,
  "totalConfidence": 0.0-1.0,
  "tax": number,
  "taxConfidence": 0.0-1.0,
  "currency": "USD",
  "currencyConfidence": 0.0-1.0,
  "category": "category name",
  "categoryConfidence": 0.0-1.0,
  "lineItems": [
    {
      "description": "item name",
      "quantity": number,
      "unitPrice": number,
      "total": number,
      "confidence": 0.0-1.0
    }
  ]
}
`;
```

### Configuration
```typescript
{
  model: 'gpt-4o',
  maxTokens: 2000,
  temperature: 0.1,  // Low temperature for consistent results
}
```

## Alternatives Considered

1. **Google Cloud Vision API**
   - Pros: Good OCR capabilities, part of GCP
   - Cons: Requires significant post-processing for structure
   - Reason rejected: Lacks context understanding

2. **AWS Textract**
   - Pros: Designed for document extraction
   - Cons: Requires more configuration for receipts
   - Reason rejected: Less flexible than GPT-4 Vision

3. **Tesseract OCR + Custom Parsing**
   - Pros: Open-source, no API costs
   - Cons: Requires extensive custom parsing logic
   - Reason rejected: High development and maintenance effort

4. **Azure Computer Vision + Form Recognizer**
   - Pros: Good accuracy, integrated with Azure
   - Cons: More complex setup
   - Reason rejected: OpenAI provides better results with simpler integration

5. **Custom ML Model (BERT/Transformer)**
   - Pros: Complete control, potentially lower cost at scale
   - Cons: Requires training data, ML expertise, ongoing maintenance
   - Reason rejected: Too much upfront investment

## Cost Analysis

**Estimated Monthly Costs** (based on usage):

| Users | Receipts/Month | Cost/Receipt | Total Cost |
|-------|----------------|--------------|------------|
| 100   | 1,000         | $0.01        | $10        |
| 1,000 | 10,000        | $0.01        | $100       |
| 10,000| 100,000       | $0.01        | $1,000     |

**Cost Optimization Strategies**:
- Cache parsed results to avoid re-parsing
- Implement rate limiting to prevent abuse
- Consider batch processing for multiple receipts
- Monitor usage and set budget alerts

## Risk Mitigation

### API Availability
- Implement exponential backoff retry logic
- Return graceful error messages to users
- Consider fallback to Google Cloud Vision (future)

### Cost Management
- Set OpenAI API spending limits
- Monitor usage via dashboard
- Implement user-based rate limiting
- Cache results to reduce duplicate requests

### Data Privacy
- Review OpenAI's data usage policy
- Ensure compliance with privacy regulations
- Consider on-premises solution for sensitive use cases (future)

### Quality Assurance
- Track confidence scores
- Allow manual corrections
- Collect feedback to improve prompts

## Future Considerations

1. **Fallback Service**: Implement Google Cloud Vision as fallback
2. **Hybrid Approach**: Use traditional OCR + GPT-4 for cost optimization
3. **Custom Model**: Train custom model if volume justifies investment
4. **Batch Processing**: Process multiple receipts in single API call

## Monitoring

Track the following metrics:
- Average processing time
- Success rate
- Confidence score distribution
- Cost per receipt
- API error rate

## References

- [OpenAI Vision API Documentation](https://platform.openai.com/docs/guides/vision)
- [GPT-4 Vision Pricing](https://openai.com/pricing)
- [Best Practices for Receipt Parsing](https://platform.openai.com/docs/guides/prompt-engineering)
