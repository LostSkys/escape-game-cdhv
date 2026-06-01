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
      event_steps: {
        Row: {
          created_at: string
          expected_answer: string
          hint: string
          id: string
          prompt: string
          room_id: string
          story_fragment: string
        }
        Insert: {
          created_at?: string
          expected_answer: string
          hint: string
          id?: string
          prompt: string
          room_id: string
          story_fragment: string
        }
        Update: {
          created_at?: string
          expected_answer?: string
          hint?: string
          id?: string
          prompt?: string
          room_id?: string
          story_fragment?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_steps_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
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
      questions: {
        Row: {
          code_fragment: string
          created_at: string
          expected_answer: string
          hint: string
          id: string
          is_active: boolean
          position: number
          prompt: string
          room_id: string | null
        }
        Insert: {
          code_fragment: string
          created_at?: string
          expected_answer: string
          hint: string
          id?: string
          is_active?: boolean
          position?: number
          prompt: string
          room_id?: string | null
        }
        Update: {
          code_fragment?: string
          created_at?: string
          expected_answer?: string
          hint?: string
          id?: string
          is_active?: boolean
          position?: number
          prompt?: string
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          hint: string | null
          id: string
          is_active: boolean
          room_order: number
          story: string | null
          title: string
          type: Database["public"]["Enums"]["room_type"]
          unlock_code: string
        }
        Insert: {
          created_at?: string
          hint?: string | null
          id?: string
          is_active?: boolean
          room_order: number
          story?: string | null
          title: string
          type?: Database["public"]["Enums"]["room_type"]
          unlock_code: string
        }
        Update: {
          created_at?: string
          hint?: string | null
          id?: string
          is_active?: boolean
          room_order?: number
          story?: string | null
          title?: string
          type?: Database["public"]["Enums"]["room_type"]
          unlock_code?: string
        }
        Relationships: []
      }
      steps: {
        Row: {
          content: Json
          created_at: string
          expected_answer: string | null
          hint: string
          id: string
          step_order: number
          story: string | null
          title: string
          type: Database["public"]["Enums"]["step_type"]
          unlock_code: string
        }
        Insert: {
          content?: Json
          created_at?: string
          expected_answer?: string | null
          hint: string
          id?: string
          step_order: number
          story?: string | null
          title: string
          type: Database["public"]["Enums"]["step_type"]
          unlock_code: string
        }
        Update: {
          content?: Json
          created_at?: string
          expected_answer?: string | null
          hint?: string
          id?: string
          step_order?: number
          story?: string | null
          title?: string
          type?: Database["public"]["Enums"]["step_type"]
          unlock_code?: string
        }
        Relationships: []
      }
      team_progress: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          event_id: string | null
          faults: number
          id: string
          question_id: string | null
          room_id: string | null
          step_id: string | null
          step_order: number | null
          team_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          event_id?: string | null
          faults?: number
          id?: string
          question_id?: string | null
          room_id?: string | null
          step_id?: string | null
          step_order?: number | null
          team_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          event_id?: string | null
          faults?: number
          id?: string
          question_id?: string | null
          room_id?: string | null
          step_id?: string | null
          step_order?: number | null
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
      teams: {
        Row: {
          created_at: string
          current_room_order: number
          current_step: number
          finished_at: string | null
          id: string
          name: string
          started_at: string
          token: string
          total_faults: number
          total_points: number
        }
        Insert: {
          created_at?: string
          current_room_order?: number
          current_step?: number
          finished_at?: string | null
          id?: string
          name: string
          started_at?: string
          token?: string
          total_faults?: number
          total_points?: number
        }
        Update: {
          created_at?: string
          current_room_order?: number
          current_step?: number
          finished_at?: string | null
          id?: string
          name?: string
          started_at?: string
          token?: string
          total_faults?: number
          total_points?: number
        }
        Relationships: []
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
      admin_assign_question: {
        Args: {
          p_password: string
          p_position: number
          p_question_id: string
          p_room_id: string
        }
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
      get_current_room: {
        Args: { p_team_id: string; p_token: string }
        Returns: Json
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
      get_team_hints: {
        Args: { p_team_id: string; p_token: string }
        Returns: Json
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
      register_team: {
        Args: { p_name: string; p_players: Json }
        Returns: {
          id: string
          name: string
          token: string
        }[]
      }
      submit_event_answer: {
        Args: {
          p_answer: string
          p_event_id: string
          p_team_id: string
          p_token: string
        }
        Returns: Json
      }
      submit_question_answer: {
        Args: {
          p_answer: string
          p_question_id: string
          p_team_id: string
          p_token: string
        }
        Returns: Json
      }
      unlock_next_room: {
        Args: { p_code: string; p_team_id: string; p_token: string }
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
      room_type: "salle" | "event"
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
      room_type: ["salle", "event"],
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
