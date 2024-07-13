export function randomColor(items = []) {
  const colors = [
    // aqua
    "rgba(0, 255, 255, .30)",
    // fuchsia
    "rgba(255, 0, 255, .30)",
    // gray
    "rgba(128, 128, 128, .30)",
    // green
    "rgba(0, 128, 0, .30)",
    // lime
    "rgba(0, 255, 0, .30)",
    // maroon
    "rgba(128, 0, 0, .30)",
    // olive
    "rgba(128, 128, 0, .30)",
    // purple
    "rgba(128, 0, 128, .30)",
    // red
    "rgba(255, 0, 0, .30)",
    // silver
    "rgba(192, 192, 192, .30)",
    // teal
    "rgba(0, 128, 128, .30)",
    // orange
    "rgba(255, 165, 0, .30)",
    // yellow
    "rgba(255, 255, 0, .30)",
    // blue
    "rgba(0, 0, 255, .30)",
    // navy
    "rgba(0, 0, 128, .30)",
    // pink
    "rgba(255, 192, 203, .30)",
    // brown
    "rgba(165, 42, 42, .30)",
    // violet
    "rgba(238, 130, 238, .30)",
    // indigo
    "rgba(75, 0, 130, .30)",
    // cyan
    "rgba(0, 255, 255, .30)",
    // lavender
    "rgba(230, 230, 250, .30)",
    // gold
    "rgba(255, 215, 0, .30)",
    // khaki
    "rgba(240, 230, 140, .30)",
    // beige
    "rgba(245, 245, 220, .30)",
    // tan
    "rgba(210, 180, 140, .30)",
    // salmon
    "rgba(250, 128, 114, .30)",
    // coral
    "rgba(255, 127, 80, .30)",
    // tomato
    "rgba(255, 99, 71, .30)",
    // chocolate
    "rgba(210, 105, 30, .30)",
    // firebrick
    "rgba(178, 34, 34, .30)",
    // crimson
    "rgba(220, 20, 60, .30)",
    // darkred
  ];
  const selectedColors = items;
  const color = colors.find((color) => !selectedColors.includes(color));
  return color;
}
