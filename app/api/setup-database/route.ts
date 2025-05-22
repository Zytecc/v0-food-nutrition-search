import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export async function POST() {
  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Execute the SQL script directly using a raw query
    // First, create the extension
    try {
      await supabase
        .from("_sql")
        .select("*")
        .execute(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      `)
    } catch (err) {
      console.log("Extension might already exist:", err)
      // Continue even if this fails
    }

    // Create workouts table
    try {
      await supabase
        .from("_sql")
        .select("*")
        .execute(`
        CREATE TABLE IF NOT EXISTS workouts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          notes TEXT,
          duration INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own workouts" ON workouts;
        CREATE POLICY "Users can view their own workouts" 
          ON workouts FOR SELECT 
          USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can insert their own workouts" ON workouts;
        CREATE POLICY "Users can insert their own workouts" 
          ON workouts FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can update their own workouts" ON workouts;
        CREATE POLICY "Users can update their own workouts" 
          ON workouts FOR UPDATE 
          USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can delete their own workouts" ON workouts;
        CREATE POLICY "Users can delete their own workouts" 
          ON workouts FOR DELETE 
          USING (auth.uid() = user_id);
        
        CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
        CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
      `)
    } catch (err) {
      console.error("Error creating workouts table:", err)
      // Continue to try creating other tables
    }

    // Create exercises table
    try {
      await supabase
        .from("_sql")
        .select("*")
        .execute(`
        CREATE TABLE IF NOT EXISTS exercises (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          sets INTEGER NOT NULL,
          reps INTEGER NOT NULL,
          weight NUMERIC,
          weight_unit TEXT DEFAULT 'lbs',
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view exercises for their workouts" ON exercises;
        CREATE POLICY "Users can view exercises for their workouts" 
          ON exercises FOR SELECT 
          USING ((SELECT user_id FROM workouts WHERE id = workout_id) = auth.uid());
        
        DROP POLICY IF EXISTS "Users can insert exercises for their workouts" ON exercises;
        CREATE POLICY "Users can insert exercises for their workouts" 
          ON exercises FOR INSERT 
          WITH CHECK ((SELECT user_id FROM workouts WHERE id = workout_id) = auth.uid());
        
        DROP POLICY IF EXISTS "Users can update exercises for their workouts" ON exercises;
        CREATE POLICY "Users can update exercises for their workouts" 
          ON exercises FOR UPDATE 
          USING ((SELECT user_id FROM workouts WHERE id = workout_id) = auth.uid());
        
        DROP POLICY IF EXISTS "Users can delete exercises for their workouts" ON exercises;
        CREATE POLICY "Users can delete exercises for their workouts" 
          ON exercises FOR DELETE 
          USING ((SELECT user_id FROM workouts WHERE id = workout_id) = auth.uid());
        
        CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises(workout_id);
      `)
    } catch (err) {
      console.error("Error creating exercises table:", err)
      // Continue to try creating other tables
    }

    // Create journal_entries table
    try {
      await supabase
        .from("_sql")
        .select("*")
        .execute(`
        CREATE TABLE IF NOT EXISTS journal_entries (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          mood TEXT,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own journal entries" ON journal_entries;
        CREATE POLICY "Users can view their own journal entries" 
          ON journal_entries FOR SELECT 
          USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can insert their own journal entries" ON journal_entries;
        CREATE POLICY "Users can insert their own journal entries" 
          ON journal_entries FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can update their own journal entries" ON journal_entries;
        CREATE POLICY "Users can update their own journal entries" 
          ON journal_entries FOR UPDATE 
          USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can delete their own journal entries" ON journal_entries;
        CREATE POLICY "Users can delete their own journal entries" 
          ON journal_entries FOR DELETE 
          USING (auth.uid() = user_id);
        
        CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
        CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
      `)
    } catch (err) {
      console.error("Error creating journal_entries table:", err)
      // Continue anyway
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting up database:", error)
    return NextResponse.json({ error: `Failed to set up database: ${(error as Error).message}` }, { status: 500 })
  }
}
