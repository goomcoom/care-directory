// Simulated agent for when no Claude API key is available (static hosting, or
// no server). It is not a lookup of exact phrases: a small intent parser maps
// the request to the same search_providers call the live agent would make,
// runs it against the shared directory, and templates a reply.

import { CATEGORY_BY_ID, DISTRICTS, DISTRICT_BY_ID, TOWN } from "../shared/directory";
import type { AgentAnswer, ChatRequest, ChatResponse, SearchInput } from "../shared/schemas";
import { describeSearch, localClock, searchProviders, toMinutes } from "../shared/search";
import type { AgentStep, CategoryId, DistrictId, Provider } from "../shared/types";
import { openStatus } from "./format";

function delay(min = 900, max = 1800) {
  return new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
}

// ---- Intent parsing -----------------------------------------------------------

interface Intent extends SearchInput {
  emergency?: boolean;
  health?: boolean;
}

const CATEGORY_KEYWORDS: Array<[CategoryId, RegExp]> = [
  ["urgent-care", /\b(urgent|a ?& ?e|out of hours|fracture|broken (arm|leg|wrist|ankle|bone)|x-?ray)s?\b/i],
  ["minor-injuries", /\b(cut|cuts|stitch|stitches|sprain|sprained|twisted|burn|burnt|scald|bite|bitten|splinter|graze|wound|bleeding)s?\b/i],
  ["pharmacy", /\b(pharmac|chemist|prescription|medicine|medication|paracetamol|ibuprofen|antihistamine|inhaler|flu jab|morning.after|plan b|hay ?fever)/i],
  ["dentist", /\b(dentist|dental|tooth|teeth|toothache|filling|crown|gum|wisdom)s?\b/i],
  ["optician", /\b(optician|optometrist|eye test|eyes?|glasses|spectacles|contact lens|vision|sight)s?\b/i],
  ["sexual-health", /\b(sexual health|sti|std|chlamydia|contracepti|condom|coil|prep|hiv test|smear)/i],
  ["mental-health", /\b(mental health|anxious|anxiety|depress|low mood|counsell|therap|panic|stress|talk to someone|suicid|self.harm)/i],
  ["physio", /\b(physio|back pain|neck pain|shoulder|knee|hamstring|sports injury|rehab)s?\b/i],
  ["podiatry", /\b(podiatr|chiropod|foot|feet|toenail|verruca|bunion|heel)s?\b/i],
  ["gp", /\b(gp|doctor|surgery|practice|register|registering|family doctor|blood test|referral|sick note|fit note)s?\b/i],
];

const EMERGENCY = /\b(chest pain|can'?t breathe|cannot breathe|struggling to breathe|not breathing|unconscious|collapsed|stroke|face droop|slurred|heavy bleeding|won'?t stop bleeding|bleeding heavily|overdose|taken too many|suicid|end my life|seizure|fitting|anaphyla|allergic reaction|severe allergic)\b/i;
const OPEN_NOW = /\b(now|open|right away|straight away|asap|today|urgently|immediately)\b/i;
const LATE = /\b(late|tonight|late night|out of hours|this evening|evening)\b/i;
const AFTER_WORK = /\b(after work|after 5|after five|after six|after 6)\b/i;
const NHS = /\bnhs\b/i;
const WALK_IN = /\b(walk.?in|without (an )?appointment|drop.?in|no appointment|turn up)\b/i;
const ACCESSIBLE = /\b(wheelchair|step.?free|accessible|mobility|disabled access|lift)\b/i;
const HEALTH_HINT = /\b(health|ill|sick|pain|hurt|ache|clinic|nurse|appointment|symptom|treat|help me find|where can i|nearest|closest)\b/i;

const QUERY_HINTS: Array<[RegExp, string]> = [
  [/\b(emergency contracepti|morning.after|plan b)\b/i, "emergency contraception"],
  [/\b(new patients?|register|registering|accepting|taking .{0,12}patients)\b/i, "new patients"],
  [/\b(emergency dentist|toothache|broken tooth|knocked out)\b/i, "emergency dentist"],
  [/\b(x-?ray)\b/i, "x-ray"],
  [/\b(travel (vaccin|jab)|vaccin|jab|immunis)/i, "vaccinations"],
  [/\b(sti|std|chlamydia|test)\b/i, "sti testing"],
  [/\b(deliver|delivery)\b/i, "delivery"],
  [/\b(home visit)\b/i, "home visits"],
  [/\b(red eye|painful eye|something in my eye)\b/i, "minor eye conditions"],
  [/\b(child|children|kid|kids|son|daughter)\b/i, "children"],
];

