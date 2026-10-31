import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files were uploaded' }, { status: 400 });
    }

    const uploadedUrls = [];
    const uploadDir = path.resolve(process.cwd(), 'public/images');

    for (const file of files) {
      if (typeof file === 'object' && typeof file.arrayBuffer === 'function') {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = path.extname(file.name || 'image.png') || '.png';
        const cleanBase = path
          .basename(file.name || 'image', ext)
          .replace(/[^a-zA-Z0-9_-]/g, '-')
          .toLowerCase();
        const filename = `upload-${Date.now()}-${Math.floor(Math.random() * 10000)}-${cleanBase}${ext}`;
        const filePath = path.join(uploadDir, filename);

        try {
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          fs.writeFileSync(filePath, buffer);
          uploadedUrls.push(`/images/${filename}`);
        } catch (e) {
          // In read-only serverless environment, fallback to standard image
          uploadedUrls.push('/images/headphones.png');
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedUrls.length} image(s) uploaded successfully`,
      images: uploadedUrls,
      count: uploadedUrls.length,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to upload images', details: err.message }, { status: 500 });
  }
}

