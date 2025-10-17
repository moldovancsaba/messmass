// lib/imgbbApi.ts
// WHAT: ImgBB API wrapper for image upload
// WHY: Upload partner logos to ImgBB for permanent hosting with CDN delivery

/**
 * WHAT: ImgBB API configuration
 * WHY: Centralize API settings for image upload service
 */
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

/**
 * WHAT: ImgBB upload response structure
 * WHY: Type safety for API responses
 */
export interface ImgBBUploadResponse {
  success: boolean;
  data?: {
    id: string;
    title: string;
    url: string;          // Direct image URL
    display_url: string;  // Display URL with viewer
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  error?: {
    message: string;
    code: number;
  };
}

/**
 * WHAT: Upload image to ImgBB from URL
 * WHY: Enable uploading partner logos from TheSportsDB URLs
 * @param imageUrl - URL of the image to upload (e.g., TheSportsDB badge URL)
 * @param name - Optional name for the uploaded image
 * @returns ImgBB upload response with permanent URL
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  name?: string
): Promise<ImgBBUploadResponse> {
  // WHAT: Validate API key
  // WHY: Prevent API calls with missing credentials
  if (!IMGBB_API_KEY) {
    return {
      success: false,
      error: {
        message: 'IMGBB_API_KEY environment variable is not set',
        code: 500
      }
    };
  }

  try {
    // WHAT: Download image from source URL
    // WHY: ImgBB requires base64 or binary data, not just URL
    console.log(`📥 Downloading image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      return {
        success: false,
        error: {
          message: `Failed to download image from URL: ${imageResponse.statusText}`,
          code: imageResponse.status
        }
      };
    }

    // WHAT: Convert image to base64
    // WHY: ImgBB API accepts base64 encoded images
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // WHAT: Prepare form data for ImgBB upload
    // WHY: ImgBB expects multipart form data with specific fields
    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Image);
    if (name) {
      formData.append('name', name);
    }

    console.log(`📤 Uploading to ImgBB...`);
    
    // WHAT: Upload to ImgBB API
    // WHY: Store image permanently with CDN delivery
    const uploadResponse = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    const result = await uploadResponse.json() as ImgBBUploadResponse;

    if (result.success && result.data) {
      console.log(`✅ Image uploaded successfully: ${result.data.url}`);
      return result;
    } else {
      console.error('❌ ImgBB upload failed:', result.error);
      return result;
    }

  } catch (error) {
    console.error('❌ Error uploading to ImgBB:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 500
      }
    };
  }
}

/**
 * WHAT: Upload partner badge from TheSportsDB to ImgBB
 * WHY: Specialized function for partner logo workflow
 * @param badgeUrl - TheSportsDB badge URL
 * @param partnerName - Partner name for image naming
 * @returns ImgBB direct URL or null if failed
 */
export async function uploadPartnerBadge(
  badgeUrl: string,
  partnerName: string
): Promise<string | null> {
  // WHAT: Sanitize partner name for filename
  // WHY: Create clean, URL-safe image names
  const sanitizedName = partnerName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const imageName = `partner-${sanitizedName}`;

  console.log(`🖼️  Uploading badge for partner: ${partnerName}`);
  
  const result = await uploadImageFromUrl(badgeUrl, imageName);

  if (result.success && result.data) {
    // WHAT: Return direct image URL
    // WHY: This URL can be embedded directly in <img> tags
    return result.data.url;
  }

  return null;
}

/**
 * WHAT: Validate ImgBB API key configuration
 * WHY: Check API key before attempting uploads
 * @returns true if API key is configured
 */
export function isImgBBConfigured(): boolean {
  return !!IMGBB_API_KEY && IMGBB_API_KEY.length > 0;
}

/**
 * WHAT: Test ImgBB connectivity and API key validity
 * WHY: Verify configuration before bulk operations
 * @returns true if ImgBB is accessible and API key is valid
 */
export async function testImgBBConnection(): Promise<boolean> {
  if (!isImgBBConfigured()) {
    console.error('❌ ImgBB API key not configured');
    return false;
  }

  try {
    // WHAT: Upload a 1x1 transparent PNG test image
    // WHY: Minimal data to validate API access
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY!);
    formData.append('image', testImage);
    formData.append('name', 'test-connection');

    const response = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    const result = await response.json() as ImgBBUploadResponse;

    if (result.success) {
      console.log('✅ ImgBB connection test successful');
      return true;
    } else {
      console.error('❌ ImgBB connection test failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ ImgBB connection test error:', error);
    return false;
  }
}
