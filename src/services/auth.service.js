import bcrypt from 'bcrypt';
import logger from '#config/logger.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';
import { db } from '#config/database.js';

export const hashPassword = async(password) => {
  try {
    return await bcrypt.hash(password, 10);
  }
  catch (e) {
    logger.error('Error hashing password:', e);
    throw new Error('Failed to hash password');
  }
};
export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({ name, email, password: hashedPassword, role })
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    logger.info(`User created: ${newUser.email}`);

    return newUser;
  } catch (e) {
    if (e.message === 'User with this email already exists') {
      throw e; 
    }
    logger.error('DB insert failed:', e);
    throw new Error('Failed to create user');
  }
};