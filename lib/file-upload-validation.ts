/**
 * Validates file uploads for payment proof documents
 * Only allows image files (JPEG, PNG, PDF) to prevent malicious uploads
 */
export function validateFileUpload(file: {
  mimetype?: string | null;
  originalFilename?: string | null;
  size?: number;
}): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Maximum file size: 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size && file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Allowed MIME types for payment proofs
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'image/webp'
  ];

  // Validate MIME type
  const mimetype = file.mimetype || null;
  if (!mimetype || !allowedMimeTypes.includes(mimetype.toLowerCase())) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, PDF, and WebP files are allowed.'
    };
  }

  // Additional validation: check file extension
  if (file.originalFilename) {
    const extension = file.originalFilename.toLowerCase().split('.').pop();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'webp'];
    
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'Invalid file extension. Only .jpg, .jpeg, .png, .pdf, and .webp files are allowed.'
      };
    }
  }

  return { valid: true };
}

