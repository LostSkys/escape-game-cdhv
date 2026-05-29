export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
          username: string
          password_hash: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          password_hash: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          password_hash?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      admin_teams: {
        Row: {
          admin_id: string
          team_id: string
          assigned_at: string
        }
        Insert: {
          admin_id: string
          team_id: string
          assigned_at?: string
        }
        Update: {
          admin_id?: string
          team_id?: string
          assigned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_teams_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      answer_log: {
        Row: {
          id: string
          team_id: string
          admin_id: string
          room_id: string
          answer: string
          is_correct: boolean
          points_change: number
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          admin_id: string
          room_id: string
          answer: string
          is_correct: boolean
          points_change: number
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          admin_id?: string
          room_id?: string
          answer?: string
          is_correct?: boolean
          points_change?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_log_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          id: string
          room_id: string
          expected_answers: string
          hint_piece: string
          includes_history: boolean
          history_piece: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          expected_answers: string
          hint_piece: string
          includes_history: boolean
          history_piece?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          expected_answers?: string
          hint_piece?: string
          includes_history?: boolean
          history_piece?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_log: {
        Row: {
          id: string
          team_id: string
          admin_id: string
          room_id: string
          answer_submitted: string
          is_correct: boolean
          points_change: number
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          admin_id: string
          room_id: string
          answer_submitted: string
          is_correct: boolean
          points_change: number
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          admin_id?: string
          room_id?: string
          answer_submitted?: string
          is_correct?: boolean
          points_change?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_log_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          id: string
          room_number: number
          room_type: "QUESTION" | "EVENT"
          title: string
          description: string | null
          unlock_code: string
          created_at: string
        }
        Insert: {
          id?: string
          room_number: number
          room_type: "QUESTION" | "EVENT"
          title: string
          description?: string | null
          unlock_code: string
          created_at?: string
        }
        Update: {
          id?: string
          room_number?: number
          room_type?: "QUESTION" | "EVENT"
          title?: string
          description?: string | null
          unlock_code?: string
          created_at?: string
        }
        Relationships: []
      }
      team_hints: {
        Row: {
          id: string
          team_id: string
          room_id: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          room_id: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          room_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_hints_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_hints_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          first_name: string
          last_name: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          first_name: string
          last_name: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          first_name?: string
          last_name?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          points: number
          created_at: string
        }
        Insert: {
          id?: string
          name?: string
          points?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          points?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      admin_login: {
        Args: {
          p_username: string
          p_password: string
        }
        Returns: Array<{
          admin_id: string
          username: string
          name: string
        }>
      }
      create_team_with_members: {
        Args: {
          p_admin_id: string
          p_team_name: string
          p_members: Array<{
            first_name: string
            last_name: string
          }>
        }
        Returns: Array<{
          team_id: string
          team_name: string
          member_count: number
        }>
      }
      get_admin_team: {
        Args: {
          p_admin_id: string
        }
        Returns: Array<{
          team_id: string
          team_name: string
          points: number
          members: string
        }>
      }
      get_attempt_history: {
        Args: {
          p_team_id: string
          p_limit: number
        }
        Returns: Array<{
          room_number: number
          room_title: string
          answer_submitted: string
          is_correct: boolean
          points_change: number
          admin_name: string
          created_at: string
        }>
      }
      get_leaderboard: {
        Args: {}
        Returns: Array<{
          rank: number
          team_name: string
          points: number
          members: string
          last_activity: string | null
        }>
      }
      get_team_progress: {
        Args: {
          p_team_id: string | null
        }
        Returns: Array<{
          team_id: string
          team_name: string
          points: number
          total_attempts: number
          correct_answers: number
          incorrect_answers: number
          rooms_completed: number
          total_rooms: number
          members: string
        }>
      }
      get_team_hints_progression: {
        Args: {
          p_team_id: string
        }
        Returns: Array<{
          room_order: number
          room_title: string
          room_type: string
          unlocked: boolean
          hint_pieces: string[]
          history_pieces: string[]
          accumulated_clue: string
        }>
      }
      get_room_by_code: {
        Args: {
          p_code: string
        }
        Returns: Array<{
          id: string
          room_number: number
          room_type: string
          title: string
          description: string
          unlock_code: string
          room_hint: string
          is_active: boolean
          event_story_chapter: string | null
        }>
      }
      get_room_questions: {
        Args: {
          p_room_id: string
        }
        Returns: Array<{
          id: string
          room_id: string
          room_order: number
          question_order: number
          title: string
          question_text: string | null
          expected_answers: string[]
          hint_text: string
          next_question_hint: string | null
          code_part: string | null
          includes_history: boolean
          history_piece: string | null
        }>
      }
      get_team_progress_detailed: {
        Args: {
          p_team_id: string
          p_room_id: string
        }
        Returns: Array<{
          question_id: string
          room_id: string
          room_order: number
          question_order: number
          title: string
          question_text: string | null
          hint_text: string
          next_question_hint: string | null
          faults: number
          hint_unlocked: boolean
          completed: boolean
        }>
      }
      validate_question_answer: {
        Args: {
          p_team_id: string
          p_question_id: string
          p_answer: string
        }
        Returns: Array<{
          correct: boolean
          points_change: number
          new_team_points: number
          code_part: string | null
          hint_unlocked: boolean
          hint_text: string | null
          next_question_hint: string | null
        }>
      }
      unlock_room: {
        Args: {
          p_team_id: string
          p_room_id: string
          p_concatenated_codes: string
        }
        Returns: Array<{
          ok: boolean
        }>
      }
      submit_event_code: {
        Args: {
          p_code: string
          p_team_id: string
        }
        Returns: Array<{
          ok: boolean
        }>
      }
      get_team_hints: {
        Args: {
          p_team_id: string
        }
        Returns: Array<{
          next_question_hint: string | null
          next_room_hint: string | null
          accumulated_story: string | null
        }>
      }
      get_team_accumulated_story: {
        Args: {
          p_team_id: string
        }
        Returns: Array<{
          chapter_order: number
          story_chapter: string
          room_number: number
          revealed_at: string
        }>
      }
      validate_answer: {
        Args: {
          p_team_id: string
          p_admin_id: string
          p_room_order: number
          p_answer: string
        }
        Returns: Array<{
          is_correct: boolean
          points_change: number
          new_team_points: number
          hint_piece: string | null
          history_piece: string | null
          room_completed: boolean
        }>
      }
    }
    Enums: {
      room_type: "QUESTION" | "EVENT"
    }
    CompositeTypes: {}
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] & {
      Schema: PublicTableNameOrOptions["schema"]
    }
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] & {
        Schema: "public"
      }
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
