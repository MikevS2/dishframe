function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function createRecipePlaceholderDataUrl(title: string) {
  const safeTitle = escapeXml(title || "Receptbeeld");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#efe4cf"/>
          <stop offset="100%" stop-color="#cfb28a"/>
        </linearGradient>
        <radialGradient id="plate" cx="50%" cy="48%" r="34%">
          <stop offset="0%" stop-color="#fbf8f2"/>
          <stop offset="100%" stop-color="#d9c4a1"/>
        </radialGradient>
      </defs>
      <rect width="1536" height="1024" fill="url(#bg)"/>
      <circle cx="980" cy="520" r="320" fill="url(#plate)"/>
      <circle cx="980" cy="520" r="260" fill="#f2ede3"/>
      <circle cx="930" cy="500" r="74" fill="#d58d43" opacity="0.82"/>
      <circle cx="1040" cy="560" r="78" fill="#9a7f54" opacity="0.74"/>
      <circle cx="995" cy="455" r="58" fill="#6f8c54" opacity="0.7"/>
      <circle cx="890" cy="600" r="64" fill="#c06b40" opacity="0.74"/>
      <circle cx="1082" cy="448" r="48" fill="#d8b85f" opacity="0.72"/>
      <rect x="120" y="220" width="520" height="6" rx="3" fill="#53412d"/>
      <text x="120" y="180" fill="#3d3123" font-size="64" font-family="Georgia, serif" font-weight="700">${safeTitle}</text>
      <text x="120" y="820" fill="#5f4d39" font-size="34" font-family="Trebuchet MS, sans-serif">Voeg je OpenAI API-sleutel toe voor een automatisch gegenereerde gerechtfoto.</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
