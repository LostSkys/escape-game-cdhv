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
  public: {
    Tables: {
      players: {
        Row: {
          created_at: string
          first_name: string
          id: string
          last_name: string
          team_id: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          team_id: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      question_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          faults: number
          hint_unlocked_at: string | null
          id: string
          question_id: string
          room_id: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          faults?: number
          hint_unlocked_at?: string | null
          id?: string
          question_id: string
          room_id?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          faults?: number
          hint_unlocked_at?: string | null
          id?: string
          question_id?: string
          room_id?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_progress_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_progress_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_progress_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      room_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          room_id: string
          team_id: string
          unlocked_at: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          room_id: string
          team_id: string
          unlocked_at?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          room_id?: string
          team_id?: string
          unlocked_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_progress_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_progress_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          description: string | null
          event_story_chapter: string | null
          id: string
          is_active: boolean
          room_hint: string | null
          room_number: number
          room_type: Database["public"]["Enums"]["room_type"]
          title: string
          unlock_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_story_chapter?: string | null
          id?: string
          is_active?: boolean
          room_hint?: string | null
          room_number: number
          room_type: Database["public"]["Enums"]["room_type"]
          title: string
          unlock_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_story_chapter?: string | null
          id?: string
          is_active?: boolean
          room_hint?: string | null
          room_number?: number
          room_type?: Database["public"]["Enums"]["room_type"]
          title?: string
          unlock_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      steps: {
        Row: {
          code_part: string | null
          content: Json
          created_at: string
          expected_answer: string | null
          hint: string
          hint_text: string | null
          id: string
          is_active: boolean
          next_question_hint: string | null
          question_order: number | null
          room_id: string | null
          step_order: number
          title: string
          type: Database["public"]["Enums"]["step_type"]
          unlock_code: string
          updated_at: string
        }
        Insert: {
          code_part?: string | null
          content?: Json
          created_at?: string
          expected_answer?: string | null
          hint: string
          hint_text?: string | null
          id?: string
          is_active?: boolean
          next_question_hint?: string | null
          question_order?: number | null
          room_id?: string | null
          step_order: number
          title: string
          type: Database["public"]["Enums"]["step_type"]
          unlock_code: string
          updated_at?: string
        }
        Update: {
          code_part?: string | null
          content?: Json
          created_at?: string
          expected_answer?: string | null
          hint?: string
          hint_text?: string | null
          id?: string
          is_active?: boolean
          next_question_hint?: string | null
          question_order?: number | null
          room_id?: string | null
          step_order?: number
          title?: string
          type?: Database["public"]["Enums"]["step_type"]
          unlock_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "steps_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      team_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          faults: number
          id: string
          step_id: string
          step_order: number
          team_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          faults?: number
          id?: string
          step_id: string
          step_order: number
          team_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          faults?: number
          id?: string
          step_id?: string
          step_order?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_progress_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_story: {
        Row: {
          chapter_order: number
          created_at: string
          id: string
          revealed_at: string
          room_id: string | null
          story_chapter: string
          team_id: string
        }
        Insert: {
          chapter_order: number
          created_at?: string
          id?: string
          revealed_at?: string
          room_id?: string | null
          story_chapter: string
          team_id: string
        }
        Update: {
          chapter_order?: number
          created_at?: string
          id?: string
          revealed_at?: string
          room_id?: string | null
          story_chapter?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_story_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_story_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          current_room_id: string | null
          current_step: number
          finished_at: string | null
          id: string
          name: string
          started_at: string
          token: string
          total_faults: number
          total_points: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_room_id?: string | null
          current_step?: number
          finished_at?: string | null
          id?: string
          name: string
          started_at?: string
          token?: string
          total_faults?: number
          total_points?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_room_id?: string | null
          current_step?: number
          finished_at?: string | null
          id?: string
          name?: string
          started_at?: string
          token?: string
          total_faults?: number
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_current_room_id_fkey"
            columns: ["current_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _check_admin: { Args: { p_password: string }; Returns: undefined }
      _check_team_token: {
        Args: { p_team_id: string; p_token: string }
        Returns: undefined
      }
      admin_check: { Args: { p_password: string }; Returns: boolean }
      admin_delete_team: {
        Args: { p_password: string; p_team_id: string }
        Returns: undefined
      }
      admin_list_players: {
        Args: { p_password: string }
        Returns: {
          first_name: string
          id: string
          last_name: string
          team_id: string
        }[]
      }
      admin_list_teams: {
        Args: { p_password: string }
        Returns: {
          current_step: number
          finished_at: string
          id: string
          name: string
          started_at: string
          total_faults: number
          total_points: number
        }[]
      }
      admin_update_team: {
        Args: {
          p_name: string
          p_password: string
          p_players: Json
          p_team_id: string
        }
        Returns: undefined
      }
      calculate_team_points: { Args: { p_team_id: string }; Returns: Json }
      check_hint_eligibility: {
        Args: { p_question_id: string; p_team_id: string }
        Returns: Json
      }
      complete_composite_step:
        | { Args: { p_step_id: string; p_team_id: string }; Returns: Json }
        | {
            Args: { p_step_id: string; p_team_id: string; p_token: string }
            Returns: Json
          }
      complete_room_step:
        | { Args: { p_step_id: string; p_team_id: string }; Returns: Json }
        | {
            Args: { p_step_id: string; p_team_id: string; p_token: string }
            Returns: Json
          }
      find_team_by_name: {
        Args: { p_name: string }
        Returns: {
          id: string
          name: string
          token: string
        }[]
      }
      finish_game:
        | { Args: { p_team_id: string }; Returns: undefined }
        | { Args: { p_team_id: string; p_token: string }; Returns: undefined }
      finish_game_v2: {
        Args: { p_team_id: string; p_token: string }
        Returns: Json
      }
      get_question_by_code: {
        Args: { p_code: string }
        Returns: {
          content: Json
          hint_text: string
          id: string
          next_question_hint: string
          question_order: number
          room_id: string
          title: string
        }[]
      }
      get_room_by_code: {
        Args: { p_code: string }
        Returns: {
          event_story_chapter: string
          id: string
          room_number: number
          room_type: Database["public"]["Enums"]["room_type"]
          title: string
        }[]
      }
      get_room_code_parts: {
        Args: { p_room_id: string; p_team_id: string }
        Returns: {
          code_part: string
          is_complete: boolean
        }[]
      }
      get_room_questions: {
        Args: { p_room_id: string }
        Returns: {
          content: Json
          hint_text: string
          id: string
          next_question_hint: string
          question_order: number
          title: string
        }[]
      }
      get_step_by_code: {
        Args: { p_code: string }
        Returns: {
          content: Json
          hint: string
          id: string
          step_order: number
          title: string
          type: Database["public"]["Enums"]["step_type"]
        }[]
      }
      get_team_accumulated_story: {
        Args: { p_team_id: string; p_token: string }
        Returns: {
          chapter_order: number
          revealed_at: string
          room_number: number
          story_chapter: string
        }[]
      }
      get_team_hints: {
        Args: { p_team_id: string }
        Returns: {
          accumulated_story: string
          next_question_hint: string
          next_room_hint: string
        }[]
      }
      get_team_progress: {
        Args: { p_team_id: string; p_token: string }
        Returns: {
          completed_at: string
          faults: number
          step_id: string
          step_order: number
        }[]
      }
      get_team_progress_detailed: {
        Args: { p_team_id: string; p_token: string }
        Returns: {
          completed: boolean
          completed_at: string
          faults: number
          hint_unlocked: boolean
          question_id: string
          room_id: string
          room_number: number
          title: string
        }[]
      }
      get_team_rooms_progress: {
        Args: { p_team_id: string; p_token: string }
        Returns: {
          completed: boolean
          completed_at: string
          room_id: string
          room_number: number
          room_type: Database["public"]["Enums"]["room_type"]
          title: string
          unlocked: boolean
          unlocked_at: string
        }[]
      }
      get_team_status: {
        Args: { p_team_id: string; p_token: string }
        Returns: {
          current_step: number
          finished_at: string
          name: string
          total_faults: number
          total_points: number
        }[]
      }
      get_team_status_v2: {
        Args: { p_team_id: string; p_token: string }
        Returns: {
          completed_questions: number
          completed_rooms: number
          current_room_number: number
          finished_at: string
          team_name: string
          total_faults: number
          total_points: number
        }[]
      }
      mark_question_attempted: {
        Args: { p_question_id: string; p_room_id: string; p_team_id: string }
        Returns: Json
      }
      register_team: {
        Args: { p_name: string; p_players: Json }
        Returns: {
          id: string
          name: string
          token: string
        }[]
      }
      reset_team_progress: {
        Args: { p_admin_password: string; p_team_id: string }
        Returns: Json
      }
      submit_event_code: {
        Args: { p_code: string; p_team_id: string }
        Returns: Json
      }
      unlock_room: {
        Args: {
          p_concatenated_codes: string
          p_room_id: string
          p_team_id: string
        }
        Returns: Json
      }
      validate_minijeu: {
        Args: {
          p_answers: Json
          p_step_id: string
          p_team_id: string
          p_token: string
        }
        Returns: Json
      }
      validate_question_answer: {
        Args: { p_answer: string; p_question_id: string; p_team_id: string }
        Returns: Json
      }
      validate_step_answer:
        | {
            Args: { p_answer: string; p_step_id: string; p_team_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_answer: string
              p_step_id: string
              p_team_id: string
              p_token: string
            }
            Returns: Json
          }
      validate_substep:
        | {
            Args: {
              p_answer: string
              p_step_id: string
              p_sub_index: number
              p_team_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_answer: string
              p_step_id: string
              p_sub_index: number
              p_team_id: string
              p_token: string
            }
            Returns: Json
          }
    }
    Enums: {
      room_type: "QUESTION" | "EVENT"
      step_type:
        | "question"
        | "enigme"
        | "minijeu"
        | "salle"
        | "physique"
        | "composee"
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
  public: {
    Enums: {
      room_type: ["QUESTION", "EVENT"],
      step_type: [
        "question",
        "enigme",
        "minijeu",
        "salle",
        "physique",
        "composee",
      ],
    },
  },
} as const
