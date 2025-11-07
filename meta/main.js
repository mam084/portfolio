import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

/* =======================================================
   Step 1.1: Load and parse the CSV (with row conversion)
   ======================================================= */
export async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

/* =======================================================
   Step 1.2: Compute commit-level data from denormalized rows
   ======================================================= */
export function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0] ?? {};
      const { author, date, time, timezone, datetime } = first;

      const ret = {
        id: commit,
        // Point to repo root (your SHAs are from a template dataset)
        url: 'https://github.com/mam084/portfolio/',
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime ? (datetime.getHours() + datetime.getMinutes() / 60) : NaN,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,
        writable: false,
        configurable: false,
      });

      return ret;
    });
}

/* =======================================================
   Step 1.3: Stats rendering
   ======================================================= */
function addStat(dl, termHTML, valueText) {
  dl.append('dt').html(termHTML);
  dl.append('dd').text(valueText);
}

function classifyDayPeriod(d) {
  const hr = new Date(d.datetime).getHours();
  if (hr >= 5 && hr < 12) return 'morning';
  if (hr >= 12 && hr < 17) return 'afternoon';
  if (hr >= 17 && hr < 21) return 'evening';
  return 'night';
}

export function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  addStat(dl, 'Total <abbr title="Lines of code">LOC</abbr>', d3.format(',')(data.length));
  addStat(dl, 'Total commits', d3.format(',')(commits.length));

  const fileCount = d3.groups(data, (d) => d.file).length;
  addStat(dl, 'Files', d3.format(',')(fileCount));

  const fileMaxLines = d3.rollups(
    data,
    (v) => d3.max(v, (row) => row.line),
    (d) => d.file
  );
  const longestFile = d3.greatest(fileMaxLines, (d) => d[1]);
  const maxFileLen = longestFile?.[1] ?? 0;
  const longestFileName = longestFile?.[0] ?? '(unknown)';
  addStat(dl, 'Max file length (lines)', String(maxFileLen));
  addStat(dl, 'Longest file', longestFileName);

  const avgFileLen = d3.mean(fileMaxLines, (d) => d[1]) ?? 0;
  addStat(dl, 'Avg file length (lines)', d3.format('.2f')(avgFileLen));

  const maxDepth = d3.max(data, (d) => d.depth) ?? 0;
  const avgDepth = d3.mean(data, (d) => d.depth) ?? 0;
  addStat(dl, 'Max depth', String(maxDepth));
  addStat(dl, 'Avg depth', d3.format('.2f')(avgDepth));

  const workByPeriod = d3.rollups(data, (v) => v.length, (d) => classifyDayPeriod(d));
  const busiestPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0] ?? '(n/a)';
  addStat(dl, 'Busiest period', busiestPeriod);

  const workByDOW = d3.rollups(
    data, (v) => v.length, (d) => new Date(d.datetime).getDay()
  );
  const busiestDOWIdx = d3.greatest(workByDOW, (d) => d[1])?.[0];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const busiestDOW = (busiestDOWIdx == null) ? '(n/a)' : dayNames[busiestDOWIdx];
  addStat(dl, 'Busiest weekday', busiestDOW);
}

/* =======================================================
   Tooltip helpers
   ======================================================= */
function renderTooltipContent(commit) {
  if (!commit) return;
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  link.href = commit.url ?? '#';
  link.textContent = commit.id ?? '(unknown)';
  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' }) ?? '';
  time.textContent = commit.datetime?.toLocaleString('en', { timeStyle: 'short' }) ?? '';
  author.textContent = commit.author ?? '';
  lines.textContent = String(commit.totalLines ?? 0);
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  if (!tooltip) return;
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  if (!tooltip) return;
  const OFFSET = 12;
  tooltip.style.left = `${event.clientX + OFFSET}px`;
  tooltip.style.top = `${event.clientY + OFFSET}px`;
}

/* =======================================================
   Step 2–4: Scatterplot + Axes + Gridlines + Sizing + Tooltip
   ======================================================= */
export function renderScatterPlot(data, commits) {
  // Dimensions
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  // SVG
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Scales
  const xScale = d3.scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

  const yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([height, 0]);

  // Usable area
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  // Gridlines BEFORE axes
  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  // Dots container
  const dots = svg.append('g').attr('class', 'dots');

  // Brush (Step 5)
  function brushed(event) {
    const selection = event.selection;
    svg.selectAll('circle')
      .classed('selected', (d) => isCommitSelected(selection, d, xScale, yScale));

    renderSelectionCount(selection, commits, xScale, yScale);
    renderLanguageBreakdown(selection, commits, xScale, yScale);
  }
  svg.call(d3.brush().on('start brush end', brushed));

  // Keep tooltips working: put dots above overlay
  svg.selectAll('.dots, .overlay ~ *').raise();

  // Radius scale (sqrt = area-correct)
  let [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  if (minLines == null || maxLines == null) { minLines = 0; maxLines = 1; }
  if (minLines === maxLines) { minLines = 0; }
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([3, 24]);

  // Size legend (min / mid / max)
  const legend = svg.append('g').attr('class', 'size-legend');
  const legendValues = [minLines, (minLines + maxLines) / 2, maxLines].filter(v => isFinite(v));
  const legendX = usableArea.right - 140;
  const legendY = usableArea.top + 10;
  legend.selectAll('g')
    .data(legendValues)
    .join('g')
      .attr('transform', (d,i) => `translate(${legendX}, ${legendY + i*40})`)
      .each(function(d){
        const g = d3.select(this);
        g.append('circle')
          .attr('r', rScale(d))
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('fill', 'steelblue')
          .style('fill-opacity', 0.3)
          .attr('stroke', 'currentColor')
          .attr('stroke-width', 1);
        g.append('text')
          .attr('x', 18)
          .attr('y', 4)
          .text(d3.format(',')(Math.round(d)))
          .attr('font-size', 12);
      });

  // Render dots (largest first so small dots remain hoverable on top)
  const sortedCommits = d3.sort(commits, (d) => -(d.totalLines ?? 0));

  dots.selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', 0.5)
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // Keep dots above brush overlay
  dots.raise();
}

/* ===== Brushing helpers (Step 5) ===== */
function isCommitSelected(selection, commit, xScale, yScale) {
  if (!selection || !commit) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const cx = xScale(commit.datetime);
  const cy = yScale(commit.hourFrac);
  return cx >= Math.min(x0, x1) && cx <= Math.max(x0, x1) &&
         cy >= Math.min(y0, y1) && cy <= Math.max(y0, y1);
}

function renderSelectionCount(selection, commits, xScale, yScale) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];
  const countElement = document.querySelector('#selection-count');
  if (countElement) {
    countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;
  }
  return selectedCommits;
}

function renderLanguageBreakdown(selection, commits, xScale, yScale) {
  const container = document.getElementById('language-breakdown');
  if (!container) return;

  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const lines = selectedCommits.flatMap((d) => d.lines || []);

  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / (lines.length || 1);
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `<dt>${language ?? '(unknown)'}</dt><dd>${count} lines (${formatted})</dd>`;
  }
}

/* =======================================================
   Boot
   ======================================================= */
(async function init() {
  const data = await loadData();
  const commits = processCommits(data);
  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);
})();
