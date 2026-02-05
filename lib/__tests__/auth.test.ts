import {
  hashPassword,
  comparePassword,
  createAdminUser,
  authenticateAdminUser,
  getAdminUserById,
  updateAdminUserPassword,
  updateAdminUserProfile,
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/prisma');
jest.mock('bcryptjs');

describe('Authentication Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password using bcryptjs', async () => {
      const hashedPassword = 'hashed_password_xyz';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await hashPassword('password123');

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await comparePassword('password123', 'hash');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hash');
    });

    it('should return false for non-matching passwords', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await comparePassword('wrong_password', 'hash');

      expect(result).toBe(false);
    });
  });

  describe('createAdminUser', () => {
    it('should create new admin user with hashed password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@novraux.com',
        password: 'hashed_password',
        name: 'Admin User',
        role: 'admin',
        isActive: true,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (prisma.adminUser.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await createAdminUser(
        'admin@novraux.com',
        'password123',
        'Admin User'
      );

      expect(result.email).toBe('admin@novraux.com');
      expect(result.password).toBe('hashed_password');
      expect(prisma.adminUser.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'admin@novraux.com',
          password: 'hashed_password',
          name: 'Admin User',
        }),
      });
    });
  });

  describe('authenticateAdminUser', () => {
    it('should authenticate user with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@novraux.com',
        password: 'hashed_password',
        name: 'Admin User',
        role: 'admin',
        isActive: true,
      };

      (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authenticateAdminUser(
        'admin@novraux.com',
        'password123'
      );

      expect(result.email).toBe('admin@novraux.com');
      expect(result.password).toBeUndefined(); // password should not be returned
      expect(prisma.adminUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@novraux.com' },
      });
    });

    it('should return null for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@novraux.com',
        password: 'hashed_password',
        isActive: true,
      };

      (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authenticateAdminUser(
        'admin@novraux.com',
        'wrong_password'
      );

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authenticateAdminUser(
        'unknown@novraux.com',
        'password123'
      );

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@novraux.com',
        password: 'hashed_password',
        isActive: false,
      };

      (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authenticateAdminUser(
        'admin@novraux.com',
        'password123'
      );

      expect(result).toBeNull();
    });
  });

  describe('getAdminUserById', () => {
    it('should retrieve user by ID without password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@novraux.com',
        password: 'hashed_password',
        name: 'Admin User',
        role: 'admin',
      };

      (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getAdminUserById('user-123');

      expect(result.email).toBe('admin@novraux.com');
      expect(result.password).toBeUndefined();
    });

    it('should return null if user not found', async () => {
      (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getAdminUserById('unknown-id');

      expect(result).toBeNull();
    });
  });

  describe('updateAdminUserPassword', () => {
    it('should update user password with hash', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@novraux.com',
        password: 'new_hashed_password',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
      (prisma.adminUser.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await updateAdminUserPassword('user-123', 'newpassword123');

      expect(prisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { password: 'new_hashed_password' },
      });
    });
  });

  describe('updateAdminUserProfile', () => {
    it('should update user name and/or email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'newemail@novraux.com',
        name: 'New Name',
        password: 'hashed',
      };

      (prisma.adminUser.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await updateAdminUserProfile('user-123', {
        name: 'New Name',
        email: 'newemail@novraux.com',
      });

      expect(result.email).toBe('newemail@novraux.com');
      expect(result.name).toBe('New Name');
      expect(result.password).toBeUndefined();
    });

    it('should handle partial updates', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@novraux.com',
        name: 'New Name',
        password: 'hashed',
      };

      (prisma.adminUser.update as jest.Mock).mockResolvedValue(mockUser);

      await updateAdminUserProfile('user-123', {
        name: 'New Name',
      });

      expect(prisma.adminUser.update).toHaveBeenCalled();
    });
  });
});
