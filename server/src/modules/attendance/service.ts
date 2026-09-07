import { PrismaClient } from '@prisma/client';
import { 
  MarkStudentAttendanceInput, 
  BulkStudentAttendanceInput, 
  MarkTeacherAttendanceInput, 
  GetAttendanceQuery 
} from './schema';

const prisma = new PrismaClient();

export class AttendanceService {
  async markStudentAttendance(schoolId: string, userId: string, data: MarkStudentAttendanceInput) {
    const recordDate = new Date(data.date);
    recordDate.setUTCHours(0, 0, 0, 0); // Normalize to start of day

    return prisma.studentAttendance.upsert({
      where: {
        studentId_date: {
          studentId: data.studentId,
          date: recordDate,
        }
      },
      update: {
        status: data.status,
        remarks: data.remarks,
        recordedBy: userId,
      },
      create: {
        studentId: data.studentId,
        batchId: data.batchId,
        schoolId,
        date: recordDate,
        status: data.status,
        remarks: data.remarks,
        recordedBy: userId,
      }
    });
  }

  async markBulkStudentAttendance(schoolId: string, userId: string, data: BulkStudentAttendanceInput) {
    const recordDate = new Date(data.date);
    recordDate.setUTCHours(0, 0, 0, 0);

    // Prisma doesn't have an upsertMany, so we use a transaction
    const operations = data.records.map(record => 
      prisma.studentAttendance.upsert({
        where: {
          studentId_date: {
            studentId: record.studentId,
            date: recordDate,
          }
        },
        update: {
          status: record.status,
          remarks: record.remarks,
          recordedBy: userId,
        },
        create: {
          studentId: record.studentId,
          batchId: data.batchId,
          schoolId,
          date: recordDate,
          status: record.status,
          remarks: record.remarks,
          recordedBy: userId,
        }
      })
    );

    return prisma.$transaction(operations);
  }

  async markTeacherAttendance(schoolId: string, data: MarkTeacherAttendanceInput) {
    const recordDate = new Date(data.date);
    recordDate.setUTCHours(0, 0, 0, 0);

    return prisma.teacherAttendance.upsert({
      where: {
        teacherId_date: {
          teacherId: data.teacherId,
          date: recordDate,
        }
      },
      update: {
        status: data.status,
        remarks: data.remarks,
        checkIn: data.checkIn ? new Date(data.checkIn) : null,
        checkOut: data.checkOut ? new Date(data.checkOut) : null,
      },
      create: {
        teacherId: data.teacherId,
        schoolId,
        date: recordDate,
        status: data.status,
        remarks: data.remarks,
        checkIn: data.checkIn ? new Date(data.checkIn) : null,
        checkOut: data.checkOut ? new Date(data.checkOut) : null,
      }
    });
  }

  async getStudentAttendance(schoolId: string, query: GetAttendanceQuery) {
    const where: any = { schoolId };

    if (query.date) {
      const targetDate = new Date(query.date);
      targetDate.setUTCHours(0, 0, 0, 0);
      where.date = targetDate;
    } else if (query.startDate && query.endDate) {
      where.date = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    if (query.batchId) where.batchId = query.batchId;
    if (query.studentId) where.studentId = query.studentId;

    return prisma.studentAttendance.findMany({
      where,
      include: {
        student: {
          select: { firstName: true, lastName: true, uin: true }
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  async getTeacherAttendance(schoolId: string, query: GetAttendanceQuery) {
    const where: any = { schoolId };

    if (query.date) {
      const targetDate = new Date(query.date);
      targetDate.setUTCHours(0, 0, 0, 0);
      where.date = targetDate;
    } else if (query.startDate && query.endDate) {
      where.date = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    if (query.teacherId) where.teacherId = query.teacherId;

    return prisma.teacherAttendance.findMany({
      where,
      include: {
        teacher: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { date: 'desc' }
    });
  }
}

export const attendanceService = new AttendanceService();
