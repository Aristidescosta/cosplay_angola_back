import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

// Em hosts com pouca memória (ex: Render free tier, 512MB), a cache
// interna do libvips e o processamento concorrente facilmente estouram
// o limite ao processar fotos grandes. Isto mantém o pico de memória
// baixo à custa de um pouco de velocidade.
sharp.cache(false);
sharp.concurrency(1);

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ProcessedImages {
  original: string;
  thumbnail: string;
  medium: string;
  large: string;
  dimensions: ImageDimensions;
  fileSize: number;
}

export interface ProcessedBuffers {
  buffers: {
    original: Buffer;
    thumbnail: Buffer;
    medium: Buffer;
    large: Buffer;
  };
  dimensions: ImageDimensions;
  fileSize: number;
}

/**
 * Processar imagem: gerar múltiplos tamanhos
 */
export class ImageProcessor {
  private static SIZES = {
    thumbnail: 400,   // 400px de largura
    medium: 800,      // 800px de largura
    large: 1920,      // 1920px de largura (Full HD)
  };

  /**
   * Processar upload de imagem
   */
  static async processUpload(
    buffer: Buffer,
    filename: string,
    uploadDir: string = './uploads'
  ): Promise<ProcessedImages> {
    // Obter dimensões da imagem original
    const metadata = await sharp(buffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Não foi possível obter dimensões da imagem');
    }

    const dimensions: ImageDimensions = {
      width: metadata.width,
      height: metadata.height,
    };

    // Garantir que as pastas existem
    await this.ensureDirectories(uploadDir);

    // Gerar caminhos
    const paths = {
      original: path.join(uploadDir, 'originals', filename),
      thumbnail: path.join(uploadDir, 'thumbnails', filename),
      medium: path.join(uploadDir, 'medium', filename),
      large: path.join(uploadDir, 'large', filename),
    };

    // Salvar original
    await sharp(buffer)
      .jpeg({ quality: 95 }) // alta qualidade para original
      .toFile(paths.original);

    // Gerar thumbnail (400px)
    await sharp(buffer)
      .resize(this.SIZES.thumbnail, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(paths.thumbnail);

    // Gerar medium (800px)
    await sharp(buffer)
      .resize(this.SIZES.medium, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(paths.medium);

    // Gerar large (1920px) com watermark
    await sharp(buffer)
      .resize(this.SIZES.large, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 90 })
      .toFile(paths.large);

    // Obter tamanho do ficheiro original
    const stats = await fs.stat(paths.original);

    return {
      original: paths.original,
      thumbnail: paths.thumbnail,
      medium: paths.medium,
      large: paths.large,
      dimensions,
      fileSize: stats.size,
    };
  }

  /**
   * Processar imagem em memória — retorna buffers para cada tamanho (sem escrever em disco)
   */
  static async processToBuffers(buffer: Buffer): Promise<ProcessedBuffers> {
    // Trava imagens absurdamente grandes com um erro limpo (apanhado pelo
    // controller, devolve 400) em vez de arriscar um crash nativo do
    // libvips por falta de memória a meio do processamento.
    const pipeline = sharp(buffer, { limitInputPixels: 60_000_000 });
    const metadata = await pipeline.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Não foi possível obter dimensões da imagem');
    }

    // O "original" deixa de passar pelo Sharp — guardamos exatamente os
    // bytes recebidos, sem descodificar/reencodar. Isso poupa uma
    // operação inteira (a mais pesada, porque não tem resize a aliviar)
    // e evita um problema pré-existente: o Sharp forçava sempre JPEG,
    // mesmo quando o ficheiro original era PNG/WebP.
    const original = buffer;

    // Um `.clone()` do mesmo pipeline em vez de `sharp(buffer)` a cada
    // versão — evita reanalisar o ficheiro de origem a cada tamanho
    // (padrão recomendado pelo Sharp). Corre sequencialmente (não
    // Promise.all): gerar várias versões em paralelo significa ter
    // várias imagens descodificadas em memória ao mesmo tempo, fácil de
    // estourar a memória do servidor.
    const thumbnail = await pipeline
      .clone()
      .resize(this.SIZES.thumbnail, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    const medium = await pipeline
      .clone()
      .resize(this.SIZES.medium, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    const large = await pipeline
      .clone()
      .resize(this.SIZES.large, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    return {
      buffers: { original, thumbnail, medium, large },
      dimensions: { width: metadata.width, height: metadata.height },
      fileSize: original.length,
    };
  }

  /**
   * Adicionar watermark à imagem
   * (simplificado por agora, pode ser melhorado depois)
   */
  static async addWatermark(
    inputPath: string,
    outputPath: string,
    watermarkText: string = 'Cosplay Angola'
  ): Promise<void> {
    // Por agora vamos pular o watermark
    // Em produção, podes usar sharp composite com uma imagem PNG de watermark
    // ou usar biblioteca específica como jimp
    
    // Simplesmente copiar o ficheiro
    const buffer = await fs.readFile(inputPath);
    await fs.writeFile(outputPath, buffer);
  }

  /**
   * Apagar todas as versões de uma imagem
   */
  static async deleteImage(
    filename: string,
    uploadDir: string = './uploads'
  ): Promise<void> {
    const paths = [
      path.join(uploadDir, 'originals', filename),
      path.join(uploadDir, 'thumbnails', filename),
      path.join(uploadDir, 'medium', filename),
      path.join(uploadDir, 'large', filename),
    ];

    await Promise.all(
      paths.map(async (p) => {
        try {
          await fs.unlink(p);
        } catch (error) {
          // Ignorar se ficheiro não existe
        }
      })
    );
  }

  /**
   * Garantir que os diretórios existem
   */
  private static async ensureDirectories(uploadDir: string): Promise<void> {
    const dirs = [
      path.join(uploadDir, 'originals'),
      path.join(uploadDir, 'thumbnails'),
      path.join(uploadDir, 'medium'),
      path.join(uploadDir, 'large'),
    ];

    await Promise.all(
      dirs.map((dir) => fs.mkdir(dir, { recursive: true }))
    );
  }

  /**
   * Extrair metadata EXIF (para implementação futura)
   */
  static async extractMetadata(buffer: Buffer): Promise<any> {
    const metadata = await sharp(buffer).metadata();
    
    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      space: metadata.space,
      channels: metadata.channels,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      exif: metadata.exif, // dados EXIF se existirem
    };
  }
}