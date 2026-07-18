import "./styles.css";
import {
  endFeed,
  elapsedMs,
  formatDuration,
  isFeedOverdue,
  lastFeedStartedAt,
  markScheduleStart,
  nextFeedAt,
  setFeedIntervalHours,
  setFeedSide,
  startFeed,
} from "./feed";
import {
  formatDateTime,
  formatTime,
  isOverdue,
  MEDICINE_LABELS,
  nextDueAt,
  takeMedicine,
} from "./medicine";
import {
  MAX_FEED_INTERVAL_HOURS,
  MIN_FEED_INTERVAL_HOURS,
  loadState,
  saveState,
} from "./storage";
import type { AppState, BreastSide, MedicineKey } from "./types";

let state: AppState = loadState();
let selectedSide: BreastSide =
  state.activeFeed?.side ?? state.lastBreast ?? "left";
let tickId: number | null = null;

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing #app");
const app: HTMLDivElement = root;

function persist(next: AppState): void {
  state = next;
  saveState(state);
  render();
}

function renderMedicineCard(key: MedicineKey): string {
  const last = state.medicines[key].lastTakenAt;
  const overdue = isOverdue(last);
  const dueClass = !last ? "" : overdue ? "is-due" : "is-ok";
  const nextLabel = last
    ? overdue
      ? `${formatTime(nextDueAt(last).toISOString())} · due now`
      : formatTime(nextDueAt(last).toISOString())
    : "—";

  return `
    <div class="med-card" data-med="${key}">
      <div class="med-header">
        <h3>${MEDICINE_LABELS[key]}</h3>
      </div>
      <div class="med-times">
        <div class="med-stat">
          <span>Last taken</span>
          <strong>${last ? formatDateTime(last) : "Not yet"}</strong>
        </div>
        <div class="med-stat ${dueClass}">
          <span>Next dose</span>
          <strong>${nextLabel}</strong>
        </div>
      </div>
      <button type="button" class="btn-med" data-action="take-med" data-med="${key}">
        Took ${MEDICINE_LABELS[key]}
      </button>
    </div>
  `;
}

function renderHistory(): string {
  if (state.feeds.length === 0) {
    return `<p class="empty-history">No feeds logged yet.</p>`;
  }

  const items = state.feeds
    .map((feed) => {
      return `
        <li>
          <span>
            <span class="side">${feed.side}</span>
            <span class="muted"> · ${formatDateTime(feed.endedAt)}</span>
          </span>
          <span>${formatDuration(feed.durationMs)}</span>
        </li>
      `;
    })
    .join("");

  return `<ul class="history">${items}</ul>`;
}

function currentTimerLabel(): string {
  if (!state.activeFeed) return "00:00";
  return formatDuration(elapsedMs(state.activeFeed.startedAt));
}

function renderFeedMeta(): string {
  const last = lastFeedStartedAt(state);
  const next = nextFeedAt(state);
  const overdue = isFeedOverdue(state);
  const nextClass = !next ? "" : overdue ? "is-due" : "is-ok";
  const nextLabel = next
    ? overdue
      ? `${formatTime(next.toISOString())} · due now`
      : formatTime(next.toISOString())
    : "—";

  return `
    <div class="meta-block">
      <div class="meta">
        <div>
          <span>Last feed</span>
          <strong>${last ? formatTime(last) : "—"}</strong>
        </div>
        <div class="${nextClass}" style="text-align:right">
          <span>Next feed</span>
          <strong>${nextLabel}</strong>
        </div>
      </div>
      <button
        type="button"
        class="btn btn-start btn-start-feed"
        data-action="mark-schedule"
      >Start Feed</button>
    </div>
  `;
}

