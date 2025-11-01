"use client";

import { FormEvent, useMemo, useState } from "react";
import styles from "./page.module.css";

type PhaseKey = "discover" | "practice" | "build" | "polish";
type EnergyLevel = "Deep" | "Medium" | "Light";

interface PhaseDefinition {
  key: PhaseKey;
  label: string;
  ratio: number;
  summary: string;
  milestone: string;
  focusTemplates: string[];
  coreActivities: string[];
  enrichmentActivities: string[];
  kickoffs: string[];
}

interface PhaseSummary {
  key: PhaseKey;
  label: string;
  startDay: number;
  endDay: number;
  summary: string;
  milestone: string;
  ratio: number;
}

interface DayPlan {
  day: number;
  phaseKey: PhaseKey;
  phaseLabel: string;
  focus: string;
  energy: EnergyLevel;
  activities: string[];
  milestone?: string;
}

interface GeneratedPlan {
  topic: string;
  totalDays: number;
  phases: PhaseSummary[];
  cadence: Record<EnergyLevel, number>;
  days: DayPlan[];
}

const PHASES: PhaseDefinition[] = [
  {
    key: "discover",
    label: "Discover",
    ratio: 0.25,
    summary: "Map the fundamentals and build a nuanced understanding of the core ideas.",
    milestone:
      "You can explain the pillars of {topic} in a concise narrative tailored to a beginner.",
    focusTemplates: [
      "Orient yourself around the landscape of {topic} and gather high-quality resources.",
      "Deepen your conceptual grip on the building blocks that power {topic}.",
      "Connect foundational concepts in {topic} to things you already understand.",
      "Capture the vocabulary, patterns, and mental models that underpin {topic}.",
    ],
    coreActivities: [
      "Skim a respected primer or course overview for {topic} and highlight the 5 headline themes.",
      "Draft a personal glossary for {topic}—define 10 key terms in your own words.",
      "Diagram how the main components of {topic} relate to each other using a mind map or outline.",
      "List the frequent pitfalls or misconceptions people have when learning {topic}.",
      "Identify three expert voices or communities focused on {topic} and note why they stand out.",
    ],
    enrichmentActivities: [
      "Summarize what excites you about {topic} in a short paragraph.",
      "Capture lingering questions about {topic} for later investigation.",
      "Create a spaced-repetition deck (or notes) for the most essential {topic} facts.",
      "Document a real-world example of {topic} done well and break down why it works.",
    ],
    kickoffs: [
      "Clarify your definition of success for this sprint: how will you know you understand {topic}?",
      "Decide which resource will be your primary guide for the first few days.",
    ],
  },
  {
    key: "practice",
    label: "Practice",
    ratio: 0.35,
    summary: "Translate knowledge into skill through targeted exercises and rapid feedback loops.",
    milestone:
      "You can complete core exercises in {topic} without looking up the solution first.",
    focusTemplates: [
      "Run hands-on drills to reinforce the mechanics of {topic}.",
      "Push into progressively harder reps to expose weak spots in {topic}.",
      "Alternate between guided tutorials and self-directed practice on {topic}.",
      "Use feedback to refine your workflow and habits around {topic}.",
    ],
    coreActivities: [
      "Complete a bite-sized tutorial or walkthrough centered on one key {topic} skill.",
      "Implement what you learned by replicating the example without peeking at the solution.",
      "Time-box a challenge from a community or platform focused on {topic}.",
      "Self-review your work—annotate what felt smooth and what felt brittle.",
      "Teach someone (or rubber duck) a concept from {topic} to confirm your mastery.",
    ],
    enrichmentActivities: [
      "Automate a small routine or create a cheatsheet for a repetitive {topic} task.",
      "Document your debugging or problem-solving process so you can iterate on it tomorrow.",
      "Share a micro-win or question with the {topic} community to invite feedback.",
      "Capture metrics about speed, accuracy, or confidence for each {topic} session.",
    ],
    kickoffs: [
      "Pick 2–3 subskills of {topic} to emphasize this week and define a mini-outcome for each.",
    ],
  },
  {
    key: "build",
    label: "Build",
    ratio: 0.25,
    summary: "Synthesize your skills in a project that simulates a real-world scenario.",
    milestone:
      "You have a tangible artifact or prototype that demonstrates applied {topic} skill.",
    focusTemplates: [
      "Design your project scope so it stretches you but remains feasible within the timeline.",
      "Advance your project by layering in new features or refinements in {topic}.",
      "Stress-test your work: hunt for bugs, edge cases, and opportunities to simplify.",
      "Document decisions and trade-offs in your {topic} project for future reflection.",
    ],
    coreActivities: [
      "Outline user stories or requirements for a focused {topic} project.",
      "Set up a version control or tracking system to capture your progress transparently.",
      "Implement a meaningful feature end-to-end and log any blockers you hit.",
      "Request feedback from a peer or mentor and note action items.",
      "Refine the project by improving structure, readability, or user experience.",
    ],
    enrichmentActivities: [
      "Add automated checks, tests, or validation around a fragile part of your project.",
      "Write a short changelog entry capturing what you built today in {topic}.",
      "Capture screenshots or demos that evidence your progress on {topic}.",
      "List ideas for future iterations while keeping scope disciplined.",
    ],
    kickoffs: [
      "Decide what 'done' looks like for the project and map the must-have components.",
    ],
  },
  {
    key: "polish",
    label: "Polish",
    ratio: 0.15,
    summary: "Lock in the learning with reflection, spaced review, and forward-looking plans.",
    milestone:
      "You can articulate your learning journey and confidently outline your next steps in {topic}.",
    focusTemplates: [
      "Review and reinforce the most important ideas and heuristics from {topic}.",
      "Codify habits, templates, or systems so {topic} stays fresh beyond the sprint.",
      "Integrate feedback, close any knowledge gaps, and celebrate progress in {topic}.",
      "Plan the next 30 days of maintenance to keep momentum with {topic}.",
    ],
    coreActivities: [
      "Conduct a retrospective: what clicked about {topic}, what was hard, and why?",
      "Consolidate your notes into a single evergreen document or knowledge base.",
      "Turn your project into a shareable artifact (README, post, short presentation).",
      "Schedule spaced reviews or recurring practice blocks for {topic}.",
      "Write a short narrative about your {topic} journey and post it or share with peers.",
    ],
    enrichmentActivities: [
      "Identify 3 advanced resources to tackle next and capture why they matter.",
      "Create a checklist for how you'll practice {topic} weekly after this plan ends.",
      "Audit your toolkit—what tools, libraries, or references for {topic} will you keep using?",
      "Celebrate a win: note what future-you will thank present-you for learning about {topic}.",
    ],
    kickoffs: [
      "Choose how you'll demonstrate your {topic} growth (portfolio, presentation, mentor review).",
    ],
  },
];

