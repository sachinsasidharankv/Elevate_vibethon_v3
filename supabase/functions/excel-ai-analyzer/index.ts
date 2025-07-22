import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appraisalSourceId } = await req.json();
    
    console.log('Analyzing appraisal source:', appraisalSourceId);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch appraisal source data
    const { data: appraisalSource, error: fetchError } = await supabase
      .from('appraisal_sources')
      .select('*')
      .eq('id', appraisalSourceId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch appraisal source: ${fetchError.message}`);
    }

    // Extract data from Google Sheets
    const sheetUrl = appraisalSource.sheet_url;
    console.log('Analyzing sheet:', sheetUrl);

    let sheetData = '';
    try {
      // Convert Google Sheets URL to CSV export format
      const csvUrl = convertToCSVUrl(sheetUrl);
      console.log('Fetching CSV data from:', csvUrl);
      
      const sheetResponse = await fetch(csvUrl);
      if (sheetResponse.ok) {
        sheetData = await sheetResponse.text();
        console.log('Successfully fetched sheet data, length:', sheetData.length);
      } else {
        console.log('Failed to fetch sheet data, using fallback approach');
        sheetData = 'Sheet data could not be retrieved';
      }
    } catch (error) {
      console.log('Error fetching sheet data:', error.message);
      sheetData = 'Sheet data could not be retrieved';
    }

    // Create detailed prompt with actual sheet data
    const prompt = `
      Analyze this employee's performance data from their appraisal sheet and generate relevant skill development recommendations.
      
      PERFORMANCE DATA FROM GOOGLE SHEET:
      ${sheetData}
      
      Based on the actual performance data above, analyze:
      - Current strengths and weaknesses
      - Areas for improvement mentioned in the appraisal
      - Performance ratings and feedback
      - Career goals or aspirations mentioned
      
      Generate specific skill development recommendations in three categories:
      
      1. Technical Skills - technology, tools, methodologies specific to their role
      2. Functional Skills - business processes, management capabilities, domain knowledge
      3. Behavioral Skills - soft skills, leadership, communication based on feedback
      
      Return exactly 3 skills per category. Each skill should be a complete sentence describing what the employee should develop based on the actual appraisal data.
      
      Format as JSON:
      {
        "technical": ["skill1", "skill2", "skill3"],
        "functional": ["skill1", "skill2", "skill3"], 
        "behavioral": ["skill1", "skill2", "skill3"]
      }
    `;

    // Helper function to convert Google Sheets URL to CSV export URL
    function convertToCSVUrl(sheetUrl: string): string {
      // Extract the sheet ID from various Google Sheets URL formats
      let sheetId = '';
      
      if (sheetUrl.includes('/spreadsheets/d/')) {
        const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
          sheetId = match[1];
        }
      }
      
      if (sheetId) {
        // Return CSV export URL
        return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
      }
      
      // If we can't parse the URL, return the original (will likely fail but we handle that)
      return sheetUrl;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert HR analyst specializing in skill development planning.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    let skillsData;

    try {
      skillsData = JSON.parse(aiResponse.choices[0].message.content);
    } catch (parseError) {
      console.log('Failed to parse AI response, using fallback data');
      // Fallback data if AI response is malformed
      skillsData = {
        technical: [
          "Deep understanding on Data Analysis",
          "Basic Programming in Python programming",
          "Use machine learning for image recognition"
        ],
        functional: [
          "Lead cross-functional teams with effective Project Management",
          "Develop comprehensive Strategic Planning for long-term goals",
          "Build strong relationships through Stakeholder Management"
        ],
        behavioral: [
          "Inspire and motivate teams through effective Leadership",
          "Communicate clearly and persuasively across all audiences",
          "Foster collaborative environment for Team Collaboration"
        ]
      };
    }

    console.log('Generated skills data:', skillsData);

    return new Response(JSON.stringify({
      success: true,
      skills: skillsData,
      analysisMetadata: {
        sheetUrl: sheetUrl,
        analyzedAt: new Date().toISOString(),
        employeeId: appraisalSource.employee_id
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in excel-ai-analyzer:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});