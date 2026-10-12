import prisma from '../config/prisma.js';
import {
  parseAndValidateFile,
  executeImport,
  generateSampleTemplate
} from '../services/bulkImportService.js';

export const previewImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.'
      });
    }

    const customMapping = req.body.columnMapping ? JSON.parse(req.body.columnMapping) : null;
    const result = await parseAndValidateFile(
      req.file.buffer,
      req.file.originalname,
      customMapping
    );

    const preview = {
      importSessionId: result.importId,
      importId: result.importId,
      filename: result.fileName,
      fileSize: result.fileSize,
      detectedMapping: result.detectedMapping,
      rawHeaders: result.rawHeaders,
      totalRows: result.summary.totalRows,
      validRows: result.summary.validRows,
      invalidRows: result.summary.invalidRows,
      newStudentsCount: result.summary.newStudentsCount,
      existingStudentsCount: result.summary.existingStudentsCount,
      uniqueMentorsCount: result.summary.uniqueMentorsCount,
      duplicateRollsCount: result.summary.duplicateRollsCount,
      conflictsCount: result.summary.conflictsCount,
      summary: result.summary,
      previewRows: result.previewRows || [],
      validatedRows: result.previewRows || [],
      uniqueMentors: result.uniqueMentors,
      conflicts: result.conflicts
    };

    return res.status(200).json({
      success: true,
      message: 'File parsed and validated successfully.',
      preview,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const confirmImport = async (req, res, next) => {
  try {
    const { importId, importSessionId, importMode = 'CREATE', columnMapping } = req.body;
    const actorId = req.user.id || req.user._id;
    const targetSessionId = importId || importSessionId;

    if (!targetSessionId) {
      return res.status(400).json({
        success: false,
        message: 'importId / importSessionId is required to execute the import.'
      });
    }

    const result = await executeImport(
      targetSessionId,
      importMode,
      columnMapping,
      actorId
    );

    return res.status(200).json({
      success: true,
      message: 'Bulk data imported successfully.',
      result,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const getImportHistory = async (req, res, next) => {
  try {
    const history = await prisma.importHistory.findMany({
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formattedHistory = history.map((h) => ({
      _id: h.id,
      id: h.id,
      fileName: h.fileName,
      fileSize: h.fileSize,
      fileType: h.fileType,
      importMode: h.importMode,
      actorId: h.actor ? { ...h.actor, _id: h.actor.id } : null,
      totalRows: h.totalRows,
      validRows: h.validRows,
      invalidRows: h.invalidRows,
      studentsCreated: h.studentsCreated,
      studentsUpdated: h.studentsUpdated,
      studentsSkipped: h.studentsSkipped,
      mentorsCreated: h.mentorsCreated,
      mentorsUpdated: h.mentorsUpdated,
      relationshipsCreated: h.relationshipsCreated,
      relationshipsUpdated: h.relationshipsUpdated,
      failedCount: h.failedCount,
      status: h.status,
      createdAt: h.createdAt
    }));

    return res.status(200).json({
      success: true,
      count: formattedHistory.length,
      history: formattedHistory
    });
  } catch (error) {
    next(error);
  }
};

export const getImportHistoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const history = await prisma.importHistory.findUnique({
      where: { id },
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Import history record not found.'
      });
    }

    return res.status(200).json({
      success: true,
      history: {
        ...history,
        _id: history.id,
        actorId: history.actor ? { ...history.actor, _id: history.actor.id } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const exportImportErrors = async (req, res, next) => {
  try {
    const { id } = req.params;

    const history = await prisma.importHistory.findUnique({
      where: { id }
    });

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Import history record not found.'
      });
    }

    const errors = Array.isArray(history.errorDetails) ? history.errorDetails : [];
    const headers = ['Row Number', 'Roll Number', 'Student / Mentor Name', 'Error Details'];
    const csvRows = [
      headers.join(','),
      ...errors.map((e) =>
        [
          e.rowIndex || 'N/A',
          `"${(e.rollNumber || '').replace(/"/g, '""')}"`,
          `"${(e.name || e.mentor?.name || '').replace(/"/g, '""')}"`,
          `"${(e.message || '').replace(/"/g, '""')}"`
        ].join(',')
      )
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="import-errors-${history.fileName.replace(/[^a-zA-Z0-9]/g, '_')}.csv"`
    );
    return res.status(200).send(csvRows.join('\n'));
  } catch (error) {
    next(error);
  }
};

export const downloadTemplate = async (req, res, next) => {
  try {
    const { format = 'xlsx' } = req.query;

    if (format === 'csv') {
      const csvContent = generateSampleTemplate('csv');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="2024-28_Group-6_Mentor_Mapping_Template.csv"'
      );
      return res.status(200).send(csvContent);
    }

    const excelBuffer = generateSampleTemplate('xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="2024-28_Group-6_Mentor_Mapping_Template.xlsx"'
    );
    return res.status(200).send(excelBuffer);
  } catch (error) {
    next(error);
  }
};
