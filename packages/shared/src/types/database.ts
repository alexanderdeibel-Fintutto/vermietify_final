// ===========================================
// Address Type
// ===========================================

export interface Address {
  street: string;
  zip: string;
  city: string;
  country: string;
}

// ===========================================
// Building Types (matches Supabase schema)
// ===========================================

export interface Building {
  id: string;
  organization_id: string;
  name: string;
  address: string;
  postal_code: string;
  city: string;
  building_type: 'apartment' | 'house' | 'commercial' | 'mixed';
  total_area?: number;
  year_built?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BuildingInsert extends Omit<Building, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BuildingUpdate extends Partial<BuildingInsert> {}

// ===========================================
// Unit Types (matches Supabase schema)
// ===========================================

export type UnitStatus = 'vacant' | 'rented' | 'renovating';

export interface Unit {
  id: string;
  building_id: string;
  unit_number: string;
  floor?: number;
  area: number;
  rooms: number;
  rent_amount: number;
  utility_advance?: number;
  status: UnitStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UnitInsert extends Omit<Unit, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UnitUpdate extends Partial<UnitInsert> {}

// ===========================================
// Tenant Types (matches Supabase schema)
// ===========================================

export interface Tenant {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantInsert extends Omit<Tenant, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TenantUpdate extends Partial<TenantInsert> {}

// ===========================================
// Lease/Contract Types (matches Supabase schema)
// ===========================================

export type LeaseStatus = 'draft' | 'active' | 'terminated' | 'expired';

export interface LeaseContract {
  id: string;
  unit_id: string;
  tenant_id: string;
  start_date: string;
  end_date?: string;
  rent_amount: number;
  utility_advance?: number;
  deposit_amount?: number;
  deposit_paid?: boolean;
  payment_day?: number;
  is_active?: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaseContractInsert extends Omit<LeaseContract, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeaseContractUpdate extends Partial<LeaseContractInsert> {}

// ===========================================
// Task Types (matches Supabase schema)
// ===========================================

 export type TaskCategory = 'water_damage' | 'heating' | 'electrical' | 'other';
 export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
 export type TaskSource = 'tenant' | 'landlord' | 'caretaker';

export interface Task {
  id: string;
  organization_id: string;
  building_id?: string;
  unit_id?: string;
  title: string;
  description?: string;
   priority?: TaskPriority;
   category?: TaskCategory;
   status?: TaskStatus;
   source?: TaskSource;
   created_by?: string;
   assigned_to?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskInsert extends Omit<Task, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskUpdate extends Partial<TaskInsert> {}

export interface TaskAttachment {
  id: string;
  task_id: string;
   file_path: string;
  file_type: string;
   uploaded_by?: string | null;
  created_at: string;
}
 
 export interface TaskComment {
   id: string;
   task_id: string;
   user_id: string;
   content: string;
   created_at: string;
 }
 
