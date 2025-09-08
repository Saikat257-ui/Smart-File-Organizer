import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs'

export class FileProcessor {
  static async extractTextFromDocx(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer })
      return {
        success: true,
        text: result.value,
        wordCount: result.value.split(/\s+/).length
      }
    } catch (error) {
      console.error('DOCX processing error:', error)
      return {
        success: false,
        error: error.message,
        text: ''
      }
    }
  }

  static async extractTextFromPdf(buffer) {
    try {
      // Setting up the worker source is important for pdfjs-dist
      await (pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`)
      const doc = await pdfjsLib.getDocument({ data: buffer }).promise
      let text = ''
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const content = await page.getTextContent()
        const strings = content.items.map(item => item.str)
        text += strings.join(' ') + '\n'
      }
      return {
        success: true,
        text: text,
        pages: doc.numPages,
        wordCount: text.split(/\s+/).length
      }
    } catch (error) {
      console.error('PDF processing error:', error)
      return {
        success: false,
        error: error.message,
        text: ''
      }
    }
  }

  static async processFile(buffer, mimeType, fileName) {
    const fileExtension = fileName.split('.').pop()?.toLowerCase()
    
    // Process DOCX files
    if (mimeType?.includes('wordprocessingml') || 
        mimeType?.includes('msword') || 
        fileExtension === 'docx' || 
        fileExtension === 'doc') {
      return await this.extractTextFromDocx(buffer)
    }
    
    // Process PDF files
    if (mimeType?.includes('pdf') || fileExtension === 'pdf') {
      return await this.extractTextFromPdf(buffer)
    }
    
    // Process plain text files
    if (mimeType?.includes('text/plain') || 
        fileExtension === 'txt' || 
        fileExtension === 'md') {
      try {
        const text = buffer.toString('utf-8')
        return {
          success: true,
          text: text,
          wordCount: text.split(/\s+/).length
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
          text: ''
        }
      }
    }
    
    return {
      success: false,
      error: 'Unsupported file type',
      text: ''
    }
  }

  static extractKeywords(text, maxKeywords = 10) {
    if (!text) return []
    
    // Simple keyword extraction
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
    
    // Count word frequency
    const wordCount = {}
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })
    
    // Sort by frequency and return top keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word)
  }

  static analyzeFileContent(text) {
    if (!text) return null
    
    const analysis = {
      wordCount: text.split(/\s+/).length,
      charCount: text.length,
      keywords: this.extractKeywords(text),
      hasNumbers: /\d/.test(text),
      hasEmails: /@/.test(text),
      hasUrls: /https?:\/\//.test(text),
      language: 'en', // Simple assumption
      readingTime: Math.ceil(text.split(/\s+/).length / 200) // ~200 words per minute
    }
    
    // Detect document type based on content
    if (text.includes('invoice') || text.includes('bill') || text.includes('payment')) {
      analysis.documentType = 'financial'
    } else if (text.includes('contract') || text.includes('agreement')) {
      analysis.documentType = 'legal'
    } else if (text.includes('report') || text.includes('analysis')) {
      analysis.documentType = 'report'
    } else if (text.includes('meeting') || text.includes('agenda')) {
      analysis.documentType = 'meeting'
    } else {
      analysis.documentType = 'general'
    }
    
    return analysis
  }
}