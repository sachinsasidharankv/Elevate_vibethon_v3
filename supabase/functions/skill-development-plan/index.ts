import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const skillId = url.searchParams.get('skill_id');
    const idpId = url.searchParams.get('idp_id');

    if (req.method === 'GET') {
      // For GET requests, try to get parameters from both URL query and request body
      let requestBody = {};
      try {
        if (req.headers.get('content-type')?.includes('application/json')) {
          requestBody = await req.json();
        }
      } catch (e) {
        // No body or invalid JSON, continue with URL params only
      }
      
      const skillId = (requestBody as any).skill_id || url.searchParams.get('skill_id');
      const idpId = (requestBody as any).idp_id || url.searchParams.get('idp_id');

      let query = supabaseClient.from('skill_development_plan').select('*');
      
      if (skillId) {
        query = query.eq('skill_id', skillId);
      }
      
      if (idpId) {
        // Get skills for this IDP first, then get development plans
        const { data: skills, error: skillsError } = await supabaseClient
          .from('skills')
          .select('id')
          .eq('idp_id', idpId);
          
        if (skillsError) {
          throw skillsError;
        }
        
        const skillIds = skills.map(skill => skill.id);
        query = query.in('skill_id', skillIds);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // If no data found, create sample development plans
      if (!data || data.length === 0) {
        console.log('No development plans found, creating sample data...');
        
        let skillsToProcess = [];
        
        if (skillId) {
          // Get the specific skill
          const { data: skill, error: skillError } = await supabaseClient
            .from('skills')
            .select('*')
            .eq('id', skillId)
            .single();
            
          if (skillError) {
            throw skillError;
          }
          skillsToProcess = [skill];
        } else if (idpId) {
          // Get all skills for this IDP
          const { data: skills, error: skillsError } = await supabaseClient
            .from('skills')
            .select('*')
            .eq('idp_id', idpId);
            
          if (skillsError) {
            throw skillsError;
          }
          skillsToProcess = skills || [];
        }

        // Create development plans for each skill
        const newPlans = [];
        for (const skill of skillsToProcess) {
          const planInfo = {
            udemy: {
              title: `${skill.type.charAt(0).toUpperCase() + skill.type.slice(1)} Skills Enhancement Course`,
              duration: '8 hours',
              link: 'https://udemy.com'
            },
            youtube: {
              title: `Mastering ${skill.type.charAt(0).toUpperCase() + skill.type.slice(1)} Skills - Complete Tutorial`,
              link: 'https://youtube.com'
            },
            reading: {
              title: `${skill.type.charAt(0).toUpperCase() + skill.type.slice(1)} Best Practices Guide`,
              link: 'https://docs.example.com'
            },
            tasks: [
              `Complete practical exercise on ${skill.name.split(' ').slice(0, 3).join(' ')}`,
              `Apply learnings in a real project scenario`,
              `Share knowledge with team members`,
              `Document key insights and improvements`
            ]
          };

          const { data: newPlan, error: insertError } = await supabaseClient
            .from('skill_development_plan')
            .insert({
              skill_id: skill.id,
              plan_info: planInfo,
              progress: 'in_progress'
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating development plan:', insertError);
          } else {
            newPlans.push(newPlan);
          }
        }

        return new Response(JSON.stringify(newPlans), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const { skill_id, plan_info, progress = 'in_progress' } = await req.json();

      if (!skill_id || !plan_info) {
        return new Response(JSON.stringify({ error: 'skill_id and plan_info are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseClient
        .from('skill_development_plan')
        .insert({
          skill_id,
          plan_info,
          progress
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PUT') {
      const { id, plan_info, progress } = await req.json();

      if (!id) {
        return new Response(JSON.stringify({ error: 'id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const updateData: any = {};
      if (plan_info) updateData.plan_info = plan_info;
      if (progress) updateData.progress = progress;

      const { data, error } = await supabaseClient
        .from('skill_development_plan')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in skill-development-plan function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});