 export interface TaskActivity {
   id: string;
   task_id: string;
   user_id: string | null;
   action: string;
   old_value: string | null;
   new_value: string | null;
   created_at: string;
 }

// ===========================================
// Meter Types (for future implementation)
// ===========================================

export type MeterType = 'electricity' | 'gas' | 'water' | 'heating';

export interface Meter {
  id: string;
  unit_id: string;
  meter_number: string;
  type: MeterType;
  installation_date?: string;
  last_reading_date?: string;
  last_reading_value?: number;
  created_at: string;
  updated_at: string;
}

export interface MeterInsert extends Omit<Meter, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MeterUpdate extends Partial<MeterInsert> {}

// ===========================================
// Meter Reading Types
// ===========================================

export interface MeterReading {
  id: string;
  meter_id: string;
  reading_date: string;
  value: number;
  image_url?: string;
  created_by: string;
  created_at: string;
}

export interface MeterReadingInsert extends Omit<MeterReading, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export interface MeterReadingUpdate extends Partial<MeterReadingInsert> {}

// ===========================================
// Operating Cost Statement Types
// ===========================================

export type OperatingCostStatus = 'draft' | 'calculated' | 'sent' | 'completed';

export interface OperatingCostStatement {
  id: string;
  building_id: string;
  period_start: string;
  period_end: string;
  status: OperatingCostStatus;
  total_costs: number;
  created_at: string;
  updated_at: string;
}

export interface OperatingCostStatementInsert extends Omit<OperatingCostStatement, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OperatingCostStatementUpdate extends Partial<OperatingCostStatementInsert> {}

// ===========================================
// Operating Cost Line Item Types
// ===========================================

export type DistributionKey = 'area' | 'units' | 'persons' | 'consumption';

export interface OperatingCostLineItem {
  id: string;
  statement_id: string;
  cost_type: string;
  description?: string;
  amount: number;
  distribution_key: DistributionKey;
  created_at: string;
}

// ===========================================
// Payment Types
// ===========================================

export type PaymentType = 'rent' | 'deposit' | 'utility' | 'other';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Payment {
  id: string;
  organization_id: string;
  lease_id: string;
  tenant_id: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  payment_type: PaymentType;
  status: PaymentStatus;
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentInsert extends Omit<Payment, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentUpdate extends Partial<PaymentInsert> {}

// ===========================================
// Helper Types (Joined/Extended)
// ===========================================

export interface BuildingWithUnits extends Building {
  units: Unit[];
}

export interface UnitWithTenant extends Unit {
  tenant?: Partial<Tenant>;
  building?: Partial<Building>;
}

export interface UnitWithLease extends Unit {
  lease?: LeaseContract;
  tenant?: Partial<Tenant>;
}

export interface TaskWithAttachments extends Task {
  attachments: TaskAttachment[];
  building?: Partial<Building>;
  unit?: Partial<Unit>;
}

export interface LeaseContractWithDetails extends LeaseContract {
  tenant?: Partial<Tenant>;
  unit?: Partial<Unit>;
  building?: Partial<Building>;
}

export interface MeterWithReadings extends Meter {
  readings: MeterReading[];
  unit?: Partial<Unit>;
}

export interface OperatingCostStatementWithItems extends OperatingCostStatement {
  line_items: OperatingCostLineItem[];
  building?: Partial<Building>;
}

export interface TenantWithLeases extends Tenant {
  leases: LeaseContract[];
  current_unit?: Partial<Unit>;
}

// ===========================================
// Dashboard/Statistics Types
// ===========================================

export interface DashboardStats {
  total_buildings: number;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  total_tenants: number;
  total_monthly_rent: number;
  overdue_payments: number;
  open_tasks: number;
}

export interface OccupancyStats {
  total: number;
  occupied: number;
  vacant: number;
  maintenance: number;
  occupancy_rate: number;
}

export interface FinancialSummary {
  period: string;
  total_income: number;
  total_expenses: number;
  net_income: number;
  pending_payments: number;
}

// ===========================================
// Form Types (for UI components)
// ===========================================

export interface BuildingFormData {
  name: string;
  street: string;
  zip: string;
  city: string;
  country?: string;
  building_type?: 'apartment' | 'house' | 'commercial' | 'mixed';
  total_area?: number;
  year_built?: number;
  notes?: string;
}

export interface UnitFormData {
  building_id: string;
  unit_number: string;
  floor?: number;
  area: number;
  rooms: number;
  rent_amount: number;
  utility_advance?: number;
  status: UnitStatus;
  notes?: string;
}

export interface TenantFormData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  birth_date?: string;
  household_size?: number;
  previous_landlord?: string;
  notes?: string;
}

export interface LeaseFormData {
  unit_id: string;
  tenant_id: string;
  start_date: string;
  end_date?: string;
  rent_amount: number;
  utility_advance?: number;
  deposit_amount?: number;
  deposit_paid?: boolean;
  payment_day?: number;
}

export interface TaskFormData {
  building_id?: string;
  unit_id?: string;
  title: string;
  description?: string;
   priority?: TaskPriority;
   category?: TaskCategory;
   status?: TaskStatus;
   source?: TaskSource;
   assigned_to?: string;
  due_date?: string;
}

export interface MeterReadingFormData {
  meter_id: string;
  reading_date: string;
  value: number;
  image_url?: string;
}
