import { gql } from '@/common/services/graphql';
import type { CurrentCalendar } from '../types';

const CURRENT_CALENDAR = `
  query CurrentCalendar {
    currentAcademicCalendar {
      id
      status
      academicYearId
      academicYearName
      summary {
        totalDays workingDays publicHolidayDays weeklyHolidayDays
        vacationDays examDays
      }
      days {
        date dayType hasExam hasEvent semesterStart semesterEnd
        holidays { id name holidayType }
      }
      events { id name eventType description eventDate appliesTo }
      examWindows { id name examType description startDate endDate }
    }
  }
`;

export const academicCalendarService = {
  /**
   * The published calendar for the school's active year, already narrowed by
   * the server to what this caller may see. Null when the school has not
   * published one — a draft is the school still deciding.
   */
  getCurrent: async (): Promise<CurrentCalendar | null> => {
    const data = await gql<{ currentAcademicCalendar: CurrentCalendar | null }>(
      CURRENT_CALENDAR
    );
    return data.currentAcademicCalendar ?? null;
  },
};
