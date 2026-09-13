import { apiPost, ApiException } from "@/common/services/api";

/**
 * Campus / programme / grade / medium / academic-cycle reads — the same data
 * admin-web's Create Class form reads, over the same `/api/graphql` endpoint
 * (these five have no REST list route; admin-web's own reads went GraphQL-only
 * a while back). Auth/tenant headers are identical to REST — `apiPost` already
 * attaches them — so this is a thin transport, not a new API.
 */

export interface SchoolUnit {
  id: string;
  name: string;
  code: string;
}

export interface AcademicProgramme {
  id: string;
  name: string;
  board: string;
  medium: string | null;
  medium_id: string | null;
  code: string;
  status: string;
}

export interface Grade {
  id: string;
  name: string;
  sequence: number;
}

export interface MediumDto {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
}

export interface AcademicCycle {
  id: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  cycleKind: string;
}

type GraphQLError = { message: string };
type GraphQLReply<T> = { data?: T | null; errors?: GraphQLError[] };

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const reply = await apiPost<GraphQLReply<T>>("/api/graphql", {
    query,
    variables: variables ?? {},
  });
  const failure = reply.errors?.[0];
  if (failure) {
    throw new ApiException(failure.message || "Request failed");
  }
  if (reply.data === undefined || reply.data === null) {
    throw new ApiException("The server returned no data.");
  }
  return reply.data;
}

const CAMPUSES = `query Campuses { campuses { id name code } }`;

const PROGRAMMES = `
  query Programmes($status: String) {
    programmes(status: $status) { id name board code status medium mediumId }
  }
`;

const GRADES = `query Grades { grades { id name sequence } }`;

const MEDIUMS = `
  query Mediums($includeInactive: Boolean) {
    mediums(includeInactive: $includeInactive) { id name code isActive }
  }
`;

const ACADEMIC_CYCLES = `
  query AcademicCycles($academicYearId: ID!) {
    academicCycles(academicYearId: $academicYearId) {
      id academicYearId name startDate endDate cycleKind
    }
  }
`;

const ADD_GRADE = `
  mutation AddGrade($input: GradeInput!) {
    addGrade(input: $input) { id name sequence }
  }
`;

type ProgrammeNode = {
  id: string;
  name: string;
  board: string;
  code: string;
  status: string;
  medium: string | null;
  mediumId: string | null;
};

type MediumNode = { id: string; name: string; code: string | null; isActive: boolean };

function toProgramme(node: ProgrammeNode): AcademicProgramme {
  return {
    id: node.id,
    name: node.name,
    board: node.board,
    medium: node.medium,
    medium_id: node.mediumId,
    code: node.code,
    status: node.status,
  };
}

function toMedium(node: MediumNode): MediumDto {
  return { id: node.id, name: node.name, code: node.code, is_active: node.isActive };
}

export const academicStructureService = {
  getCampuses: async (): Promise<SchoolUnit[]> => {
    const data = await gql<{ campuses: SchoolUnit[] }>(CAMPUSES);
    return data.campuses;
  },

  getProgrammes: async (status?: string): Promise<AcademicProgramme[]> => {
    const data = await gql<{ programmes: ProgrammeNode[] }>(PROGRAMMES, { status });
    return data.programmes.map(toProgramme);
  },

  getGrades: async (): Promise<Grade[]> => {
    const data = await gql<{ grades: Grade[] }>(GRADES);
    return data.grades;
  },

  getMediums: async (includeInactive = false): Promise<MediumDto[]> => {
    const data = await gql<{ mediums: MediumNode[] }>(MEDIUMS, { includeInactive });
    return data.mediums.map(toMedium);
  },

  getAcademicCycles: async (academicYearId: string): Promise<AcademicCycle[]> => {
    const data = await gql<{ academicCycles: AcademicCycle[] }>(ACADEMIC_CYCLES, {
      academicYearId,
    });
    return data.academicCycles;
  },

  addGrade: async (name: string): Promise<Grade> => {
    const data = await gql<{ addGrade: Grade }>(ADD_GRADE, { input: { name } });
    return data.addGrade;
  },
};
