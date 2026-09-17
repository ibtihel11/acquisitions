import logger from '#config/logger.js';
import { signInSchema, signUpSchema } from '#validations/auth.val.js';
import { formatValidationError } from '#utils/format.js';
import { authenticateUser, createUser } from '#services/auth.service.js';
import { jwttoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

export const signup = async (req, res, next) => {
  try {
    const validationResult = signUpSchema.safeParse(req.body);
    if (!validationResult.success) {
      logger.warn('Signup validation failed', validationResult.error);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: formatValidationError(validationResult.error) 
      });
    }

    const { name, email, password, role } = validationResult.data;

    const user = await createUser({ name, email, password, role});
    
    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    cookies.set(res, 'token', token);
    
    logger.info(`Signing up user: ${email}`);

    res.status(201).json({ 
      message: 'User signed up successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (e) {
    logger.error('Signup error', e);
    if (e.message == 'User with this email already exists') {
      return res.status(409).json({ error: 'email exists' });
    }
    next(e);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const validationResult = signInSchema.safeParse(req.body);
    if (!validationResult.success) {
      logger.warn('Signin validation failed', validationResult.error);
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error)
      });
    }

    const { email, password } = validationResult.data;
    const user = await authenticateUser(email, password);

    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    cookies.set(res, 'token', token);

    logger.info(`Signing in user: ${email}`);

    res.status(200).json({
      message: 'User signed in successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    logger.error('Signin error', e);
    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'user not found' });
    }
    if (e.message === 'Invalid password') {
      return res.status(401).json({ error: 'Invalid password' });
    }
    next(e);
  }
};

export const signOut = async (req, res, next) => {
  try {
    cookies.clear(res, 'token');

    logger.info('Signing out user');

    res.status(200).json({
      message: 'User signed out successfully'
    });
  } catch (e) {
    logger.error('Signout error', e);
    next(e);
  }
};