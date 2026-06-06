import mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Validar se ficheiro é imagem
 */
export function validateImageFile(mimetype: string): void {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!mimetype || !allowedMimes.includes(mimetype)) {
    throw new Error(
      `Tipo de ficheiro inválido: ${mimetype}. Apenas JPEG, PNG e WebP são permitidos.`
    );
  }

  const ext = mime.extension(mimetype);
  if (!ext) {
    throw new Error('Extensão de ficheiro inválida');
  }
}

/**
 * Gerar nome único para ficheiro
 */
export function generateUniqueFilename(originalFilename: string): {
  filename: string;
  ext: string;
} {
  // Extrair extensão
  const parts = originalFilename.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : 'jpg';
  
  // Gerar UUID
  const uuid = uuidv4();
  const filename = `${uuid}.${ext}`;

  return { filename, ext };
}

/**
 * Gerar chaves S3 (caminhos) para diferentes tamanhos
 */
export function generateS3Keys(filename: string, galleryId: string): {
  originalKey: string;
  thumbnailKey: string;
  mediumKey: string;
  largeKey: string;
} {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const basePath = `${year}/${month}/${galleryId}`;

  return {
    originalKey: `${basePath}/original/${filename}`,
    thumbnailKey: `${basePath}/thumbnail/${filename}`,
    mediumKey: `${basePath}/medium/${filename}`,
    largeKey: `${basePath}/large/${filename}`,
  };
}

/**
 * Validar tamanho do ficheiro
 */
export function validateFileSize(fileSize: number, maxSizeInMB: number = 10): void {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  
  if (fileSize > maxSizeInBytes) {
    throw new Error(
      `Ficheiro muito grande. Tamanho máximo: ${maxSizeInMB}MB. Tamanho recebido: ${(fileSize / 1024 / 1024).toFixed(2)}MB`
    );
  }
}