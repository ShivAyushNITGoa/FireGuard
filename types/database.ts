export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sensor_data: {
        Row: {
          id: string
          time: string
          gas: number
          flame: number
          temp: number
          humidity?: number
          alert: boolean
          device_id?: string
          location?: string
        }
        Insert: {
          id?: string
          time?: string
          gas: number
          flame: number
          temp: number
          humidity?: number
          alert: boolean
          device_id?: string
          location?: string
        }
        Update: {
          id?: string
          time?: string
          gas?: number
          flame?: number
          temp?: number
          humidity?: number
          alert?: boolean
          device_id?: string
          location?: string
        }
      }
      alerts: {
        Row: {
          id: string
          time: string
          gas: number
          flame: number
          temp: number
          message: string
          acknowledged: boolean
          severity: 'low' | 'medium' | 'high' | 'critical'
          device_id?: string
          location?: string
          acknowledged_at?: string
          acknowledged_by?: string
        }
        Insert: {
          id?: string
          time?: string
          gas: number
          flame: number
          temp: number
          message: string
          acknowledged?: boolean
          severity?: 'low' | 'medium' | 'high' | 'critical'
          device_id?: string
          location?: string
          acknowledged_at?: string
          acknowledged_by?: string
        }
        Update: {
          id?: string
          time?: string
          gas?: number
          flame?: number
          temp?: number
          message?: string
          acknowledged?: boolean
          severity?: 'low' | 'medium' | 'high' | 'critical'
          device_id?: string
          location?: string
          acknowledged_at?: string
          acknowledged_by?: string
        }
      }
      devices: {
        Row: {
          id: string
          name: string
          location: string
          device_id: string
          status: 'online' | 'offline' | 'error'
          last_seen: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          device_id: string
          status?: 'online' | 'offline' | 'error'
          last_seen?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          device_id?: string
          status?: 'online' | 'offline' | 'error'
          last_seen?: string
          created_at?: string
          updated_at?: string
        }
      }
      sensor_thresholds: {
        Row: {
          id: string
          device_id: string
          gas_threshold: number
          temp_threshold: number
          flame_threshold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          device_id: string
          gas_threshold: number
          temp_threshold: number
          flame_threshold: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          gas_threshold?: number
          temp_threshold?: number
          flame_threshold?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      alert_severity: 'low' | 'medium' | 'high' | 'critical'
      device_status: 'online' | 'offline' | 'error'
    }
  }
}