const ENERGY_SEQUENCE: EnergyLevel[] = ["Deep", "Medium", "Medium", "Light"];

const PLACEHOLDER_TOPIC = "your chosen topic";

function formatWithTopic(template: string, topic: string): string {
  return template.replaceAll("{topic}", topic);
}

function distributePhases(days: number): { index: number; days: number }[] {
  const raw = PHASES.map((phase) => phase.ratio * days);
  let counts: number[] = raw.map((value) => Math.floor(value));
  const used = counts.reduce((acc, value) => acc + value, 0);
  let remaining = days - used;
  const order = raw
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);

  let pointer = 0;
  while (remaining > 0 && pointer < order.length) {
    counts[order[pointer].index] += 1;
    remaining -= 1;
    pointer += 1;
  }

  // Ensure at least one day overall is assigned if totals were zero.
  if (days > 0 && counts.every((count) => count === 0)) {
    const fallbackIndex = order.length > 0 ? order[0].index : 0;
    counts = counts.map((value, index) => (index === fallbackIndex ? days : value));
  }

  return counts
    .map((count, index) => ({ index, days: count }))
    .filter((entry) => entry.days > 0);
}

function energyForDay(dayNumber: number): EnergyLevel {
  return ENERGY_SEQUENCE[(dayNumber - 1) % ENERGY_SEQUENCE.length];
}

function buildDailyActivities(
  phase: PhaseDefinition,
  topic: string,
  dayIndex: number,
): string[] {
  const activities: string[] = [];
  const core =
    phase.coreActivities[dayIndex % phase.coreActivities.length] ??
    phase.coreActivities[phase.coreActivities.length - 1];
  activities.push(formatWithTopic(core, topic));

  if (dayIndex === 0 && phase.kickoffs.length > 0) {
    activities.push(formatWithTopic(phase.kickoffs[dayIndex % phase.kickoffs.length], topic));
  }

  const enrichment =
    phase.enrichmentActivities[dayIndex % phase.enrichmentActivities.length] ??
    phase.enrichmentActivities[phase.enrichmentActivities.length - 1];
  activities.push(formatWithTopic(enrichment, topic));

  activities.push(
    "Log one insight, one blocker, and one next step in your learning journal.",
  );

  return activities;
}

