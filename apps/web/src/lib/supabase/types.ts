export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          field: string | null
          id: number
          issue_id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          field?: string | null
          id?: number
          issue_id: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          field?: string | null
          id?: number
          issue_id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          filename: string
          id: string
          issue_id: string
          mime_type: string | null
          size: number
          storage_path: string
          uploader_id: string
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          issue_id: string
          mime_type?: string | null
          size: number
          storage_path: string
          uploader_id: string
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          issue_id?: string
          mime_type?: string | null
          size?: number
          storage_path?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body_markdown: string
          created_at: string
          edited_at: string | null
          id: string
          issue_id: string
        }
        Insert: {
          author_id: string
          body_markdown: string
          created_at?: string
          edited_at?: string | null
          id?: string
          issue_id: string
        }
        Update: {
          author_id?: string
          body_markdown?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          issue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      github_links: {
        Row: {
          author: string | null
          created_at: string
          external_id: string
          id: string
          issue_id: string
          kind: string
          state: string | null
          title: string | null
          url: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          external_id: string
          id?: string
          issue_id: string
          kind: string
          state?: string | null
          title?: string | null
          url: string
        }
        Update: {
          author?: string | null
          created_at?: string
          external_id?: string
          id?: string
          issue_id?: string
          kind?: string
          state?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_links_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_labels: {
        Row: {
          issue_id: string
          label_id: string
        }
        Insert: {
          issue_id: string
          label_id: string
        }
        Update: {
          issue_id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_labels_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_links: {
        Row: {
          created_at: string
          id: string
          link_type: string
          source_issue_id: string
          target_issue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_type: string
          source_issue_id: string
          target_issue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_type?: string
          source_issue_id?: string
          target_issue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_links_source_issue_id_fkey"
            columns: ["source_issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_links_target_issue_id_fkey"
            columns: ["target_issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          assignee_id: string | null
          body_markdown: string
          closed_at: string | null
          created_at: string
          due_date: string | null
          epic_id: string | null
          id: string
          key: string
          priority: string
          project_id: string
          rank: string | null
          reporter_id: string
          sprint_id: string | null
          status: string
          story_points: number | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          body_markdown?: string
          closed_at?: string | null
          created_at?: string
          due_date?: string | null
          epic_id?: string | null
          id?: string
          key: string
          priority?: string
          project_id: string
          rank?: string | null
          reporter_id: string
          sprint_id?: string | null
          status?: string
          story_points?: number | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          body_markdown?: string
          closed_at?: string | null
          created_at?: string
          due_date?: string | null
          epic_id?: string | null
          id?: string
          key?: string
          priority?: string
          project_id?: string
          rank?: string | null
          reporter_id?: string
          sprint_id?: string | null
          status?: string
          story_points?: number | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_epic_id_fkey"
            columns: ["epic_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      jira_migration_logs: {
        Row: {
          id: number
          jira_issue_key: string
          migrated_at: string
          new_issue_id: string | null
          notes: string | null
          status: string
        }
        Insert: {
          id?: number
          jira_issue_key: string
          migrated_at?: string
          new_issue_id?: string | null
          notes?: string | null
          status: string
        }
        Update: {
          id?: number
          jira_issue_key?: string
          migrated_at?: string
          new_issue_id?: string | null
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "jira_migration_logs_new_issue_id_fkey"
            columns: ["new_issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          color: string
          id: string
          name: string
          project_id: string
        }
        Insert: {
          color?: string
          id?: string
          name: string
          project_id: string
        }
        Update: {
          color?: string
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "labels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: number
          payload: Json
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          payload: Json
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          payload?: Json
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_github_repos: {
        Row: {
          created_at: string
          id: string
          installation_id: number | null
          project_id: string
          repo_full_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          installation_id?: number | null
          project_id: string
          repo_full_name: string
        }
        Update: {
          created_at?: string
          id?: string
          installation_id?: number | null
          project_id?: string
          repo_full_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_github_repos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          is_archived: boolean
          issue_counter: number
          key: string
          name: string
          settings: Json
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean
          issue_counter?: number
          key: string
          name: string
          settings?: Json
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean
          issue_counter?: number
          key?: string
          name?: string
          settings?: Json
        }
        Relationships: []
      }
      slack_messages: {
        Row: {
          channel_id: string
          event_type: string
          id: number
          issue_id: string
          sent_at: string
          slack_ts: string
        }
        Insert: {
          channel_id: string
          event_type: string
          id?: number
          issue_id: string
          sent_at?: string
          slack_ts: string
        }
        Update: {
          channel_id?: string
          event_type?: string
          id?: number
          issue_id?: string
          sent_at?: string
          slack_ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_messages_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      slack_workspaces: {
        Row: {
          bot_token: string
          created_at: string
          default_channel_id: string
          id: string
          installed_by_user_id: string | null
          team_id: string
          team_name: string
        }
        Insert: {
          bot_token: string
          created_at?: string
          default_channel_id: string
          id?: string
          installed_by_user_id?: string | null
          team_id: string
          team_name: string
        }
        Update: {
          bot_token?: string
          created_at?: string
          default_channel_id?: string
          id?: string
          installed_by_user_id?: string | null
          team_id?: string
          team_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_workspaces_installed_by_user_id_fkey"
            columns: ["installed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          closed_at: string | null
          created_at: string
          end_date: string
          goal: string | null
          id: string
          name: string
          project_id: string
          start_date: string
          status: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          end_date: string
          goal?: string | null
          id?: string
          name: string
          project_id: string
          start_date: string
          status?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          end_date?: string
          goal?: string | null
          id?: string
          name?: string
          project_id?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          name: string
          role?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_sprint: {
        Args: { p_carry_over: string; p_sprint_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
