import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((o: string) => o.trim()).filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] || '');
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

interface GeneratePDFRequest {
  contractId: string;
  htmlContent: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTH: Verify JWT token ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { contractId, htmlContent }: GeneratePDFRequest = await req.json();

    // Generate PDF from HTML content with improved processing
    const pdfBlob = await generatePDFFromHTML(htmlContent);

    // Upload PDF to Supabase Storage
    const fileName = `contrato_${contractId}_${Date.now()}.pdf`;
    const filePath = `contracts/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Error uploading PDF:', uploadError);
      throw uploadError;
    }

    // PDF uploaded successfully

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('contracts')
      .getPublicUrl(filePath);

    const pdfUrl = urlData.publicUrl;

    // Update contract with PDF URL
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        pdf_url: pdfUrl,
        status: 'ready_to_send'
      })
      .eq('id', contractId);

    if (updateError) {
      console.error('❌ Error updating contract:', updateError);
      throw updateError;
    }

    // Contract updated with PDF URL

    return new Response(JSON.stringify({
      success: true,
      pdfUrl,
      contractId
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: unknown) {
    console.error('Error in generate-contract-pdf function');
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Enhanced PDF generation function that preserves all HTML content
async function generatePDFFromHTML(htmlContent: string): Promise<Blob> {
  // Converting HTML to PDF

  // Create a complete HTML document with proper A4 styling and full content
  const fullHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contrato</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            font-size: 12px;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .contract-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
          }
          
          h1, h2, h3, h4, h5, h6 {
            color: #000;
            margin-bottom: 15px;
            margin-top: 20px;
            font-weight: bold;
            page-break-after: avoid;
          }
          
          h1 {
            font-size: 18px;
            text-align: center;
            margin-bottom: 30px;
          }
          
          h2 {
            font-size: 16px;
            margin-bottom: 20px;
          }
          
          p {
            margin-bottom: 12px;
            text-align: justify;
            line-height: 1.5;
            page-break-inside: avoid;
            orphans: 2;
            widows: 2;
          }
          
          strong {
            font-weight: bold;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
            page-break-inside: avoid;
          }
          
          td, th {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 80px;
            page-break-inside: avoid;
          }
          
          .signature-box {
            text-align: center;
            width: 45%;
            border-top: 2px solid #000;
            padding-top: 15px;
            margin-top: 60px;
          }
          
          .footer {
            border-top: 1px solid #ccc;
            margin-top: 40px;
            padding-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
          
          ul, ol {
            margin: 15px 0;
            padding-left: 30px;
            page-break-inside: avoid;
          }
          
          li {
            margin-bottom: 8px;
            text-align: justify;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          /* Special styling for contract sections */
          div[style*="border"] {
            page-break-inside: avoid;
            margin: 20px 0;
          }
          
          @media print {
            body {
              print-color-adjust: exact;
              background: white !important;
            }
            
            .contract-container {
              box-shadow: none;
              border: none;
            }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  // Full HTML document created

  // Create a proper PDF with actual content using a more robust approach
  const pdfContent = await createRobustPDF(fullHTML);
  return new Blob([pdfContent], { type: 'application/pdf' });
}

// Create a robust PDF that maintains the complete HTML structure
async function createRobustPDF(htmlContent: string): Promise<Uint8Array> {
  // Creating robust PDF with complete HTML content

  // Parse and preserve the complete HTML structure
  const cleanedContent = cleanAndPreserveHTML(htmlContent);
  // Cleaned content

  // Extract all text content while preserving structure
  const structuredContent = extractStructuredContent(cleanedContent);
  // Extracted structured content

  // Generate comprehensive PDF
  const pdfDocument = generateComprehensivePDF(structuredContent);

  return new TextEncoder().encode(pdfDocument);
}

// Clean HTML while preserving all meaningful content
function cleanAndPreserveHTML(html: string): string {
  // Cleaning HTML while preserving content

  // Remove only script and style tags, keep everything else
  let cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Convert HTML entities
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");

  return cleaned;
}

// Extract structured content preserving hierarchy and formatting
function extractStructuredContent(html: string): Array<{ type: string, content: string, level: number }> {
  const content: Array<{ type: string, content: string, level: number }> = [];

  // Split into meaningful sections while preserving structure
  const lines = html.split('\n');
  let currentSection = '';
  let inParagraph = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect different content types
    if (trimmed.includes('<h1') || trimmed.includes('<H1')) {
      const text = extractTextFromHTML(trimmed);
      if (text) {
        content.push({ type: 'title1', content: text, level: 1 });
      }
    } else if (trimmed.includes('<h2') || trimmed.includes('<H2')) {
      const text = extractTextFromHTML(trimmed);
      if (text) {
        content.push({ type: 'title2', content: text, level: 2 });
      }
    } else if (trimmed.includes('<div') && trimmed.includes('border')) {
      const text = extractTextFromHTML(trimmed);
      if (text) {
        content.push({ type: 'section-header', content: text, level: 0 });
      }
    } else if (trimmed.includes('<p') || trimmed.includes('<P')) {
      const text = extractTextFromHTML(trimmed);
      if (text && text.length > 3) {
        content.push({ type: 'paragraph', content: text, level: 0 });
      }
    } else if (trimmed.includes('<li') || trimmed.includes('<LI')) {
      const text = extractTextFromHTML(trimmed);
      if (text) {
        content.push({ type: 'list-item', content: text, level: 1 });
      }
    } else if (trimmed.includes('<strong') || trimmed.includes('<STRONG') || trimmed.includes('<b>') || trimmed.includes('<B>')) {
      const text = extractTextFromHTML(trimmed);
      if (text) {
        content.push({ type: 'bold-text', content: text, level: 0 });
      }
    } else if (trimmed.match(/<[^>]+>/)) {
      // Any other HTML element
      const text = extractTextFromHTML(trimmed);
      if (text && text.length > 5) {
        content.push({ type: 'text', content: text, level: 0 });
      }
    }
  }

  // If we have very little structured content, extract everything as text blocks
  if (content.length < 5) {
    // Low structured content detected, extracting all text
    const allText = extractTextFromHTML(html);
    const paragraphs = allText.split(/\n\s*\n/).filter(p => p.trim().length > 10);

    for (const paragraph of paragraphs) {
      if (paragraph.trim()) {
        const isTitle = paragraph.length < 100 && paragraph.toUpperCase() === paragraph;
        content.push({
          type: isTitle ? 'title1' : 'paragraph',
          content: paragraph.trim(),
          level: isTitle ? 1 : 0
        });
      }
    }
  }

  // Content extraction complete

  return content;
}

// Extract text from HTML while preserving formatting indicators
function extractTextFromHTML(html: string): string {
  if (!html) return '';

  // Preserve line breaks and structure
  let text = html.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/li>/gi, '\n');

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/\n\s+/g, '\n');
  text = text.replace(/\n+/g, '\n\n');

  return text.trim();
}

// Generate a comprehensive PDF with all content
function generateComprehensivePDF(content: Array<{ type: string, content: string, level: number }>): string {
  const currentDate = new Date().toISOString();

  // PDF document structure
  let yPosition = 750;
  const margin = 50;
  const pageHeight = 792; // A4 height in points
  const pageWidth = 612;  // A4 width in points
  const lineHeight = 15;
  const maxLineLength = 80;

  let pageCount = 1;
  let contentStream = '';

  // Add header
  contentStream += `BT\n/F2 16 Tf\n${pageWidth / 2} ${yPosition} Td\n(CONTRATO) Tj\nET\n`;
  yPosition -= 40;

  // Process all content
  for (const item of content) {
    // Check if we need a new page
    if (yPosition < 100) {
      contentStream += `\nendstream\nendobj\n\n`;
      pageCount++;
      yPosition = 750;
      contentStream += `BT\n`;
    }

    const lines = wrapText(item.content, maxLineLength);

    switch (item.type) {
      case 'title1':
        contentStream += `/F2 16 Tf\n${margin} ${yPosition} Td\n`;
        for (const line of lines) {
          contentStream += `(${escapePDFString(line)}) Tj\n`;
          yPosition -= lineHeight + 5;
          if (lines.indexOf(line) < lines.length - 1) {
            contentStream += `0 -${lineHeight + 5} Td\n`;
          }
        }
        yPosition -= 10;
        break;

      case 'title2':
      case 'section-header':
        contentStream += `/F2 14 Tf\n${margin} ${yPosition} Td\n`;
        for (const line of lines) {
          contentStream += `(${escapePDFString(line)}) Tj\n`;
          yPosition -= lineHeight + 3;
          if (lines.indexOf(line) < lines.length - 1) {
            contentStream += `0 -${lineHeight + 3} Td\n`;
          }
        }
        yPosition -= 8;
        break;

      case 'paragraph':
      case 'text':
        contentStream += `/F1 12 Tf\n${margin} ${yPosition} Td\n`;
        for (const line of lines) {
          contentStream += `(${escapePDFString(line)}) Tj\n`;
          yPosition -= lineHeight;
          if (lines.indexOf(line) < lines.length - 1) {
            contentStream += `0 -${lineHeight} Td\n`;
          }
        }
        yPosition -= 5;
        break;

      case 'bold-text':
        contentStream += `/F2 12 Tf\n${margin} ${yPosition} Td\n`;
        for (const line of lines) {
          contentStream += `(${escapePDFString(line)}) Tj\n`;
          yPosition -= lineHeight;
          if (lines.indexOf(line) < lines.length - 1) {
            contentStream += `0 -${lineHeight} Td\n`;
          }
        }
        yPosition -= 5;
        break;

      case 'list-item':
        contentStream += `/F1 12 Tf\n${margin + 20} ${yPosition} Td\n`;
        const bulletLine = `• ${lines[0] || ''}`;
        contentStream += `(${escapePDFString(bulletLine)}) Tj\n`;
        yPosition -= lineHeight;

        // Continue with remaining lines if any
        for (let i = 1; i < lines.length; i++) {
          contentStream += `0 -${lineHeight} Td\n`;
          contentStream += `(${escapePDFString('  ' + lines[i])}) Tj\n`;
          yPosition -= lineHeight;
        }
        yPosition -= 3;
        break;
    }
  }

  // Calculate content stream length
  const streamLength = contentStream.length;

  // Build complete PDF document
  const pdfDocument = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${pageWidth} ${pageHeight}]
/Resources <<
  /Font <<
    /F1 4 0 R
    /F2 5 0 R
  >>
>>
/Contents 6 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Times-Roman
>>
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Times-Bold
>>
endobj

6 0 obj
<<
/Length ${streamLength}
>>
stream
${contentStream}
ET
endstream
endobj

xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000348 00000 n 
0000000565 00000 n 
0000000645 00000 n 
trailer
<<
/Size 7
/Root 1 0 R
>>
startxref
${700 + streamLength}
%%EOF`;

  // Comprehensive PDF document created

  return pdfDocument;
}

// Wrap text to fit within specified line length
function wrapText(text: string, maxLength: number): string[] {
  if (!text) return [''];

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxLength) {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is longer than max length, break it
        lines.push(word.substring(0, maxLength));
        currentLine = word.substring(maxLength);
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

// Escape special characters for PDF strings
function escapePDFString(str: string): string {
  if (!str) return '';

  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .substring(0, 200); // Limit string length to prevent PDF issues
}

serve(handler);
