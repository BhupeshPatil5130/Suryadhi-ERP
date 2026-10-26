  import { PrismaClient } from '@prisma/client';
import { UploadDocumentInput, VerifyDocumentInput } from './schema';

const prisma = new PrismaClient();

export class StudentService {
  async uploadDocument(data: UploadDocumentInput) {
    return prisma.studentDocument.create({
      data: {
        studentId: data.studentId,
        documentType: data.documentType,
        fileUrl: data.fileUrl,
      }
    });
  }

  async getDocuments(studentId: string) {
    return prisma.studentDocument.findMany({
      where: { studentId },
      orderBy: { uploadedAt: 'desc' }
    });
  }

  async verifyDocument(documentId: string, data: VerifyDocumentInput) {
    return prisma.studentDocument.update({
      where: { id: documentId },
      data: { verified: data.verified }
    });
  }

  async getStudentProfile(studentId: string) {
    return prisma.student.findUnique({
      where: { id: studentId },
      include: {
        parent: true,
        admissions: {
          include: { program: true, batch: true }
        },
        documents: true,
      }
    });
  }
}

export const studentService = new StudentService();
