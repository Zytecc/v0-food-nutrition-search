"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, TableIcon, Copy, ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DatabaseSetupProps {
  onSetupComplete: () => void
}

export function DatabaseSetup({ onSetupComplete }: DatabaseSetupProps) {
  const [copied, setCopied] = useState(false)

  const sqlScript = `-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  duration INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on workouts table
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Create policies for workouts table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);

-- Create exercises table
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

-- Enable RLS on exercises table
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Create policies for exercises table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises(workout_id);

-- Create journal_entries table
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

-- Enable RLS on journal_entries table
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for journal_entries table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleManualSetupComplete = () => {
    onSetupComplete()
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" /> Database Setup Required
        </CardTitle>
        <CardDescription>
          The necessary database tables need to be created before you can use this feature.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="instructions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instructions">Setup Instructions</TabsTrigger>
            <TabsTrigger value="sql">SQL Script</TabsTrigger>
          </TabsList>
          <TabsContent value="instructions" className="mt-4 space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <TableIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Manual Database Setup</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Follow these steps to set up the required database tables:
                </p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside mt-2 space-y-2">
                  <li>
                    Go to your{" "}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline inline-flex items-center"
                    >
                      Supabase Dashboard <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </li>
                  <li>Select your project</li>
                  <li>Go to the SQL Editor (click on "SQL Editor" in the left sidebar)</li>
                  <li>Create a new query</li>
                  <li>Copy the SQL script from the "SQL Script" tab and paste it into the SQL Editor</li>
                  <li>Click "Run" to execute the script</li>
                  <li>Once the script has executed successfully, come back here and click "Setup Complete" below</li>
                </ol>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="sql" className="mt-4">
            <div className="relative">
              <pre className="p-4 bg-muted rounded-md overflow-auto max-h-[400px] text-xs">
                <code>{sqlScript}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 flex items-center gap-1"
                onClick={copyToClipboard}
              >
                <Copy className="h-3 w-3" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button onClick={handleManualSetupComplete} className="w-full">
          Setup Complete
        </Button>
      </CardFooter>
    </Card>
  )
}
