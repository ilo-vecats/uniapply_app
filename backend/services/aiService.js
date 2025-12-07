/**
 * AI Document Processing Service
 * Handles AI-based document extraction and verification
 */

const axios = require('axios');
const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from image using OCR (simplified - in production use Tesseract or cloud OCR)
 */
async function extractTextFromImage(filePath) {
  // This is a placeholder - in production, use Tesseract.js or cloud OCR service
  // For now, return empty string
  return '';
}

/**
 * Use AI to extract structured data from document text
 * This uses OpenAI API or similar LLM service
 */
async function extractDocumentData(documentType, text, applicationData = {}) {
  try {
    // If AI API is not configured, use rule-based extraction
    if (!process.env.AI_API_KEY) {
      return extractDataRuleBased(documentType, text, applicationData);
    }

    // Use OpenAI or similar LLM API
    const prompt = buildExtractionPrompt(documentType, text, applicationData);
    
    const response = await axios.post(
      `${process.env.AI_API_URL || 'https://api.openai.com/v1'}/chat/completions`,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting structured data from documents. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.AI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const extractedData = JSON.parse(response.data.choices[0].message.content);
    return extractedData;
  } catch (error) {
    console.error('AI extraction error:', error);
    // Fallback to rule-based extraction
    return extractDataRuleBased(documentType, text, applicationData);
  }
}

/**
 * Rule-based data extraction (fallback when AI is not available)
 */
function extractDataRuleBased(documentType, text, applicationData) {
  const extracted = {};

  // Extract name
  const namePatterns = [
    /Name[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /Name of Candidate[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /Candidate Name[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      extracted.name = match[1].trim();
      break;
    }
  }

  // Extract date of birth
  const dobPatterns = [
    /Date of Birth[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /DOB[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /Born[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
  ];
  for (const pattern of dobPatterns) {
    const match = text.match(pattern);
    if (match) {
      extracted.dateOfBirth = match[1].trim();
      break;
    }
  }

  // Extract percentage/marks for marksheets
  if (documentType.includes('marksheet') || documentType.includes('Marksheet')) {
    const percentagePattern = /(\d+\.?\d*)\s*%/i;
    const match = text.match(percentagePattern);
    if (match) {
      extracted.percentage = parseFloat(match[1]);
    }

    const boardPattern = /Board[:\s]+([A-Z]+)/i;
    const boardMatch = text.match(boardPattern);
    if (boardMatch) {
      extracted.board = boardMatch[1].trim();
    }
  }

  // Extract Aadhar number (masked)
  if (documentType.includes('aadhar') || documentType.includes('Aadhar')) {
    const aadharPattern = /\d{4}\s*\d{4}\s*\d{4}/;
    const match = text.match(aadharPattern);
    if (match) {
      extracted.aadharNumber = match[0].replace(/\s/g, '');
    }
  }

  return extracted;
}

/**
 * Build prompt for AI extraction
 */
function buildExtractionPrompt(documentType, text, applicationData) {
  const prompts = {
    '10th Marksheet': `Extract the following information from this 10th marksheet text:
- Student Name
- Date of Birth
- Percentage/CGPA
- Board Name
- Roll Number
- Year of Passing

Text: ${text.substring(0, 2000)}

Return JSON format: {"name": "...", "dateOfBirth": "...", "percentage": ..., "board": "...", "rollNumber": "...", "year": "..."}`,

    '12th Marksheet': `Extract the following information from this 12th marksheet text:
- Student Name
- Date of Birth
- Percentage/CGPA
- Board Name
- Roll Number
- Year of Passing

Text: ${text.substring(0, 2000)}

Return JSON format: {"name": "...", "dateOfBirth": "...", "percentage": ..., "board": "...", "rollNumber": "...", "year": "..."}`,

    'Aadhar Card': `Extract the following information from this Aadhar card text:
- Name
- Date of Birth
- Aadhar Number (last 4 digits only)
- Address

Text: ${text.substring(0, 2000)}

Return JSON format: {"name": "...", "dateOfBirth": "...", "aadharLast4": "...", "address": "..."}`,

    'Graduation Certificate': `Extract the following information from this graduation certificate:
- Student Name
- Degree Name
- University Name
- Year of Graduation
- CGPA/Percentage

Text: ${text.substring(0, 2000)}

Return JSON format: {"name": "...", "degree": "...", "university": "...", "year": "...", "cgpa": "..."}`
  };

  return prompts[documentType] || `Extract key information from this ${documentType} document. Text: ${text.substring(0, 2000)}`;
}

/**
 * Verify document against application data
 */
function verifyDocumentData(extractedData, applicationData, documentType) {
  const issues = [];
  const verified = {};

  // Verify name matches
  if (extractedData.name && applicationData.firstName) {
    const extractedName = extractedData.name.toLowerCase();
    const appName = `${applicationData.firstName} ${applicationData.lastName || ''}`.toLowerCase().trim();
    if (!extractedName.includes(appName.split(' ')[0]) && !appName.includes(extractedName.split(' ')[0])) {
      issues.push('Name mismatch between document and application');
    } else {
      verified.name = true;
    }
  }

  // Verify DOB matches
  if (extractedData.dateOfBirth && applicationData.dateOfBirth) {
    const extractedDOB = normalizeDate(extractedData.dateOfBirth);
    const appDOB = normalizeDate(applicationData.dateOfBirth);
    if (extractedDOB !== appDOB) {
      issues.push('Date of birth mismatch');
    } else {
      verified.dateOfBirth = true;
    }
  }

  // Verify percentage meets eligibility (if marksheet)
  if (documentType.includes('marksheet') && extractedData.percentage) {
    if (applicationData.minPercentage && extractedData.percentage < applicationData.minPercentage) {
      issues.push(`Percentage ${extractedData.percentage}% is below required ${applicationData.minPercentage}%`);
    } else {
      verified.percentage = true;
    }
  }

  return {
    verified,
    issues,
    isValid: issues.length === 0
  };
}

/**
 * Normalize date format for comparison
 */
function normalizeDate(dateString) {
  if (!dateString) return '';
  // Convert various date formats to YYYY-MM-DD
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toISOString().split('T')[0];
}

/**
 * Process document: extract text, extract data, verify
 */
async function processDocument(documentType, filePath, applicationData) {
  try {
    // Extract text based on file type
    const fileExt = path.extname(filePath).toLowerCase();
    let text = '';

    if (fileExt === '.pdf') {
      text = await extractTextFromPDF(filePath);
    } else if (['.jpg', '.jpeg', '.png'].includes(fileExt)) {
      text = await extractTextFromImage(filePath);
    }

    // Extract structured data
    const extractedData = await extractDocumentData(documentType, text, applicationData);

    // Verify against application data
    const verification = verifyDocumentData(extractedData, applicationData, documentType);

    return {
      extractedData,
      verification,
      text: text.substring(0, 500) // Store first 500 chars for reference
    };
  } catch (error) {
    console.error('Document processing error:', error);
    throw error;
  }
}

module.exports = {
  processDocument,
  extractDocumentData,
  verifyDocumentData
};

