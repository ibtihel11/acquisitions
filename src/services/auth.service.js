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
    throw new Error('Failed to hash password', { cause: e });
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  }
  catch (e) {
    logger.error('Error comparing password:', e);
    throw new Error('Failed to compare password', { cause: e });
  }
};

export const authenticateUser = async (email, password) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      throw new Error('User not found', { cause: new Error('No user exists for this email') });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid password', { cause: new Error('Password mismatch') });
    }

    return user;
  }
  catch (e) {
    if (e.message === 'User not found' || e.message === 'Invalid password') {
      throw new Error(e.message, { cause: e });
    }

    logger.error('Authentication failed:', e);
    throw new Error('Failed to authenticate user', { cause: e });
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      throw new Error('User with this email already exists', { cause: new Error('Duplicate email') });
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
      throw new Error(e.message, { cause: e });
    }
    logger.error('DB insert failed:', e);
    throw new Error('Failed to create user', { cause: e });
  }
};