function generateSchedule(topicInput: string, totalDays: number): GeneratedPlan {
  const topic = topicInput.trim() || PLACEHOLDER_TOPIC;
  const days = Math.max(1, Math.min(totalDays, 365));
  const phaseAllocations = distributePhases(days);

  const phases: PhaseSummary[] = [];
  const dayPlans: DayPlan[] = [];
  const cadence: Record<EnergyLevel, number> = {
    Deep: 0,
    Medium: 0,
    Light: 0,
  };

  let dayCursor = 1;

  phaseAllocations.forEach(({ index, days: phaseDays }) => {
    const definition = PHASES[index];
    const startDay = dayCursor;
    for (let i = 0; i < phaseDays; i += 1) {
      const globalDay = dayCursor;
      const focusTemplate =
        definition.focusTemplates[i % definition.focusTemplates.length] ??
        definition.focusTemplates[definition.focusTemplates.length - 1];
      const focus = formatWithTopic(focusTemplate, topic);
      const energy = energyForDay(globalDay);
      cadence[energy] += 1;

      const activities = buildDailyActivities(definition, topic, i);
      const milestone =
        i === phaseDays - 1
          ? formatWithTopic(definition.milestone, topic)
          : undefined;

      dayPlans.push({
        day: globalDay,
        phaseKey: definition.key,
        phaseLabel: definition.label,
        focus,
        energy,
        activities,
        milestone,
      });

      dayCursor += 1;
    }

    const endDay = dayCursor - 1;
    phases.push({
      key: definition.key,
      label: definition.label,
      startDay,
      endDay,
      summary: formatWithTopic(definition.summary, topic),
      milestone: formatWithTopic(definition.milestone, topic),
      ratio: definition.ratio,
    });
  });

  return {
    topic,
    totalDays: days,
    phases,
    cadence,
    days: dayPlans,
  };
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [daysInput, setDaysInput] = useState("30");
  const [schedule, setSchedule] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedDays = useMemo(() => {
    const value = Number(daysInput);
    return Number.isFinite(value) ? value : NaN;
  }, [daysInput]);

  const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!topic.trim()) {
      setError("Add a topic you want to master.");
      setSchedule(null);
      return;
    }
    if (!Number.isFinite(parsedDays) || parsedDays < 1) {
      setError("Set a positive number of days for your learning sprint.");
      setSchedule(null);
      return;
    }
    if (parsedDays > 365) {
      setError("Choose a timeframe of 365 days or fewer to keep the plan actionable.");
      setSchedule(null);
      return;
    }
    setError(null);
    setSchedule(generateSchedule(topic, Math.round(parsedDays)));
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.badge}>Learning Sprint Planner</span>
          <h1 className={styles.title}>
            Craft a personalised roadmap for mastering {schedule?.topic ?? "your topic"}.
          </h1>
          <p className={styles.description}>
            Tell us what you want to learn and how long you have. We&apos;ll tailor a day-by-day plan
            that balances discovery, practice, building, and reflection so you stay consistent.
          </p>
        </section>

        <form className={styles.form} onSubmit={handleGenerate}>
          <div className={styles.inputGroup}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="topic">
                Topic focus
              </label>
              <input
                id="topic"
                name="topic"
                className={styles.input}
                placeholder="e.g. React for front-end engineering"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="days">
                Days to go
              </label>
              <input
                id="days"
                name="days"
                type="number"
                min={1}
                max={365}
                className={styles.input}
                value={daysInput}
                onChange={(event) => setDaysInput(event.target.value)}
                required
              />
              <span className={styles.helper}>Plan supports 1 to 365 days.</span>
            </div>
          </div>
          <button className={styles.button} type="submit">
            Generate schedule
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>

        {schedule && (
          <section className={styles.results}>
            <section className={styles.phaseGrid}>
              {schedule.phases.map((phase) => (
                <article key={phase.key} className={styles.phaseCard}>
                  <div className={styles.phaseHeader}>
                    <span className={styles.phaseLabel}>{phase.label}</span>
                    <span className={styles.phaseRange}>
                      Days {phase.startDay} – {phase.endDay}
                    </span>
                  </div>
                  <p className={styles.phaseSummary}>{phase.summary}</p>
                  <p className={styles.phaseMilestone}>
                    <strong>Milestone:</strong> {phase.milestone}
                  </p>
                  <div className={styles.phaseProgress}>
                    <div
                      className={styles.phaseFill}
                      style={{
                        width: `${Math.max(
                          12,
                          Math.round(
                            ((phase.endDay - phase.startDay + 1) / schedule.totalDays) * 100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </article>
              ))}
            </section>

            <section className={styles.cadence}>
              <h2 className={styles.sectionTitle}>Cadence overview</h2>
              <div className={styles.cadenceGrid}>
                {(["Deep", "Medium", "Light"] satisfies EnergyLevel[]).map((level) => (
                  <div key={level} className={styles.cadenceCard}>
                    <span className={styles.cadenceLabel}>{level} focus</span>
                    <span className={styles.cadenceValue}>{schedule.cadence[level]}</span>
                    <span className={styles.cadenceHint}>
                      {level === "Deep"
                        ? "Plan longer, uninterrupted sessions to push breakthroughs."
                        : level === "Medium"
                          ? "Keep momentum with solid practice blocks and small challenges."
                          : "Use lighter days for reflection, review, and recovery."}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.dayListSection}>
              <h2 className={styles.sectionTitle}>Daily roadmap</h2>
              <div className={styles.dayList}>
                {schedule.days.map((day) => (
                  <article key={day.day} className={styles.dayCard}>
                    <header className={styles.dayHeader}>
                      <span className={styles.dayNumber}>Day {day.day}</span>
                      <span className={`${styles.energyBadge} ${styles[day.energy.toLowerCase()]}`}>
                        {day.energy} focus
                      </span>
                    </header>
                    <p className={styles.dayPhase}>{day.phaseLabel}</p>
                    <p className={styles.dayFocus}>{day.focus}</p>
                    <ul className={styles.activityList}>
                      {day.activities.map((activity, index) => (
                        <li key={index}>{activity}</li>
                      ))}
                    </ul>
                    {day.milestone && (
                      <p className={styles.dayMilestone}>
                        <strong>Checkpoint:</strong> {day.milestone}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}