function parseDistrict(text: string): DistrictId | undefined {
  const t = text.toLowerCase();
  return DISTRICTS.find((d) => t.includes(d.name.toLowerCase()) || t.includes(d.id))?.id;
}

export function parseIntent(text: string): Intent {
  const intent: Intent = {};
  for (const [id, re] of CATEGORY_KEYWORDS) {
    if (re.test(text)) {
      intent.category = id;
      break;
    }
  }
  intent.district = parseDistrict(text);
  if (LATE.test(text)) intent.openAt = "21:30";
  else if (AFTER_WORK.test(text)) intent.openAt = "18:30";
  else if (OPEN_NOW.test(text)) intent.openNow = true;
  if (NHS.test(text)) intent.nhs = true;
  if (WALK_IN.test(text)) intent.walkIn = true;
  if (ACCESSIBLE.test(text)) intent.accessible = true;
  if (EMERGENCY.test(text)) intent.emergency = true;
  const hint = QUERY_HINTS.find(([re]) => re.test(text));
  if (hint) intent.query = hint[1];
  intent.health = Boolean(intent.category || intent.emergency || HEALTH_HINT.test(text));
  return intent;
}

/**
 * Merge the current message with earlier turns when the person is answering a
 * clarifying question ("Riverside" on its own carries no category).
 */
