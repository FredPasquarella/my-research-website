import {
  POPULATION_MEAN,
  POPULATION_SD,
  populationDensity,
  expectedStandardError,
  takeSample,
  describe,
} from "./sampling-math.mjs";

/**
 * Standalone browser module for the Week 6 activity.
 * Keeps all student responses and simulation results in memory only.
 * Accessible summaries accompany every visualization.
 */

const root = document.getElementById("clt-lab");
if (root) {
  const selectPopulation = root.querySelector('[data-field="population"]');
  const selectN = root.querySelector('[data-field="sample-size"]');
  const chartPopulation = root.querySelector('[data-chart="population"]');
  const chartMeans = root.querySelector('[data-chart="means"]');
  const status = root.querySelector('[data-output="status"]');
  const populationDescription = root.querySelector('[data-output="population-description"]');
  const meanDescription = root.querySelector('[data-output="means-description"]');
  const countText = root.querySelector('[data-output="count"]');
  const latestMeanText = root.querySelector('[data-output="latest-mean"]');
  const meanOfMeansText = root.querySelector('[data-output="mean-of-means"]');
  const observedSdText = root.querySelector('[data-output="observed-sd"]');
  const expectedSeText = root.querySelector('[data-output="expected-se"]');
  const sampleValuesText = root.querySelector('[data-output="sample-values"]');
  const predictionFeedback = root.querySelector('[data-output="prediction-feedback"]');
  const checkFeedback = root.querySelector('[data-output="check-feedback"]');

  const MAX_REPETITIONS = 20000;
  const MIN_X = 10;
  const MAX_X = 110;
  const BIN_COUNT = 50;
  const W = 640;
  const H = 270;
  const LEFT = 52;
  const RIGHT = 20;
  const TOP = 24;
  const BOTTOM = 225;
  const NS = "http://www.w3.org/2000/svg";
  const state = { means: [], latest: null };

  function svgNode(name, attrs = {}, text = null) {
    const el = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, String(value));
    }
    if (text !== null) el.textContent = text;
    return el;
  }

  function xCoord(value) {
    return LEFT + ((value - MIN_X) / (MAX_X - MIN_X)) * (W - LEFT - RIGHT);
  }

  function chartFrame(titleText, descText) {
    const svg = svgNode("svg", {
      viewBox: "0 0 " + W + " " + H,
      role: "img",
      "aria-label": titleText + ". " + descText,
      class: "clt-svg",
      preserveAspectRatio: "xMidYMid meet",
    });
    const gridColor = "#d4dfdc";
    for (const tick of [20, 40, 60, 80, 100]) {
      const x = xCoord(tick);
      svg.appendChild(svgNode("line", {
        x1: x, y1: TOP, x2: x, y2: BOTTOM,
        stroke: gridColor, "stroke-width": 1,
      }));
      svg.appendChild(svgNode("text", {
        x, y: BOTTOM + 20, "text-anchor": "middle", class: "clt-axis-label",
      }, String(tick)));
    }
    svg.appendChild(svgNode("line", {
      x1: LEFT, y1: BOTTOM, x2: W - RIGHT, y2: BOTTOM,
      stroke: "#526a70", "stroke-width": 1.4,
    }));
    svg.appendChild(svgNode("text", {
      x: (W + LEFT - RIGHT) / 2, y: H - 6,
      "text-anchor": "middle", class: "clt-axis-title",
    }, "Simulated values"));
    return svg;
  }

  function drawReferenceMean(svg) {
    const x = xCoord(POPULATION_MEAN);
    svg.appendChild(svgNode("line", {
      x1: x, y1: TOP, x2: x, y2: BOTTOM,
      stroke: "#a46826", "stroke-width": 2,
      "stroke-dasharray": "5 5",
    }));
    svg.appendChild(svgNode("text", {
      x: x + 5, y: TOP + 10, class: "clt-mean-label",
    }, "Population mean: 50"));
  }

  function renderPopulation() {
    const type = selectPopulation.value;
    const label = type === "normal" ? "Approximately normal" : "Right-skewed";
    const samples = [];
    let maxDensity = 0;
    for (let i = 0; i <= 250; i += 1) {
      const x = MIN_X + (i / 250) * (MAX_X - MIN_X);
      const density = populationDensity(x, type);
      samples.push({ x, density });
      maxDensity = Math.max(maxDensity, density);
    }
    const height = BOTTOM - TOP - 15;
    const scale = (density) => BOTTOM - (density / maxDensity) * height;
    const curve = samples.map((point, index) =>
      (index === 0 ? "M " : "L ") +
      xCoord(point.x).toFixed(2) + " " + scale(point.density).toFixed(2)
    ).join(" ");
    const svg = chartFrame(
      "Population distribution",
      label + " population. Mean 50, standard deviation 10."
    );
    svg.appendChild(svgNode("path", {
      d: curve + " L " + xCoord(MAX_X) + " " + BOTTOM +
        " L " + xCoord(MIN_X) + " " + BOTTOM + " Z",
      fill: "#dce9e8",
    }));
    svg.appendChild(svgNode("path", {
      d: curve,
      fill: "none",
      stroke: "#30545b",
      "stroke-width": 3,
      "stroke-linejoin": "round",
    }));
    drawReferenceMean(svg);
    chartPopulation.replaceChildren(svg);
    populationDescription.textContent = label +
      " theoretical population. The mean is 50 and the standard deviation is 10. " +
      "The curve represents individual observations, not sample means.";
  }

  function renderMeans() {
    const allMeans = state.means;
    const bins = new Array(BIN_COUNT).fill(0);
    let outside = 0;
    for (const value of allMeans) {
      if (value < MIN_X || value >= MAX_X) {
        outside += 1;
      } else {
        const index = Math.floor(((value - MIN_X) / (MAX_X - MIN_X)) * BIN_COUNT);
        bins[Math.min(BIN_COUNT - 1, index)] += 1;
      }
    }
    const maxCount = Math.max(1, ...bins);
    const barWidth = (W - LEFT - RIGHT) / BIN_COUNT;
    const chartDescription = allMeans.length === 0
      ? "No samples have been drawn yet."
      : "Histogram of " + allMeans.length + " independently drawn sample means.";
    const svg = chartFrame("Sampling distribution of sample means", chartDescription);

    bins.forEach((count, index) => {
      if (!count) return;
      const height = ((BOTTOM - TOP - 20) * count) / maxCount;
      svg.appendChild(svgNode("rect", {
        x: LEFT + index * barWidth + 0.55,
        y: BOTTOM - height,
        width: Math.max(1, barWidth - 1.1),
        height,
        fill: "#456f76",
      }));
    });
    drawReferenceMean(svg);
    chartMeans.replaceChildren(svg);

    if (!allMeans.length) {
      meanDescription.textContent =
        "No sample means yet. Use the buttons above to draw 100 or 1,000 samples. " +
        "Both graphs use the same horizontal scale.";
    } else {
      const description = allMeans.length === 1
        ? "One sample mean is shown; many independent means are needed to see a distribution."
        : "Each bar counts sample means, not individual observations.";
      meanDescription.textContent = description + " " +
        (outside ? outside + " values fall beyond the chart boundaries. " : "") +
        "Both graphs use the same horizontal scale. Vertical heights are scaled separately.";
    }
  }

  function fmt(value) {
    return value === null ? "Not yet available" : value.toFixed(2);
  }

  function renderSummary() {
    const summary = describe(state.means);
    countText.textContent = String(summary.n);
    latestMeanText.textContent = state.latest ? fmt(state.latest.mean) : "No sample yet";
    meanOfMeansText.textContent = fmt(summary.mean);
    observedSdText.textContent = fmt(summary.sd);
    expectedSeText.textContent = fmt(expectedStandardError(Number(selectN.value)));

    if (!state.latest) {
      sampleValuesText.textContent = "Draw a sample to see some of its observations.";
    } else {
      const values = state.latest.values;
      const first = values.slice(0, 8).map((v) => v.toFixed(1)).join(", ");
      sampleValuesText.textContent = "Most recent sample (" + values.length +
        " observations). First " + Math.min(8, values.length) +
        " values: " + first + (values.length > 8 ? ", and " +
        (values.length - 8) + " more." : ".");
    }
  }

  function render() {
    renderPopulation();
    renderMeans();
    renderSummary();
  }

  function reset(message) {
    state.means = [];
    state.latest = null;
    render();
    status.textContent = message || "Simulation reset. No sample means have been collected.";
  }

  function drawSamples(requested) {
    const remaining = MAX_REPETITIONS - state.means.length;
    const count = Math.min(requested, remaining);
    if (count === 0) {
      status.textContent = "The 20,000 sample limit has been reached. Reset the simulation to run again.";
      return;
    }
    const n = Number(selectN.value);
    const type = selectPopulation.value;
    for (let i = 0; i < count; i += 1) {
      const sample = takeSample(n, type);
      state.means.push(sample.mean);
      state.latest = sample;
    }
    render();
    status.textContent = "Added " + count + " independent sample" +
      (count === 1 ? "" : "s") + " of size " + n + ". Total sample means: " +
      state.means.length + ". Changing either setting starts a new experiment.";
  }

  root.querySelectorAll("[data-draw]").forEach((button) => {
    button.addEventListener("click", () => drawSamples(Number(button.dataset.draw)));
  });
  root.querySelector('[data-action="reset"]').addEventListener("click", () => reset());

  selectPopulation.addEventListener("change", () => reset(
    "Population shape changed. Previous sample means were cleared so only comparable results are shown."
  ));
  selectN.addEventListener("change", () => reset(
    "Sample size changed. Previous sample means were cleared so only comparable results are shown."
  ));

  root.querySelector('[data-action="prediction"]').addEventListener("click", () => {
    const choice = root.querySelector('input[name="clt-prediction"]:checked');
    if (!choice) {
      predictionFeedback.textContent = "Choose an answer first.";
      return;
    }
    predictionFeedback.textContent = choice.value === "smaller"
      ? "Correct. The theoretical standard error is the population SD divided by the square root of n. Larger n gives less variable sample means."
      : "Try again. Compare 10 divided by the square root of 5 with 10 divided by the square root of 30.";
  });

  root.querySelector('[data-action="knowledge-check"]').addEventListener("click", () => {
    const choice = root.querySelector('input[name="clt-check"]:checked');
    if (!choice) {
      checkFeedback.textContent = "Choose an answer first.";
      return;
    }
    checkFeedback.textContent = choice.value === "means"
      ? "Correct. The histogram on the right is built from the mean of each independent sample. It is not the distribution of individual observations."
      : "Not quite. Each repeated sample contributes exactly one mean to the histogram on the right. The left panel describes individual observations in the population.";
  });

  render();
  status.textContent = "Ready. Choose a population and sample size, then draw samples.";
}
