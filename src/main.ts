import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './Common/Filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import { LoggingIntercepotor } from './Common/Interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingIntercepotor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 5000, () => {
    console.log(`Server is running on port ${process.env.PORT ?? 5000}`);
  });
}
bootstrap();
