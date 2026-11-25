import {
  MODEL_MEAN,
  MODEL_SD,
  THRESHOLD_MIN,
  THRESHOLD_MAX,
  standardize,
  modelProbability,
  drawNormalTrials,
  observedFraction,
  emptyHistogram,
  mergeHistograms,
  histogramTotals,
  HISTOGRAM_MIN,
  HISTOGRAM_MAX,
  HISTOGRAM_BIN_WIDTH,
  HISTOGRAM_BIN_COUNT,
} from "./normal-probability-math.mjs";

// Entirely local simulation. Results and student selections stay in the browser.
const root = document.getElementById("normal-probability-activity");
if (root) {
  const threshold = root.querySelector('[data-control="threshold"]');
  const side = root.querySelector('[data-control="side"]');
  const thresholdText = root.querySelector('[data-output="threshold-label"]');
  const chart = root.querySelector('[data-chart="normal-curve"]');
  const shadeDescription = root.querySelector('[data-output="shaded-description"]');
  const goal = root.querySelector('[data-output="event"]');
  const z = root.querySelector('[data-output="z"]');
  const probability = root.querySelector('[data-output="probability"]');
  const count = root.querySelector('[data-output="draws"]');
  const matches = root.querySelector('[data-output="matches"]');
  const observed = root.querySelector('[data-output="observed"]');
  const lastScore = root.querySelector('[data-output="latest"]');
  const status = root.querySelector('[data-output="status"]');
  const empiricalChart = root.querySelector('[data-chart="empirical-histogram"]');
  const empiricalDescription = root.querySelector('[data-output="empirical-description"]');
  const prediction = root.querySelector('[data-output="prediction-feedback"]');
  const questions = document.getElementById("normal-probability-check");

  const MAX_DRAWS = 20000;
  const state = {
    draws: 0, matches: 0, latest: null,
    histogram: emptyHistogram(),
  };
  const SVG_NS = "http://www.w3.org/2000/svg";
  const WIDTH = 650, HEIGHT = 260, LEFT = 48, RIGHT = 20, TOP = 20, BOTTOM = 210;
  const X_MIN = 10, X_MAX = 90;
  const x = value => LEFT + (value - X_MIN) / (X_MAX - X_MIN) * (WIDTH - LEFT - RIGHT);
  const density = value => {
    const centered = (value - MODEL_MEAN) / MODEL_SD;
    return Math.exp(-0.5 * centered * centered) / (MODEL_SD * Math.sqrt(2 * Math.PI));
  };
  const y = value => BOTTOM - density(value) / density(MODEL_MEAN) * (BOTTOM - TOP - 18);
  const asPercent = p => p === null ? "Not yet available" : (100 * p).toFixed(1) + "%";
  const asNumber = value => value === null ? "Not yet available" : value.toFixed(2);

  function element(tag, attributes = {}, text = null) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attributes)) {
      node.setAttribute(key, String(value));
    }
    if (text !== null) node.textContent = text;
    return node;
  }

  function pathFor(values) {
    return values.map((value, i) => (i ? "L " : "M ") +
      x(value).toFixed(2) + " " + y(value).toFixed(2)).join(" ");
  }

  function drawCurve() {
    const t = Number(threshold.value), direction = side.value;
    const p = modelProbability(t, direction);
    const label = direction === "below" ? "at or below" : "above";
    const values = Array.from({ length: 321 }, (_, i) => X_MIN + i / 4);
    const filled = values.filter(value => direction === "below" ? value <= t : value >= t);
    if (!filled.includes(t)) filled.push(t);
    filled.sort((a, b) => a - b);

    const svg = element("svg", {
      viewBox: "0 0 " + WIDTH + " " + HEIGHT,
      class: "normal-svg",
      role: "img",
      "aria-labelledby": "normal-chart-title normal-chart-desc",
    });
    svg.appendChild(element("title", { id: "normal-chart-title" },
      "Theoretical normal distribution with a shaded probability region"));
    svg.appendChild(element("desc", { id: "normal-chart-desc" },
      "A normal curve with mean 50 and standard deviation 10. The region " +
      label + " " + t + " is shaded, representing " + asPercent(p) + "."));

    for (const tick of [10, 30, 50, 70, 90]) {
      const px = x(tick);
      svg.appendChild(element("line", {
        x1: px, x2: px, y1: TOP, y2: BOTTOM,
        stroke: "#dce5e3", "stroke-width": 1,
      }));
      svg.appendChild(element("text", {
        x: px, y: BOTTOM + 21, "text-anchor": "middle", class: "normal-axis-label",
      }, String(tick)));
    }
    svg.appendChild(element("path", {
      d: "M " + x(filled[0]).toFixed(2) + " " + BOTTOM +
        " " + pathFor(filled).replace(/^M /, "L ") +
        " L " + x(filled[filled.length - 1]).toFixed(2) + " " + BOTTOM + " Z",
      fill: "#c4d7df",
    }));
    svg.appendChild(element("path", {
      d: pathFor(values), fill: "none", stroke: "#30545b",
      "stroke-width": 3, "stroke-linejoin": "round",
    }));
    svg.appendChild(element("line", {
      x1: x(t), x2: x(t), y1: 17, y2: BOTTOM,
      stroke: "#9b602e", "stroke-width": 2, "stroke-dasharray": "5 5",
    }));
    svg.appendChild(element("line", {
      x1: LEFT, x2: WIDTH - RIGHT, y1: BOTTOM, y2: BOTTOM,
      stroke: "#53656c", "stroke-width": 1.3,
    }));
    svg.appendChild(element("text", {
      x: (WIDTH + LEFT - RIGHT) / 2, y: HEIGHT - 5,
      "text-anchor": "middle", class: "normal-axis-title",
    }, "Hypothetical test score"));
    svg.appendChild(element("text", {
      x: x(t) + (t >= 64 ? -7 : 7), y: 28,
      "text-anchor": t >= 64 ? "end" : "start",
      class: "normal-threshold-label",
    }, "Threshold " + t));

    chart.replaceChildren(svg);
    thresholdText.textContent = String(t);
    z.textContent = asNumber(standardize(t));
    probability.textContent = asPercent(p);

    goal.textContent = "Score " + label + " " + t;
    shadeDescription.textContent = "Shaded region: scores " + label + " " +
      t + ". The model predicts approximately " + asPercent(p) +
      " of independent observations in that region.";
  }

  function drawEmpiricalHistogram() {
    const counts = state.histogram.counts;
    const selectedCounts = state.histogram.selectedCounts;
    const totals = histogramTotals(state.histogram);
    const barWidth = (WIDTH - LEFT - RIGHT) / HISTOGRAM_BIN_COUNT;
    const highestCount = Math.max(0, ...counts);
    const yMax = Math.max(1, Math.ceil(highestCount * 1.12));
    const chartHeight = BOTTOM - TOP - 15;
    const yCount = value => BOTTOM - (value / yMax) * chartHeight;
    const svg = element("svg", {
      viewBox: "0 0 " + WIDTH + " " + HEIGHT,
      class: "normal-svg",
      role: "img",
      "aria-labelledby": "normal-empirical-title normal-empirical-desc",
    });
    svg.appendChild(element("title", { id: "normal-empirical-title" },
      "Histogram of simulated test scores"));
    svg.appendChild(element("desc", { id: "normal-empirical-desc" },
      state.draws === 0
        ? "No observations drawn yet."
        : "Histogram of " + totals.displayed + " displayed observations. " +
          totals.selectedDisplayed + " are in the selected probability region. " +
          totals.outside + " observations fall outside the displayed score range."));

    // Theoretical curve and simulated histogram use the same score scale,
    // but independent vertical axes: density above, frequency here.
    for (const tick of [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]) {
      if (tick < HISTOGRAM_MIN) continue;
      const px = x(tick);
      svg.appendChild(element("line", {
        x1: px, x2: px, y1: TOP, y2: BOTTOM,
        stroke: "#e2e9e6", "stroke-width": 1,
      }));
      if (tick % 20 === 10) {
        svg.appendChild(element("text", {
          x: px, y: BOTTOM + 21, "text-anchor": "middle",
          class: "normal-axis-label",
        }, String(tick)));
      }
    }
    svg.appendChild(element("text", {
      x: LEFT, y: 14, class: "normal-axis-title",
    }, "Number of scores"));
    svg.appendChild(element("text", {
      x: LEFT - 9, y: BOTTOM + 4, "text-anchor": "end",
      class: "normal-axis-label",
    }, "0"));
    svg.appendChild(element("text", {
      x: LEFT - 9, y: yCount(yMax) + 5, "text-anchor": "end",
      class: "normal-axis-label",
    }, String(yMax)));
    svg.appendChild(element("line", {
      x1: LEFT, x2: WIDTH - RIGHT, y1: BOTTOM, y2: BOTTOM,
      stroke: "#53656c", "stroke-width": 1.3,
    }));

    counts.forEach((total, index) => {
      if (!total) return;
      const selected = selectedCounts[index];
      const other = total - selected;
      const barX = LEFT + index * barWidth + 1.15;
      const usableBarWidth = Math.max(1, barWidth - 2.3);
      const selectedHeight = (selected / yMax) * chartHeight;
      const otherHeight = (other / yMax) * chartHeight;
      // Split bins can occur at the threshold. Only truly matching
      // observations are highlighted, not whole bins by midpoint.
      if (selected) svg.appendChild(element("rect", {
        x: barX, y: BOTTOM - selectedHeight,
        width: usableBarWidth, height: selectedHeight,
        fill: "#a66b24",
      }));
      if (other) svg.appendChild(element("rect", {
        x: barX, y: BOTTOM - selectedHeight - otherHeight,
        width: usableBarWidth, height: otherHeight,
        fill: "#8eabad",
      }));
    });

    svg.appendChild(element("text", {
      x: (WIDTH + LEFT - RIGHT) / 2, y: HEIGHT - 5,
      "text-anchor": "middle", class: "normal-axis-title",
    }, "Hypothetical test score (5-point bins)"));
    empiricalChart.replaceChildren(svg);

    if (state.draws === 0) {
      empiricalDescription.textContent =
        "No scores drawn yet. Draw 1, 100, or 1,000 observations to build a distribution.";
    } else {
      empiricalDescription.textContent =
        totals.displayed + " of " + state.draws +
        " simulated scores are displayed. " +
        totals.selectedDisplayed + " displayed scores fall in the selected region. " +
        (totals.outside
          ? totals.outside + " additional score" +
            (totals.outside === 1 ? " falls" : "s fall") +
            " outside the chart but remains in the probability totals. "
          : "") +
        "The vertical scale adjusts as counts grow.";
    }
  }

  function updateTable() {
    count.textContent = String(state.draws);
    matches.textContent = String(state.matches);
    observed.textContent = asPercent(observedFraction(state.matches, state.draws));

    lastScore.textContent = state.latest === null
      ? "No draws yet" : state.latest.toFixed(1);
    drawEmpiricalHistogram();
  }

  function reset(message = "Settings changed. Previous draws were cleared.") {
    state.draws = 0;
    state.matches = 0;
    state.latest = null;
    state.histogram = emptyHistogram();
    drawCurve();
    updateTable();
    status.textContent = message;
  }

  function drawTrials(requested) {
    const remaining = MAX_DRAWS - state.draws;
    const drawCount = Math.min(requested, remaining);
    if (!drawCount) {
      status.textContent = "20,000 draws reached. Reset to start another experiment.";
      return;
    }
    const batch = drawNormalTrials(Number(threshold.value), side.value, drawCount);
    state.draws += batch.count;
    state.matches += batch.matches;
    state.latest = batch.lastValue;
    state.histogram = mergeHistograms(state.histogram, batch.histogram);
    updateTable();
    status.textContent = "Added " + drawCount + " independent observations. " +
      "Compare the observed percentage with the theoretical percentage above.";
  }

  threshold.addEventListener("input", () => reset());
  side.addEventListener("change", () => reset());
  root.querySelectorAll("[data-draw]").forEach((button) => {
    button.addEventListener("click", () => drawTrials(Number(button.dataset.draw)));
  });
  root.querySelector('[data-action="reset"]').addEventListener("click",
    () => reset("Simulation reset. No observations have been drawn."));

  function feedback(target, result, reason = "") {
    const heading = result === "correct" ? "Correct."
      : result === "incorrect" ? "Incorrect." : "Choose an answer first.";
    target.dataset.result = result;
    target.textContent = heading + (reason ? " " + reason : "");
  }
  function clear(target) {
    target.removeAttribute("data-result");
    target.textContent = "";
  }

  root.querySelectorAll('input[name="normal-prediction"]').forEach(input =>
    input.addEventListener("change", () => clear(prediction)));
  root.querySelector('[data-action="prediction"]').addEventListener("click", () => {
    const selected = root.querySelector('input[name="normal-prediction"]:checked');
    if (!selected) return feedback(prediction, "pending");
    return feedback(prediction, selected.value === "below50" ? "correct" : "incorrect",
      selected.value === "below50"
        ? "Half the scores are below the mean of 50, but only about 7% are above 65."
        : "For a symmetric normal distribution, 50% are below 50. Only a small upper tail lies above 65.");
  });

  const answers = Object.freeze({
    "area": {
      key: "above",
      correct: "The shaded area represents P(score > 60) when Above is selected and the threshold is 60.",
      incorrect: "The chosen side of the threshold determines which scores count. The area represents a probability, not a count.",
    },
    "z": {
      key: "one",
      correct: "A score of 60 is 10 points above the mean, or one population SD of 10 above it.",
      incorrect: "Use z = (score minus mean) divided by SD, so (60 minus 50) divided by 10.",
    },
    "threshold": {
      key: "smaller",
      correct: "As the right-tail cutoff rises, fewer observations are expected to exceed it.",
      incorrect: "Moving a cutoff farther right leaves less area under the normal curve to its right.",
    },
    "frequency": {
      key: "close",
      correct: "With many independent draws, the observed percentage generally gets closer to the theoretical probability, though it can fluctuate along the way.",
      incorrect: "A theoretical probability is a long-run proportion. Repeated random draws are variable and do not match it exactly each time.",
    },
  });
  if (questions) {
    questions.querySelectorAll("[data-question]").forEach(question => {
      const answer = answers[question.dataset.question];
      const response = question.querySelector('[data-output="feedback"]');
      question.querySelectorAll('input[type="radio"]').forEach(input =>
        input.addEventListener("change", () => clear(response)));
      question.querySelector('[data-action="check-answer"]').addEventListener("click", () => {
        const selected = question.querySelector('input[type="radio"]:checked');
        if (!selected) return feedback(response, "pending");
        return feedback(response, selected.value === answer.key ? "correct" : "incorrect",
          selected.value === answer.key ? answer.correct : answer.incorrect);
      });
    });
  }
  reset("Ready. Choose a threshold and a region, then draw observations.");
}
