export const APPLICATION_STEPS = [
  { label: 'Application Submitted', sublabel: 'Today', done: true },
  { label: 'Under Review', sublabel: "We're taking a look", current: true },
  { label: 'Interview', sublabel: 'A quick call with our team' },
  { label: 'Background Check', sublabel: 'Standard for all cleaners' },
  { label: 'Decision', sublabel: "We'll email you either way" },
];

export const APPLICATION_CURRENT_STEP_INDEX = 1;

export const APPLICATION_PROGRESS_PERCENT = Math.round(
  (APPLICATION_CURRENT_STEP_INDEX / (APPLICATION_STEPS.length - 1)) * 100,
);

export const APPLICATION_STATUS_LABEL = APPLICATION_STEPS[APPLICATION_CURRENT_STEP_INDEX].label;
