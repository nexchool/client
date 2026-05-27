export interface BusInfo {
  id: string;
  registration_number: string | null;
  capacity: number;
}

export interface RouteInfo {
  id: string;
  name: string;
}

export interface RouteStop {
  id: string;
  name: string;
  address?: string | null;
  scheduled_time?: string | null;
  eta?: string | null;
  is_passed_today?: boolean;
}

export interface DriverContact {
  id: string;
  name: string;
  phone: string | null;
}

export interface TransportException {
  type: 'DELAYED' | 'SUBSTITUTE_DRIVER' | 'ROUTE_CHANGE' | 'CANCELLED' | string;
  description: string;
  created_at: string;
}

export interface StudentTransportEnrolled {
  enrolled: true;
  bus: BusInfo | null;
  route: RouteInfo | null;
  pickup_stop: RouteStop | null;
  drop_stop: RouteStop | null;
  driver: DriverContact | null;
  stops: RouteStop[];
  exceptions: TransportException[];
}

export interface StudentTransportNotEnrolled {
  enrolled: false;
}

export type StudentTransport = StudentTransportEnrolled | StudentTransportNotEnrolled;
