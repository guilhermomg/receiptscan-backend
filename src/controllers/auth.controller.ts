/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../middleware/errorHandler';
import { UpdateUserProfileDto } from '../models/user.model';
import logger from '../config/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { displayName } = req.body;

      const userProfile = await this.authService.registerUser(
        req.user.uid,
        req.user.email,
        displayName
      );

      logger.info('User registered', {
        requestId: req.requestId,
        userId: userProfile.userId,
      });

      res.status(201).json({
        status: 'success',
        data: {
          user: userProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const userProfile = await this.authService.getUserProfile(req.user.uid);

      if (!userProfile) {
        throw new AppError('User profile not found', 404);
      }

      logger.debug('User profile retrieved', {
        requestId: req.requestId,
        userId: userProfile.userId,
      });

      res.status(200).json({
        status: 'success',
        data: {
          user: userProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { displayName, subscriptionTier } = req.body;

      if (!displayName && !subscriptionTier) {
        throw new AppError('At least one field must be provided for update', 400);
      }

      const updates: UpdateUserProfileDto = {};
      if (displayName) updates.displayName = displayName;
      if (subscriptionTier) updates.subscriptionTier = subscriptionTier;

      const updatedProfile = await this.authService.updateUserProfile(req.user.uid, updates);

      logger.info('User profile updated', {
        requestId: req.requestId,
        userId: updatedProfile.userId,
      });

      res.status(200).json({
        status: 'success',
        data: {
          user: updatedProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