function resolveIntent(messages: ChatRequest["messages"]): Intent {
  const current = parseIntent(messages[messages.length - 1]!.text);
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const answeringFollowUp = lastAssistant ? lastAssistant.text.includes("?") : false;
  if (current.category || !answeringFollowUp) return current;

  const earlier = messages
    .slice(0, -1)
    .filter((m) => m.role === "user")
    .reverse()
    .map((m) => parseIntent(m.text))
    .find((i) => i.category);
  if (!earlier) return current;
  return { ...earlier, ...stripUndefined(current), health: true };
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

// ---- Reply templating -----------------------------------------------------------

const toSearch = (i: Intent): SearchInput => {
  const { category, district, openNow, openAt, nhs, walkIn, accessible, query } = i;
  return stripUndefined({ category, district, openNow, openAt, nhs, walkIn, accessible, query });
};

function describeProvider(p: Provider, now: Date): string {
  const status = openStatus(p, now);
  const where = DISTRICT_BY_ID[p.district].name;
  const facets = [p.nhs ? "NHS" : "private", p.walkIn ? "walk-in" : "by appointment", p.accessible ? "step-free" : null]
    .filter(Boolean)
    .join(", ");
  // "Open until 23:00" -> "is open until 23:00"; "Closed · opens Monday 09:00" -> "is closed and opens again Monday at 09:00".
  const when = status.open
    ? status.label.replace(/^Open/, "is open")
    : status.label.replace(/^Closed · opens (.*?)(\d{2}:\d{2})$/, (_m, day: string, time: string) =>
        day.trim() ? `is closed and opens again ${day.trim()} at ${time}` : `is closed and opens again at ${time}`,
      );
  return `${p.name} in ${where} (${facets}) ${when}. ${p.blurb}`;
}

function reasonFor(p: Provider, intent: Intent, now: Date): string {
  const bits: string[] = [];
  const status = openStatus(p, now);
  if (intent.openNow && status.open) bits.push("open now");
  if (intent.openAt) {
    const closes = p.hours[localClock(now).day]!.find((i) => toMinutes(i.close) > toMinutes(intent.openAt!));
    if (closes) bits.push(closes.close === "24:00" ? "open all night" : `open until ${closes.close} tonight`);
  }
  if (intent.nhs && p.nhs) bits.push("NHS");
  if (intent.walkIn && p.walkIn) bits.push("no appointment needed");
  if (intent.accessible && p.accessible) bits.push("step-free access");
  if (intent.query && p.tags.some((t) => t.includes(intent.query!.split(" ")[0]!))) bits.push(intent.query);
  if (bits.length === 0) return p.blurb;
  if (intent.district && p.district === intent.district) bits.push(`in ${DISTRICT_BY_ID[p.district].name}`);
  const s = bits.join(", ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

let stepCounter = 0;
const step = (label: string, detail?: string): AgentStep => ({ id: `sim_${++stepCounter}`, label, detail });

export async function simulatedChat(input: ChatRequest): Promise<ChatResponse> {
  await delay();
  const now = new Date(input.now);
  const intent = resolveIntent(input.messages);
  const steps: AgentStep[] = [];
  const text = input.messages[input.messages.length - 1]!.text;

  // Out of scope: nothing health-related in the message.
  if (!intent.health) {
    steps.push(step("Checking whether this is a health request", "not a health service"));
    return {
      steps,
      answer: {
        reply: `I can only help with finding health products and services in ${TOWN}: pharmacies, GPs, dentists, opticians, physiotherapy, sexual and mental health services, urgent treatment and podiatry. Tell me what you need and, if you can, which part of town you are in.`,
        recommendations: [],
      },
    };
  }

  // Possible emergency: safety line first, then route to urgent care.
  if (intent.emergency) {
    const search: SearchInput = { category: "urgent-care" };
    const result = searchProviders(search, now);
    steps.push(step(describeSearch(search), `${result.total} match`));
    const utc = result.matches[0]!;
    const miu = searchProviders({ category: "minor-injuries" }, now).matches[0];
    const recs = [{ providerId: utc.id, reason: "Open 24 hours for urgent problems once you have spoken to 999." }];
    if (miu && /bleed|cut/i.test(text)) recs.push({ providerId: miu.id, reason: reasonFor(miu, intent, now) });
    return {
      steps,
      answer: {
        safety:
          "What you describe could be an emergency. Call 999 now, or go straight to the nearest A&E, before anything else.",
        reply: `Once you have done that, the ${utc.name} in ${DISTRICT_BY_ID[utc.district].name} is the town's 24-hour service for urgent problems that are not life-threatening. I cannot judge how serious your symptoms are, so please let the 999 call handler guide you.`,
        recommendations: recs,
        followUp: undefined,
      },
    };
  }

  // No category worked out: ask what they need.
  if (!intent.category) {
    steps.push(step("Working out which kind of service fits", "unclear"));
    return {
      steps,
      answer: {
        reply: `I can point you to the right place in ${TOWN}. Could you say a little more about what you need, for example a prescription, a dentist, an eye test, or somewhere to be seen for an injury?`,
        recommendations: [],
        followUp: "What kind of service are you looking for?",
      },
    };
  }

  const category = CATEGORY_BY_ID[intent.category];
  let search = toSearch(intent);
  let result = searchProviders(search, now);
  steps.push(step(describeSearch(search), `${result.total} match${result.total === 1 ? "" : "es"}`));

  // Nothing open at that time: widen to any time so we can say when things open.
  if (result.total === 0 && (search.openNow || search.openAt)) {
    search = { ...search, openNow: undefined, openAt: undefined };
    result = searchProviders(search, now);
    steps.push(step(describeSearch(search), `${result.total} match${result.total === 1 ? "" : "es"}`));
  }
  // Nothing in the district: widen to the whole town.
  if (result.total === 0 && search.district) {
    search = { ...search, district: undefined };
    result = searchProviders(search, now);
    steps.push(step(describeSearch(search), `${result.total} match${result.total === 1 ? "" : "es"}`));
  }
  // Nothing with the free-text query either: drop it.
  if (result.total === 0 && search.query) {
    search = { ...search, query: undefined };
    result = searchProviders(search, now);
    steps.push(step(describeSearch(search), `${result.total} match${result.total === 1 ? "" : "es"}`));
  }

  if (result.total === 0) {
    return {
      steps,
      answer: {
        reply: `I could not find any ${category.plural} in ${TOWN} matching that. Try loosening one of the requirements, or tell me which part of town you are in and I will look again.`,
        recommendations: [],
      },
    };
  }

  const needsDistrict = !intent.district && result.total > 3;
  const top = result.matches.slice(0, needsDistrict ? 2 : 3);
  const recommendations = top.map((p) => ({ providerId: p.id, reason: reasonFor(p, intent, now) }));

  const widened = search.openNow !== intent.openNow || search.openAt !== intent.openAt || search.district !== intent.district;
  const parts: string[] = [];
  if (widened && (intent.openNow || intent.openAt) && !search.openNow && !search.openAt) {
    parts.push(intent.openAt ? `Nothing that fits is open that late, so here is what is open now or opens soonest.` : `Nothing that fits is open right now, so here is what opens soonest.`);
  } else if (widened && intent.district && !search.district) {
    parts.push(`There is nothing like that in ${DISTRICT_BY_ID[intent.district].name} itself, so I have looked across the whole town.`);
  }
  parts.push(top.map((p) => describeProvider(p, now)).join(" "));
  if (result.total > top.length) {
    parts.push(
      `There are ${result.total - top.length} more ${category.plural} that could work; you can browse them all in the directory.`,
    );
  }

  const answer: AgentAnswer = {
    reply: parts.join("\n\n"),
    recommendations,
    followUp: needsDistrict ? `I can narrow this down: which part of ${TOWN} are you in?` : undefined,
  };
  return { steps, answer };
}
