import { HydratedDocument } from 'mongoose';
import { User } from 'src/DB/Schemas/user.schema';

export type UserDocument = HydratedDocument<User>;
