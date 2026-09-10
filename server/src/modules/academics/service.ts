import { PrismaClient } from '@prisma/client';
import { 
  CreateSubjectInput, 
  CreateExamInput, 
  CreateAssessmentInput, 
  MarksEntryInput 
} from './schema';

const prisma = new PrismaClient();

export class AcademicsService {
  async createSubject(schoolId: string, data: CreateSubjectInput) {
    return prisma.subject.create({
      data: {
        schoolId,
        programId: data.programId,
        name: data.name,
        code: data.code,
        description: data.description,
      }
    });
  }

  async getSubjects(schoolId: string, programId?: string) {
    return prisma.subject.findMany({
      where: {
        schoolId,
        ...(programId && { programId }),
      },
      include: {
        program: { select: { name: true } }
      }
    });
  }

  async createExam(schoolId: string, data: CreateExamInput) {
    return prisma.exam.create({
      data: {
        schoolId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        academicYearId: data.academicYearId,
      }
    });
  }

  async getExams(schoolId: string, academicYearId?: string) {
    return prisma.exam.findMany({
      where: {
        schoolId,
        ...(academicYearId && { academicYearId }),
      },
      orderBy: { startDate: 'desc' }
    });
  }

  async createAssessment(data: CreateAssessmentInput) {
    return prisma.assessment.create({
      data: {
        examId: data.examId,
        subjectId: data.subjectId,
        maxMarks: data.maxMarks,
        passingMarks: data.passingMarks,
        date: data.date ? new Date(data.date) : null,
      }
    });
  }

  async enterMarks(userId: string, data: MarksEntryInput) {
    const operations = data.records.map(record => 
      prisma.marksEntry.upsert({
        where: {
          assessmentId_studentId: {
            assessmentId: data.assessmentId,
            studentId: record.studentId,
          }
        },
        update: {
          marksObtained: record.marksObtained,
          remarks: record.remarks,
          enteredBy: userId,
        },
        create: {
          assessmentId: data.assessmentId,
          studentId: record.studentId,
          marksObtained: record.marksObtained,
          remarks: record.remarks,
          enteredBy: userId,
        }
      })
    );

    return prisma.$transaction(operations);
  }

  async getMarks(assessmentId: string) {
    return prisma.marksEntry.findMany({
      where: { assessmentId },
      include: {
        student: { select: { firstName: true, lastName: true, uin: true } }
      }
    });
  }
}

export const academicsService = new AcademicsService();
