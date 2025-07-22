# 🚀 ELEVATE: AI-Powered Employee Development Plan Tool

ELEVATE is a smart tool designed to **streamline and personalize employee growth** by leveraging AI to analyze performance appraisals and generate tailored Individual Development Plans (IDPs). It supports **Manager** and **Employee** roles, with each having a specific set of capabilities to facilitate a productive appraisal and planning cycle.

---

## 🔑 Key Features

### 1. 👤 Manager Login & Team Overview
- Managers can log in and view their direct reports.
- Select any employee to view their profile and performance data.

### 2. 📄 Profile View with Appraisal Data
- Displays current and past appraisal sheets.
- Pre-filled with performance metrics and feedback.

### 3. ⚙️ AI-Powered Skill Set Generation
- One-click "Generate Skill Set" button.
- Analyzes current appraisal and past IDP using an LLM-based agent.
- Suggests categorized skill sets:
  - **Technical**
  - **Functional**
  - **Behavioral**

### 4. ✏️ Skill Set Customization
- Managers can:
  - Edit AI-suggested skills
  - Add/remove skill items as needed

### 5. 📝 Development Plan Generation
- After skill finalization, managers can generate a personalized development plan.
- AI agent proposes:
  - Learning resources (YouTube, Udemy, blogs)
  - Timelines and milestones (6-month/12-month goals)
  - Hands-on exercises or certifications

### 6. ✅ Plan Customization & Finalization
- Managers can edit the proposed plan.
- Once finalized, the plan is saved for the next review cycle.

### 7. 🔔 Progress Notifications & Reminders (NEW)
- Employees will receive timely **notifications** based on their progress.
- Periodic **reminders** are sent to encourage plan completion within the review cycle.
- Helps ensure accountability and on-time completion of development goals.

---

## 🤖 AI-Driven Personalization

Two LLM-based agents enhance the experience:
- **Skill Identification Agent**: Extracts improvement areas from appraisal data.
- **Plan Recommendation Agent**: Recommends learning plans based on selected skills.

Example:
> For the skill _"Expertise in DB Optimization"_, the system may suggest:
> - A YouTube tutorial playlist  
> - A Udemy certification  
> - Practice tasks with deadlines

---

## 🧰 Technologies Used

| Stack           | Tool/Service                     |
|----------------|----------------------------------|
| Frontend       | [Lovable](https://lovable.so) (AI Design-to-Code tool) |
| Backend & DB   | [Supabase](https://supabase.com) (Edge functions & PostgreSQL) | https://supabase.com/dashboard/project/aypnelqopfcdgbncxgyl/database/schemas
| AI Integration | [OpenAI](https://openai.com) (LLM Agents) |

---



### Prerequisites
- Node.js and npm
- Supabase account & project
- OpenAI API key
