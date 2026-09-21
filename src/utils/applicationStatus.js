const STAGES = [
  { key: 'under_review', label: 'Under Review', sublabel: "We're taking a look" },
  { key: 'interview', label: 'Interview', sublabel: 'A quick call with our team' },
  { key: 'background_check', label: 'Background Check', sublabel: 'Standard for all cleaners' },
];

export const REVIEW_FLOW = ['under_review', 'interview', 'background_check', 'approved'];

export const STATUS_LABELS = {
  under_review: 'Under Review',
  interview: 'Interview',
  background_check: 'Background Check',
  approved: 'Approved',
  declined: 'Not selected',
  cancelled: 'Cancelled',
  active: 'Scheduled',
  on_the_way: 'On the way',
  in_progress: 'In progress',
  completed: 'Completed',
};

const COPY = {
  under_review: ['In progress', "We're on it! Your application is being reviewed by our team."],
  interview: ['Interview stage', 'Good news — our team will reach out to schedule a quick call.'],
  background_check: ['Background check', "Almost there! We're running a standard background check."],
  approved: ['Approved', "Congratulations, you're in! We'll be in touch with next steps."],
  declined: ['Not selected', "Thanks for applying. We won't be moving forward right now."],
};

export function nextStatus(status) {
  const i = REVIEW_FLOW.indexOf(status);
  return i >= 0 && i < REVIEW_FLOW.length - 1 ? REVIEW_FLOW[i + 1] : null;
}

export function isFinalStatus(status) {
  return status === 'approved' || status === 'declined' || status === 'cancelled';
}

export function getApplicationView(rawStatus) {
  const status = COPY[rawStatus] ? rawStatus : 'under_review';
  const approved = status === 'approved';
  const declined = status === 'declined';
  const isDecided = approved || declined;
  const stageIndex = Math.max(0, STAGES.findIndex((s) => s.key === status));

  const decision = approved
    ? { label: 'Approved', sublabel: "Welcome to the team — we'll be in touch" }
    : declined
      ? { label: 'Not selected', sublabel: "Thanks for applying — we'll email you" }
      : { label: 'Decision', sublabel: "We'll email you either way" };

  const steps = [
    { label: 'Application Submitted', sublabel: 'Today', done: true },
    ...STAGES.map((s, i) => ({
      label: s.label,
      sublabel: s.sublabel,
      done: isDecided || i < stageIndex,
      current: !isDecided && i === stageIndex,
    })),
    { ...decision, done: approved, current: declined },
  ];

  const currentIdx = steps.findIndex((s) => s.current);
  const percent = approved ? 100 : Math.round((currentIdx / (steps.length - 1)) * 100);

  return {
    steps,
    percent,
    label: STATUS_LABELS[status],
    headline: COPY[status][0],
    message: COPY[status][1],
  };
}
