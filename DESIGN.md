---
name: Technical Precision Framework
colors:
  surface: '#f9f9ff'
  surface-dim: '#cedbf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee9ff'
  surface-container-highest: '#d7e3fb'
  on-surface: '#101c2d'
  on-surface-variant: '#43474d'
  inverse-surface: '#253143'
  inverse-on-surface: '#ebf1ff'
  outline: '#74777e'
  outline-variant: '#c3c6ce'
  surface-tint: '#48607c'
  primary: '#001529'
  on-primary: '#ffffff'
  primary-container: '#0f2a43'
  on-primary-container: '#7992b0'
  inverse-primary: '#b0c9e9'
  secondary: '#00687b'
  on-secondary: '#ffffff'
  secondary-container: '#50dcff'
  on-secondary-container: '#005f71'
  tertiary: '#00190d'
  on-tertiary: '#ffffff'
  tertiary-container: '#00301d'
  on-tertiary-container: '#1fa470'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d0e4ff'
  primary-fixed-dim: '#b0c9e9'
  on-primary-fixed: '#001d35'
  on-primary-fixed-variant: '#304963'
  secondary-fixed: '#afecff'
  secondary-fixed-dim: '#48d7f9'
  on-secondary-fixed: '#001f27'
  on-secondary-fixed-variant: '#004e5d'
  tertiary-fixed: '#82f9be'
  tertiary-fixed-dim: '#65dca4'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005235'
  background: '#f9f9ff'
  on-background: '#101c2d'
  surface-variant: '#d7e3fb'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-technical:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-point:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 64px
  gutter: 24px
  section-gap: 48px
  data-group: 16px
---

## Brand & Style

This design system is engineered for high-stakes corporate environments where data integrity and risk assessment are paramount. The brand personality is **authoritative, analytical, and meticulously structured**. It balances the gravity of industrial risk analysis with the clarity of modern data visualization.

The visual style is **Corporate Modern with a Minimalist focus on Information Density**. It prioritizes legibility and logical flow, using vast whitespace as a functional tool to separate complex data sets. The aesthetic avoids decorative flourishes, favoring "technical honesty"—where every line, color, and spacing choice serves a specific communicative purpose regarding uncertainty and reliability.

**Target Audience:** C-suite executives, lead engineers, and risk analysts.
**Emotional Response:** Confidence, clarity under pressure, and perceived accuracy.

## Colors

The palette is anchored in **Deep Navy (#0F2A43)** to project stability and institutional trust. This is contrasted against a pure white background to maximize the "data-to-ink" ratio.

- **Primary (Navy):** Used for primary headings, structural borders, and the "most likely" (P50) data scenarios.
- **Secondary (Cyan #00B8D9):** Used for technical precision callouts, active interactive states, and trend lines indicating growth or availability.
- **Tertiary (Emerald #36B37E):** Reserved for "safe" zones, reliability metrics, and positive risk outcomes.
- **Support Colors:** A spectrum of **Technical Grays** handles secondary information, grid lines, and axis labels, ensuring they provide context without competing with the data.
- **Risk Indicator:** While not in the primary palette, a muted **Oxide Red (#BF2600)** is used sparingly to denote "At Risk" units or critical failure points.

## Typography

The typographic system utilizes a tiered approach to distinguish between narrative and technical data.

1.  **Headlines (Hanken Grotesk):** A sharp, contemporary sans-serif that provides a "designed" feel without losing professional rigor. 
2.  **Body Text (Inter):** Chosen for its exceptional legibility in dense paragraphs and technical descriptions.
3.  **Technical Labels (JetBrains Mono):** A monospaced font used for data labels, axis values, and mathematical notations. This signals a transition from "reading" to "analyzing," emphasizing the technical nature of the content.

**Hierarchical Rules:**
- Use **Display LG** only for presentation title slides.
- **Headline LG** should be used for slide titles, paired with a Primary Navy left-border accent (4px) to anchor the slide.
- **Data-Point** style is specifically for values inside charts and tables to ensure they remain distinct from surrounding labels.

## Layout & Spacing

The layout follows a **Rigid 12-Column Grid** system designed for complex dashboards and presentation slides. 

- **Alignment:** All content must align to the baseline grid to maintain a "calibrated" appearance.
- **Margins:** Generous 64px outer margins prevent the technical content from feeling claustrophobic.
- **Information Grouping:** Data visualizations are housed in "zones" separated by 48px gaps. Within a zone, related metrics are grouped with 16px spacing.
- **Mobile/Small Screen Reflow:** For technical reports viewed on tablets, the 12-column grid collapses to a 6-column grid, with charts stacking vertically to preserve the legibility of monospaced axis labels.

## Elevation & Depth

To maintain a "sober" and "professional" atmosphere, the design system avoids heavy shadows and skeuomorphism.

- **Tonal Layering:** Depth is created through subtle background shifts. The main canvas is White (#FFFFFF), while secondary technical panels use a Light Gray (#F4F5F7) surface.
- **Low-Contrast Outlines:** Instead of shadows, use 1px borders in Soft Gray (#DFE1E6) to define card boundaries or data clusters.
- **High-Focus Callouts:** For critical KPIs (e.g., "MM Unidades En Riesgo"), use a very soft, diffused ambient shadow (0px 4px 20px rgba(0, 0, 0, 0.05)) to lift the element slightly above the technical noise.
- **Backdrop Blurs:** Use sparingly for modal overlays during live technical demonstrations to maintain focus on the specific data point being adjusted.

## Shapes

The shape language is **geometric and precise**. 

- **Base Radius:** 4px (Soft). This provides just enough rounding to feel modern and accessible while maintaining the "hard edges" expected in engineering and financial reporting.
- **Data Points:** In scatter plots or line charts, use circular markers for "Actuals" and diamond markers for "Projected/Risk" values.
- **Interactive Elements:** Buttons and input fields use the same 4px radius. 
- **Charts:** Bar charts should have "square" tops (no rounding) to ensure the exact value at the top of the bar is visually unambiguous against the grid lines.

## Components

### Data Visualization (Core Component)
- **Grid Lines:** Always 0.5px width in Light Gray. Vertical lines are often omitted unless precise time-series tracking is required.
- **Area Fills:** Use 10% opacity of the line color (e.g., 10% Cyan fill under a Cyan trend line) to show volume without obscuring the background grid.
- **Uncertainty Bands:** Represented by a light gray shaded area around a trend line, denoting the margin of error or P10/P90 variance.

### Technical Tables
- **Header Row:** Deep Navy background with White monospaced text.
- **Striping:** Use subtle zebra-striping (F4F5F7) for rows to assist horizontal scanning of long data sets.
- **Alignment:** Numerical data must be right-aligned (using tabular figures) to allow for easy magnitude comparison.

### KPI Cards
- Large-scale numerical value in Deep Navy.
- Brief label in Grey JetBrains Mono above the value.
- A small trend indicator (up/down arrow) in Cyan or Red to indicate delta.

### Legend & Annotations
- Annotations use a 1px Cyan leader line with a small dot at the terminus to point directly to specific data anomalies.
- Legends are positioned at the bottom-center or top-right to avoid breaking the horizontal flow of the chart.