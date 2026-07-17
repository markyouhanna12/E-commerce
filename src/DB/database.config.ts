import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const mongooseConfig = (
  configService: ConfigService,
): MongooseModuleOptions => ({
  uri: configService.get<string>('DB_URI'),

  onConnectionCreate: (connection: Connection) => {
    connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    connection.on('error', (err) => {
      console.error('MongoDB Error:', err);
    });

    return connection;
  },
});
