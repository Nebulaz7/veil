import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as passport from 'passport';
import * as session from 'express-session';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as cookieParser from 'cookie-parser';
import * as sharedSession from 'express-socket.io-session';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
  origin: 'https://veil-io.vercel.app',
  credentials: true,
});

const sessionMiddleware = session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 24,
  },
});

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.use(sessionMiddleware);
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(passport.session());
  app.useWebSocketAdapter(
  new (class extends IoAdapter {
    createIOServer(port: number, options?: any): any {
      const server = super.createIOServer(port, options);
      server.use(sharedSession(sessionMiddleware, {
        autoSave: true,
      }));
      return server;
    }
  })(app),
);
  
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
