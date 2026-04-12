import { describe, it, expect, vi } from 'vitest';
import { ContactSchema } from '@/lib/validation';

describe('Contact Form Validation', () => {
  it('should validate a correct contact object', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Inquiry',
      message: 'Hello, I have a question about the hackathon.'
    };
    
    const result = ContactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail on invalid email', () => {
    const invalidData = {
      name: 'John Doe',
      email: 'invalid-email',
      subject: 'Inquiry',
      message: 'Hello'
    };
    
    const result = ContactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail on missing fields', () => {
    const incompleteData = {
      name: 'John Doe'
    };
    
    const result = ContactSchema.safeParse(incompleteData);
    expect(result.success).toBe(false);
  });
});
