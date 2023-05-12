import * as cloudinary from 'cloudinary';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { FilesService } from './files.service';
import { fileFilter } from './helpers';

@ApiTags('Files - Get and Upload')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  @Get('product/:imageName')
  findProductImage(@Param('imageName') imageName: string) {
    console.log(imageName);

    return imageName;
    // return this.filesService.findProductImage(imageName);
  }

  @Post('product')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter,
      // limits:filesize:10000
      storage: diskStorage({
        destination: './static/products',
      }),
    }),
  )
  async uploadProductFile(@UploadedFile() file: Express.Multer.File) {
    if (!file)
      throw new BadRequestException('Make sure that the file is an image');

    const result = await cloudinary.v2.uploader.upload(file.path);

    fs.unlink(file.path, (err) => {
      if (err) throw err;
      console.log(`${file.path} has been deleted`);
    });

    return result;
  }
}
