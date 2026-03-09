export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          type: "wedding" | "house" | "travel" | "event";
          start_date: string | null;
          end_date: string | null;
          owner_id: string;
          settings: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          type: "wedding" | "house" | "travel" | "event";
          start_date?: string | null;
          end_date?: string | null;
          owner_id: string;
          settings?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          type?: "wedding" | "house" | "travel" | "event";
          start_date?: string | null;
          end_date?: string | null;
          owner_id?: string;
          settings?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          parent_id: string | null;
          title: string;
          description: string | null;
          status: "todo" | "in_progress" | "done";
          priority: "low" | "medium" | "high" | "urgent";
          category: string | null;
          assignee_id: string | null;
          start_date: string | null;
          due_date: string | null;
          estimated_cost: number;
          actual_cost: number;
          notes: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          parent_id?: string | null;
          title: string;
          description?: string | null;
          status?: "todo" | "in_progress" | "done";
          priority?: "low" | "medium" | "high" | "urgent";
          category?: string | null;
          assignee_id?: string | null;
          start_date?: string | null;
          due_date?: string | null;
          estimated_cost?: number;
          actual_cost?: number;
          notes?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          parent_id?: string | null;
          title?: string;
          description?: string | null;
          status?: "todo" | "in_progress" | "done";
          priority?: "low" | "medium" | "high" | "urgent";
          category?: string | null;
          assignee_id?: string | null;
          start_date?: string | null;
          due_date?: string | null;
          estimated_cost?: number;
          actual_cost?: number;
          notes?: string | null;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey";
            columns: ["assignee_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          }
        ];
      };
      budget_categories: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          allocated_amount: number;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          allocated_amount?: number;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          allocated_amount?: number;
          color?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_categories_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      guests: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          group_name: string | null;
          invitation_sent: boolean;
          invitation_sent_at: string | null;
          rsvp_status: "pending" | "confirmed" | "declined";
          rsvp_count: number;
          table_number: string | null;
          qr_code: string | null;
          checked_in: boolean;
          checked_in_at: string | null;
          gift_amount: number | null;
          notes: string | null;
          source: "manual" | "google_sheet";
          external_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          group_name?: string | null;
          invitation_sent?: boolean;
          invitation_sent_at?: string | null;
          rsvp_status?: "pending" | "confirmed" | "declined";
          rsvp_count?: number;
          table_number?: string | null;
          qr_code?: string | null;
          checked_in?: boolean;
          checked_in_at?: string | null;
          gift_amount?: number | null;
          notes?: string | null;
          source?: "manual" | "google_sheet";
          external_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          group_name?: string | null;
          invitation_sent?: boolean;
          invitation_sent_at?: string | null;
          rsvp_status?: "pending" | "confirmed" | "declined";
          rsvp_count?: number;
          table_number?: string | null;
          qr_code?: string | null;
          checked_in?: boolean;
          checked_in_at?: string | null;
          gift_amount?: number | null;
          notes?: string | null;
          source?: "manual" | "google_sheet";
          external_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guests_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string | null;
          role: "owner" | "editor" | "viewer";
          invited_email: string | null;
          invite_status: "pending" | "accepted" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id?: string | null;
          role?: "owner" | "editor" | "viewer";
          invited_email?: string | null;
          invite_status?: "pending" | "accepted" | "rejected";
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string | null;
          role?: "owner" | "editor" | "viewer";
          invited_email?: string | null;
          invite_status?: "pending" | "accepted" | "rejected";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      templates: {
        Row: {
          id: string;
          name: string;
          type: "wedding" | "house" | "travel" | "event";
          description: string | null;
          tasks: Json;
          budget_categories: Json;
          is_system: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: "wedding" | "house" | "travel" | "event";
          description?: string | null;
          tasks?: Json;
          budget_categories?: Json;
          is_system?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: "wedding" | "house" | "travel" | "event";
          description?: string | null;
          tasks?: Json;
          budget_categories?: Json;
          is_system?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sync_logs: {
        Row: {
          id: string;
          project_id: string;
          source_type: string;
          source_id: string;
          records_synced: number;
          status: "success" | "failed" | "partial";
          error_message: string | null;
          synced_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          source_type?: string;
          source_id: string;
          records_synced?: number;
          status?: "success" | "failed" | "partial";
          error_message?: string | null;
          synced_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          source_type?: string;
          source_id?: string;
          records_synced?: number;
          status?: "success" | "failed" | "partial";
          error_message?: string | null;
          synced_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sync_logs_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      project_type: "wedding" | "house" | "travel" | "event";
      task_status: "todo" | "in_progress" | "done";
      task_priority: "low" | "medium" | "high" | "urgent";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Insertable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updatable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Convenience types
export type Profile = Tables<"profiles">;
export type Project = Tables<"projects">;
export type Task = Tables<"tasks">;
export type BudgetCategory = Tables<"budget_categories">;
export type Guest = Tables<"guests">;
export type ProjectMember = Tables<"project_members">;
export type Template = Tables<"templates">;
export type SyncLog = Tables<"sync_logs">;

// Template task type (for JSONB)
export interface TemplateTask {
  title: string;
  description?: string;
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  estimated_cost?: number;
}

// Template budget category type (for JSONB)
export interface TemplateBudgetCategory {
  name: string;
  allocated_amount: number;
  color?: string;
}

// Phase 4 types - Comments, Attachments, Activity Logs
export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

export interface Attachment {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string;
  action: "create" | "update" | "delete";
  entity_type: "task" | "guest" | "budget" | "member";
  entity_id: string;
  entity_name: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
  user?: Profile;
}
