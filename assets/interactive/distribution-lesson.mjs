import {
  BASELINE_TIMES,
  withAdjustedTime,
  describeDistribution,
} from "./distribution-math.mjs";

const root = document.getElementById("distribution-activity");

if (root) {
  const slider = root.querySelector('[data-control="last-time"]');
  const sliderValue = root.querySelector('[data-output="selected-time"]');
  const chart = root.querySelector('[data-chart="dotplot"]');
  const description = root.querySelector('[data-output="distribution-description"]');
  const observationList = root.querySelector('[data-output="observations"]');
  const currentFields = Object.fromEntries(
    ["mean", "median", "sd", "range", "z"].map((name) => [
      name, root.querySelector('[data-current="' + name + '"]'),
    ])
  );
  const baseline = describeDistribution(BASELINE_TIMES);

  const fmt = (number) => number === null ? "Undefined" : number.toFixed(2);
  const WIDTH = 660;
  const HEIGHT = 245;
  const LEFT = 45;
  const RIGHT = 23;
  const AXIS_Y = 184;
  const DOMAIN_MAX = 42;
  const NS = "http://www.w3.org/2000/svg";

  function svgEl(tag, attributes = {}, text = null) {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, String(value));
    }
    if (text !== null) element.textContent = text;
    return element;
  }
  const x = (value) => LEFT + (value / DOMAIN_MAX) * (WIDTH - LEFT - RIGHT);

  function plotDistribution(stats) {
    const svg = svgEl("svg", {
      viewBox: "0 0 " + WIDTH + " " + HEIGHT,
      role: "img",
      "aria-labelledby": "dist-plot-title dist-plot-desc",
      class: "dist-svg",
    });
    svg.appendChild(svgEl("title", { id: "dist-plot-title" },
      "Dot plot of simulated task completion times"));
    svg.appendChild(svgEl("desc", { id: "dist-plot-desc" },
      "Ten observations, with a highlighted adjustable observation. " +
      "Mean " + fmt(stats.mean) + ", median " + fmt(stats.median) +
      ", sample standard deviation " + fmt(stats.sd) + "."));

    for (const tick of [0, 10, 20, 30, 40]) {
      const px = x(tick);
      svg.appendChild(svgEl("line", {
        x1: px, x2: px, y1: 26, y2: AXIS_Y, stroke: "#e2e6e2",
        "stroke-width": 1,
      }));
      svg.appendChild(svgEl("text", {
        x: px, y: AXIS_Y + 22, "text-anchor": "middle",
        class: "dist-axis-label",
      }, String(tick)));
    }
    svg.appendChild(svgEl("line", {
      x1: LEFT, x2: WIDTH - RIGHT, y1: AXIS_Y, y2: AXIS_Y,
      stroke: "#53656c", "stroke-width": 1.5,
    }));
    svg.appendChild(svgEl("text", {
      x: WIDTH / 2, y: HEIGHT - 7, "text-anchor": "middle",
      class: "dist-axis-title",
    }, "Minutes to complete the task"));

    for (const [key, color, dash] of [
      ["mean", "#304d63", "5 4"],
      ["median", "#a66b24", "2 4"],
    ]) {
      const px = x(stats[key]);
      svg.appendChild(svgEl("line", {
        x1: px, x2: px, y1: 21, y2: AXIS_Y,
        stroke: color, "stroke-width": 2,
        "stroke-dasharray": dash,
      }));
    }

    const rowsAtValue = new Map();
    stats.values.forEach((value, index) => {
      const used = rowsAtValue.get(value) || 0;
      rowsAtValue.set(value, used + 1);
      svg.appendChild(svgEl("circle", {
        cx: x(value), cy: AXIS_Y - 15 - (used * 17),
        r: 6.4,
        fill: index === stats.n - 1 ? "#a66b24" : "#456f76",
        stroke: "#fff", "stroke-width": 1.2,
      }));
    });
    chart.replaceChildren(svg);
  }

  function update() {
    const value = Number(slider.value);
    const stats = describeDistribution(withAdjustedTime(value));
    sliderValue.textContent = value + " minutes";
    plotDistribution(stats);
    currentFields.mean.textContent = fmt(stats.mean);
    currentFields.median.textContent = fmt(stats.median);
    currentFields.sd.textContent = fmt(stats.sd);
    currentFields.range.textContent = fmt(stats.range);
    currentFields.z.textContent = fmt(stats.z);
    observationList.textContent = "Sorted times (minutes): " + stats.sorted.join(", ") + ".";
    const difference = stats.mean - baseline.mean;
    description.textContent =
      "Current mean " + fmt(stats.mean) + " minutes; median " +
      fmt(stats.median) + " minutes. The mean is " +
      (difference === 0 ? "unchanged" : fmt(difference) + " minutes higher than before") +
      ", and the sample SD is " + fmt(stats.sd) + " minutes.";
  }

  slider.addEventListener("input", update);
  root.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      slider.value = button.dataset.preset;
      update();
      slider.focus();
    });
  });

  const feedbackLabels = Object.freeze({
    correct: "Correct.",
    incorrect: "Incorrect.",
    pending: "Choose an answer first.",
  });

  const answers = Object.freeze({
    "center": {
      correct: "median",
      yes: "The median is the middle value in sorted data, or the average of the two middle values.",
      no: "Sort the values first. The statistic based on the middle position is the median.",
    },
    "outlier": {
      correct: "mean",
      yes: "An unusually large observation raises the mean more than the median in this example.",
      no: "Try changing the final time to 35 and compare the two columns in the table.",
    },
    "variation": {
      correct: "spread",
      yes: "Sample SD describes the typical spread around the sample mean in the original units.",
      no: "Standard deviation describes how dispersed observations are, not how many there are or how accurately you sampled.",
    },
    "z-score": {
      correct: "above",
      yes: "A z-score of +2 means the value is two standard deviations above the sample mean.",
      no: "A z-score is measured in standard deviations, not minutes. A positive sign indicates a value above the mean.",
    },
  });

  root.querySelectorAll("[data-question]").forEach((question) => {
    const feedback = question.querySelector('[data-output="feedback"]');
    const answer = answers[question.dataset.question];

    question.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.addEventListener("change", () => {
        feedback.removeAttribute("data-result");
        feedback.textContent = "";
      });
    });

    question.querySelector('[data-action="check-answer"]').addEventListener("click", () => {
      const selected = question.querySelector('input[type="radio"]:checked');
      const result = selected === null
        ? "pending"
        : selected.value === answer.correct ? "correct" : "incorrect";
      feedback.dataset.result = result;
      feedback.textContent = feedbackLabels[result] +
        (result === "pending" ? "" : " " +
          (result === "correct" ? answer.yes : answer.no));
    });
  });

  update();
}