function render(): void {
  const feeding = Boolean(state.activeFeed);
  const interval = state.feedIntervalHours;
  const intervalLabel =
    interval === 1 ? "1 hour" : `${Number(interval.toFixed(1))} hours`;

  app.innerHTML = `
    <header class="brand">
      <h1>Nest</h1>
      <p>Feeding &amp; medicine, for the long nights.</p>
    </header>

    <section class="panel" aria-labelledby="feeding-heading">
      <h2 id="feeding-heading">Feeding</h2>
      ${renderFeedMeta()}

      <div class="side-toggle" role="group" aria-label="Breast side">
        <button
          type="button"
          class="side-btn ${selectedSide === "left" ? "is-selected" : ""}"
          data-action="select-side"
          data-side="left"
        >Left</button>
        <button
          type="button"
          class="side-btn ${selectedSide === "right" ? "is-selected" : ""}"
          data-action="select-side"
          data-side="right"
        >Right</button>
      </div>

      <div class="timer ${feeding ? "" : "is-idle"}" aria-live="polite">
        ${currentTimerLabel()}
      </div>

      <div class="actions">
        <button
          type="button"
          class="btn btn-start"
          data-action="start-timer"
          ${feeding ? "disabled" : ""}
        >Start</button>
        <button
          type="button"
          class="btn btn-end"
          data-action="end-feed"
          ${feeding ? "" : "disabled"}
        >End</button>
      </div>

      ${renderHistory()}
    </section>

    <section class="panel" aria-labelledby="medicine-heading">
      <h2 id="medicine-heading">Medicine</h2>
      ${renderMedicineCard("ibuprofen")}
      ${renderMedicineCard("tylenol")}
    </section>

    <section class="panel panel-settings" aria-labelledby="settings-heading">
      <h2 id="settings-heading">Feeding interval</h2>
      <p class="settings-hint">How long between feeds. Next feed is based on when you press Start Feed.</p>
      <div class="interval-control">
        <button
          type="button"
          class="btn-interval"
          data-action="interval-down"
          ${interval <= MIN_FEED_INTERVAL_HOURS ? "disabled" : ""}
          aria-label="Decrease interval"
        >−</button>
        <div class="interval-value" aria-live="polite">${intervalLabel}</div>
        <button
          type="button"
          class="btn-interval"
          data-action="interval-up"
          ${interval >= MAX_FEED_INTERVAL_HOURS ? "disabled" : ""}
          aria-label="Increase interval"
        >+</button>
      </div>
    </section>
  `;

  syncTicker();
}

function syncTicker(): void {
  if (state.activeFeed && tickId === null) {
    tickId = window.setInterval(() => {
      const timer = app.querySelector(".timer");
      if (timer && state.activeFeed) {
        timer.textContent = formatDuration(
          elapsedMs(state.activeFeed.startedAt),
        );
      }
    }, 1000);
  } else if (!state.activeFeed && tickId !== null) {
    window.clearInterval(tickId);
    tickId = null;
  }
}

app.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>(
    "[data-action]",
  );
  if (!target) return;

  const action = target.dataset.action;

  if (action === "select-side") {
    const side = target.dataset.side as BreastSide | undefined;
    if (!side) return;
    selectedSide = side;
    if (state.activeFeed) {
      persist(setFeedSide(state, side));
    } else {
      render();
    }
    return;
  }

  if (action === "mark-schedule") {
    persist(markScheduleStart(state));
    return;
  }

  if (action === "start-timer") {
    persist(startFeed(state, selectedSide));
    return;
  }

  if (action === "end-feed") {
    const next = endFeed(state);
    selectedSide =
      next.lastBreast === "left"
        ? "right"
        : next.lastBreast === "right"
          ? "left"
          : selectedSide;
    persist(next);
    return;
  }

  if (action === "take-med") {
    const key = target.dataset.med as MedicineKey | undefined;
    if (!key) return;
    persist(takeMedicine(state, key));
    return;
  }

  if (action === "interval-down") {
    persist(setFeedIntervalHours(state, state.feedIntervalHours - 0.5));
    return;
  }

  if (action === "interval-up") {
    persist(setFeedIntervalHours(state, state.feedIntervalHours + 0.5));
  }
});

render();
