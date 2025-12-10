import { v2 as cloudinary } from 'cloudinary';

export type FileUpload = {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => NodeJS.ReadableStream;
};

export async function uploaderFunction(
  file: Express.Multer.File
): Promise<string> {
  if (!file) {
    throw new Error('No file provided');
  }

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'map', 
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload failed'));
        }

        resolve(result.secure_url);
      }
    );
    uploadStream.end(file.buffer);
  });
}


export async function uploadImageFromGraphQL(image?: Promise<FileUpload>): Promise<string | undefined> {
  if (!image) return undefined;

  const upload = await image;             // resolve GraphQL Upload
  const stream = upload.createReadStream();
  const chunks: Uint8Array[] = [];

  const buffer: Buffer = await new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // We only need `buffer` for uploaderFunction
  const file = { buffer } as Express.Multer.File;

  return uploaderFunction(file);
}

export async function uploadManyImages(
  images?: Promise<FileUpload>[]
): Promise<string[]> {
  if (!images || images.length === 0) return [];

  const urls: string[] = [];

  for (const imgPromise of images) {
    if (!imgPromise) continue;

    const upload = await imgPromise;
    const stream = upload.createReadStream();
    const chunks: Uint8Array[] = [];

    const buffer: Buffer = await new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // Minimal Multer-like object – uploaderFunction only really needs buffer
    const file = { buffer } as Express.Multer.File;
    const url = await uploaderFunction(file);
    urls.push(url);
  }

  return urls;
}