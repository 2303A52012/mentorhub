import prisma from '../config/prisma.js';

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        readAt: null
      }
    });

    const formatted = notifications.map((n) => ({
      ...n,
      _id: n.id
    }));

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications: formatted
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const notification = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() }
    });

    return res.status(200).json({
      success: true,
      notification: { ...notification, _id: notification.id }
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;

    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
};
