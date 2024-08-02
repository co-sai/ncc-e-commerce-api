import { Module, ValidationPipe, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_PIPE, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { RoleSeedModule } from './seed/role/role.seed.module';
import { SuperAdminSeedingModule } from './seed/super_admin_account/super-admin.seed.module';

import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './utils/logger.config';
import { LoggerMiddleware } from './utils/logger.middleware';
import { AllExceptionsFilter } from './utils/all-exceptions.filter';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        return {
          uri: uri,
        };
      },
      inject: [ConfigService],
    }),
    WinstonModule.forRoot(winstonConfig),
    // Serve the 'uploads' folder statically
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), // Specify the path to your 'uploads' folder
      serveRoot: '/uploads', // Base URL under which the files should be accessible from the frontend
    }),
    AdminModule,
    AuthModule,
    MailModule,
    RoleSeedModule,
    SuperAdminSeedingModule,
    CategoryModule,
    ProductModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true
      })
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter
    }
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}