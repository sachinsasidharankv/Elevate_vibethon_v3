import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { skills } = await req.json();
    
    console.log('Generating development plan for skills:', skills);

    // Simulate AI-generated development plan
    const prompt = `
      Create a comprehensive development plan for these skills. For each skill, provide:
      
      1. Udemy Course: Course title, duration, realistic link
      2. YouTube Tutorial: Video title, realistic link  
      3. Reading Material: Article/blog title, realistic link
      4. Practical Assignments: 3 specific actionable tasks
      
      Skills to plan for:
      Technical: ${skills.technical?.join(', ') || 'None'}
      Functional: ${skills.functional?.join(', ') || 'None'}  
      Behavioral: ${skills.behavioral?.join(', ') || 'None'}
      
      Return as JSON with this structure:
      {
        "technical": {
          "skillName": {
            "udemy": { "title": "", "duration": "", "link": "" },
            "youtube": { "title": "", "link": "" },
            "reading": { "title": "", "link": "" },
            "tasks": ["Task 1: ...", "Task 2: ...", "Task 3: ..."]
          }
        },
        "functional": { ... },
        "behavioral": { ... }
      }
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert learning and development specialist. Create realistic, practical development plans with real course titles and actionable tasks.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    let developmentPlan;

    try {
      developmentPlan = JSON.parse(aiResponse.choices[0].message.content);
    } catch (parseError) {
      console.log('Failed to parse AI response, using fallback data');
      // Fallback development plan
      developmentPlan = {
        technical: {
          "Deep understanding on Data Analysis": {
            udemy: {
              title: "The Complete Data Analysis Course: Excel, R & Python",
              duration: "32 hours",
              link: "https://www.udemy.com/course/the-complete-data-analysis-course/"
            },
            youtube: {
              title: "Data Analysis with Python - Full Course for Beginners",
              link: "https://www.youtube.com/watch?v=r-uOLxNrNk8"
            },
            reading: {
              title: "Python Data Analysis Handbook",
              link: "https://jakevdp.github.io/PythonDataScienceHandbook/"
            },
            tasks: [
              "Task 1: Analyze Netflix dataset using pandas and create visualizations",
              "Task 2: Build interactive Tableau dashboards for company metrics",
              "Task 3: Create comprehensive sales performance report with Python"
            ]
          },
          "Basic Programming in Python programming": {
            udemy: {
              title: "Complete Python Bootcamp From Zero to Hero in Python 3",
              duration: "22 hours",
              link: "https://www.udemy.com/course/complete-python-bootcamp/"
            },
            youtube: {
              title: "Python Tutorial - Python for Beginners",
              link: "https://www.youtube.com/watch?v=_uQrJ0TkZlc"
            },
            reading: {
              title: "Automate the Boring Stuff with Python",
              link: "https://automatetheboringstuff.com/"
            },
            tasks: [
              "Task 1: Build a calculator GUI using tkinter",
              "Task 2: Create a web scraper for news articles",
              "Task 3: Develop a personal expense tracker application"
            ]
          },
          "Use machine learning for image recognition": {
            udemy: {
              title: "Computer Vision A-Z™: Learn OpenCV, TensorFlow & More",
              duration: "23 hours",
              link: "https://www.udemy.com/course/computer-vision-a-z/"
            },
            youtube: {
              title: "Deep Learning for Computer Vision with Python",
              link: "https://www.youtube.com/watch?v=QfNvhPx5Px8"
            },
            reading: {
              title: "Deep Learning for Computer Vision",
              link: "https://www.pyimagesearch.com/deep-learning-computer-vision-python-book/"
            },
            tasks: [
              "Task 1: Build MNIST digit classifier using TensorFlow",
              "Task 2: Create face detection system with OpenCV",
              "Task 3: Develop dog vs cat image recognition model"
            ]
          }
        },
        functional: {
          "Lead cross-functional teams with effective Project Management": {
            udemy: {
              title: "Project Management Professional (PMP) Certification",
              duration: "35 hours",
              link: "https://www.udemy.com/course/project-management-professional/"
            },
            youtube: {
              title: "Project Management Tutorial for Beginners",
              link: "https://www.youtube.com/watch?v=3qYbkHsJuno"
            },
            reading: {
              title: "A Guide to the Project Management Body of Knowledge",
              link: "https://www.pmi.org/pmbok-guide-standards"
            },
            tasks: [
              "Task 1: Lead a cross-departmental initiative using Agile methodology",
              "Task 2: Create project timeline and risk assessment for upcoming project",
              "Task 3: Implement team communication framework using project management tools"
            ]
          },
          "Develop comprehensive Strategic Planning for long-term goals": {
            udemy: {
              title: "Strategic Planning Fundamentals",
              duration: "18 hours",
              link: "https://www.udemy.com/course/strategic-planning-fundamentals/"
            },
            youtube: {
              title: "Strategic Planning Process - Complete Guide",
              link: "https://www.youtube.com/watch?v=BcY1pOj9q3w"
            },
            reading: {
              title: "Good Strategy Bad Strategy by Richard Rumelt",
              link: "https://www.goodreads.com/book/show/11721966-good-strategy-bad-strategy"
            },
            tasks: [
              "Task 1: Develop 3-year strategic plan for your department",
              "Task 2: Conduct SWOT analysis for current business unit",
              "Task 3: Create OKR framework linking team goals to company objectives"
            ]
          },
          "Build strong relationships through Stakeholder Management": {
            udemy: {
              title: "Stakeholder Management & Engagement Masterclass",
              duration: "12 hours",
              link: "https://www.udemy.com/course/stakeholder-management-engagement/"
            },
            youtube: {
              title: "Stakeholder Management Best Practices",
              link: "https://www.youtube.com/watch?v=Qx_VqHB8hWA"
            },
            reading: {
              title: "The Stakeholder Strategy by Ann Svendsen",
              link: "https://www.amazon.com/Stakeholder-Strategy-Ann-Svendsen/dp/1576750574"
            },
            tasks: [
              "Task 1: Map all project stakeholders and their influence levels",
              "Task 2: Develop communication plan for different stakeholder groups",
              "Task 3: Facilitate stakeholder workshop to align on project goals"
            ]
          }
        },
        behavioral: {
          "Inspire and motivate teams through effective Leadership": {
            udemy: {
              title: "Leadership: Practical Leadership Skills",
              duration: "19 hours",
              link: "https://www.udemy.com/course/leadership-practical-leadership-skills/"
            },
            youtube: {
              title: "Leadership Theory and Practice",
              link: "https://www.youtube.com/watch?v=NU-lQOBGLzA"
            },
            reading: {
              title: "Leaders Eat Last by Simon Sinek",
              link: "https://simonsinek.com/product/leaders-eat-last/"
            },
            tasks: [
              "Task 1: Implement weekly one-on-ones with all team members",
              "Task 2: Create team recognition program to celebrate achievements",
              "Task 3: Lead team through change management initiative"
            ]
          },
          "Communicate clearly and persuasively across all audiences": {
            udemy: {
              title: "Communication Skills Training",
              duration: "16 hours",
              link: "https://www.udemy.com/course/communication-skills-training/"
            },
            youtube: {
              title: "Effective Communication Skills",
              link: "https://www.youtube.com/watch?v=HAnw168huqA"
            },
            reading: {
              title: "Crucial Conversations by Kerry Patterson",
              link: "https://cruciallearning.com/crucial-conversations-book/"
            },
            tasks: [
              "Task 1: Present quarterly results to executive leadership",
              "Task 2: Facilitate difficult conversation between conflicting team members",
              "Task 3: Create and deliver training presentation to new hires"
            ]
          },
          "Foster collaborative environment for Team Collaboration": {
            udemy: {
              title: "Building High-Performance Teams",
              duration: "14 hours",
              link: "https://www.udemy.com/course/building-high-performance-teams/"
            },
            youtube: {
              title: "Team Building and Collaboration Strategies",
              link: "https://www.youtube.com/watch?v=TQEq8NDjJWs"
            },
            reading: {
              title: "The Five Dysfunctions of a Team by Patrick Lencioni",
              link: "https://www.tablegroup.com/topics-and-resources/teamwork-5-dysfunctions/"
            },
            tasks: [
              "Task 1: Organize team-building workshop to improve collaboration",
              "Task 2: Implement daily standups and retrospectives",
              "Task 3: Create cross-training program for knowledge sharing"
            ]
          }
        }
      };
    }

    console.log('Generated development plan:', Object.keys(developmentPlan));

    return new Response(JSON.stringify({
      success: true,
      developmentPlan: developmentPlan,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in plan-idp:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});