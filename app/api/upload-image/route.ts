// app/api/upload-image/route.ts
// WHAT: Upload images to ImgBB and return URL
// WHY: Partner report images need reliable hosting
// HOW: Accept file upload, send to ImgBB API, return URL

import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';

const IMGBB_API_KEY = config.imgbbApiKey;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

/**
 * POST /api/upload-image
 * Uploads an image to ImgBB and returns the URL
 * 
 * Expects multipart/form-data with 'image' field (base64 or file)
 * Returns: { success: true, url: string, deleteUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const formData = await request.formData();
    const image = formData.get('image');
    
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      );
    }
    
    // WHAT: Check if ImgBB API key is configured
    // WHY: Cannot upload without API key
    if (!IMGBB_API_KEY) {
      console.error('❌ ImgBB API key not configured');
      return NextResponse.json(
        { success: false, error: 'Image upload not configured' },
        { status: 500 }
      );
    }
    
    // WHAT: Convert image to base64 if it's a File object
    // WHY: ImgBB API expects base64-encoded image
    let base64Image: string;
    
    if (image instanceof File) {
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64Image = buffer.toString('base64');
    } else if (typeof image === 'string') {
      // Already base64
      base64Image = image;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid image format' },
        { status: 400 }
      );
    }
    
    // WHAT: Upload to ImgBB
    // WHY: ImgBB provides reliable image hosting with CDN
    const imgbbFormData = new FormData();
    imgbbFormData.append('key', IMGBB_API_KEY);
    imgbbFormData.append('image', base64Image);
    
    console.log('📤 Uploading image to ImgBB...');
    
    const imgbbResponse = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      body: imgbbFormData,
    });
    
    const imgbbData = await imgbbResponse.json();
    
    if (!imgbbData.success) {
      console.error('❌ ImgBB upload failed:', imgbbData);
      return NextResponse.json(
        { 
          success: false, 
          error: imgbbData.error?.message || 'Failed to upload image' 
        },
        { status: 500 }
      );
    }
    
    // WHAT: Extract URLs from ImgBB response
    // WHY: Return both display URL and delete URL to client
    const imageUrl = imgbbData.data.url; // Full image URL
    const deleteUrl = imgbbData.data.delete_url; // URL to delete image
    const thumbnailUrl = imgbbData.data.thumb?.url; // Thumbnail URL
    
    console.log('✅ Image uploaded successfully:', imageUrl);
    
    return NextResponse.json({
      success: true,
      url: imageUrl,
      thumbnail: thumbnailUrl,
      deleteUrl: deleteUrl,
      meta: {
        size: imgbbData.data.size,
        width: imgbbData.data.width,
        height: imgbbData.data.height,
        uploadedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Image upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload image' 
      },
      { status: 500 }
    );
  }
}
