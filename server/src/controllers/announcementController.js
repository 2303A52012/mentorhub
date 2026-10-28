import prisma from '../config/prisma.js';

async function isVisibleTo(announcement, userId, userRole) {
  if (['ADMIN', 'MENTOR'].includes(userRole)) return true;
  const { audience, targetIds } = announcement;
  if (audience === 'ALL') return true;
  if (audience === 'INDIVIDUAL') return targetIds.includes(userId);
  if (audience === 'BATCH') {
    const bm = await prisma.batchMentee.findFirst({ where: { menteeId: userId, batchId: { in: targetIds } } });
    return !!bm;
  }
  if (audience === 'MENTOR_GROUP') {
    const asgn = await prisma.mentorMenteeAssignment.findFirst({ where: { menteeId: userId, mentorId: { in: targetIds }, status: 'ACTIVE' } });
    return !!asgn;
  }
  return false;
}

export const getAnnouncements = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    if (role === 'TRAINER') {
      return res.status(403).json({ success: false, message: 'Forbidden: Announcements are not available for trainers.' });
    }
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    let audienceWhere = {};
    if (role === 'ADMIN') {
      audienceWhere = {};
    } else if (role === 'MENTOR') {
      audienceWhere = { OR: [{ audience: 'ALL' }, { createdById: userId }, { audience: 'MENTOR_GROUP', targetIds: { has: userId } }] };
    } else {
      const myBatches = await prisma.batchMentee.findMany({ where: { menteeId: userId }, select: { batchId: true } });
      const batchIds = myBatches.map(b => b.batchId);
      const myMentor = await prisma.mentorMenteeAssignment.findFirst({ where: { menteeId: userId, status: 'ACTIVE' }, select: { mentorId: true } });
      const orClauses = [{ audience: 'ALL' }, { audience: 'INDIVIDUAL', targetIds: { has: userId } }];
      if (batchIds.length) orClauses.push({ audience: 'BATCH', targetIds: { hasSome: batchIds } });
      if (myMentor) orClauses.push({ audience: 'MENTOR_GROUP', targetIds: { has: myMentor.mentorId } });
      audienceWhere = { OR: orClauses };
    }
    const where = { AND: [audienceWhere, { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] }] };
    const [total, announcements] = await Promise.all([
      prisma.announcement.count({ where }),
      prisma.announcement.findMany({ where, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }], skip, take: limit, include: { createdBy: { select: { id: true, name: true, role: true } }, reads: { where: { userId }, select: { id: true } } } })
    ]);
    const formatted = announcements.map(a => ({ ...a, isRead: a.reads.length > 0, reads: undefined }));
    return res.json({ success: true, total, page, limit, announcements: formatted });
  } catch (err) { next(err); }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const { title, content, audience = 'ALL', targetIds = [], isPinned = false, expiresAt } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ success: false, message: 'Title and content are required.' });
    if (role === 'MENTOR' && !['ALL', 'MENTOR_GROUP', 'INDIVIDUAL'].includes(audience)) return res.status(403).json({ success: false, message: 'Mentors can only post to their mentees.' });
    if (role === 'TRAINER') return res.status(403).json({ success: false, message: 'Trainers cannot post announcements.' });
    const resolvedTargetIds = audience === 'MENTOR_GROUP' && role === 'MENTOR' && targetIds.length === 0 ? [userId] : targetIds;
    const announcement = await prisma.announcement.create({ data: { title: title.trim(), content: content.trim(), createdById: userId, audience, targetIds: resolvedTargetIds, isPinned: role === 'ADMIN' ? isPinned : false, expiresAt: expiresAt ? new Date(expiresAt) : null }, include: { createdBy: { select: { id: true, name: true, role: true } } } });
    return res.status(201).json({ success: true, announcement });
  } catch (err) { next(err); }
};

export const getAnnouncementById = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id }, include: { createdBy: { select: { id: true, name: true, role: true } }, reads: { select: { userId: true, readAt: true, user: { select: { id: true, name: true } } } } } });
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found.' });
    if (!(await isVisibleTo(announcement, userId, role))) return res.status(403).json({ success: false, message: 'Access denied.' });
    return res.json({ success: true, announcement: { ...announcement, isRead: announcement.reads.some(r => r.userId === userId) } });
  } catch (err) { next(err); }
};

export const updateAnnouncement = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Announcement not found.' });
    if (existing.createdById !== userId && role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Permission denied.' });
    const { title, content, audience, targetIds, isPinned, expiresAt } = req.body;
    const announcement = await prisma.announcement.update({ where: { id: req.params.id }, data: { ...(title ? { title: title.trim() } : {}), ...(content ? { content: content.trim() } : {}), ...(audience ? { audience } : {}), ...(targetIds ? { targetIds } : {}), ...(role === 'ADMIN' && isPinned !== undefined ? { isPinned } : {}), ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}) }, include: { createdBy: { select: { id: true, name: true, role: true } } } });
    return res.json({ success: true, announcement });
  } catch (err) { next(err); }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const existing = await prisma.announcement.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Announcement not found.' });
    if (existing.createdById !== userId && role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Permission denied.' });
    await prisma.announcement.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Announcement deleted.' });
  } catch (err) { next(err); }
};

export const markAnnouncementRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await prisma.announcementRead.upsert({ where: { announcementId_userId: { announcementId: req.params.id, userId } }, create: { announcementId: req.params.id, userId }, update: { readAt: new Date() } });
    return res.json({ success: true });
  } catch (err) { next(err); }
};
