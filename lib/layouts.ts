import type { RecipeColorThemeId, RecipeLayoutId } from "@/lib/types";

export interface LayoutTheme {
  id: RecipeColorThemeId;
  name: string;
  accent: string;
  accentSoft: string;
  paper: string;
  rule: string;
  tag: string;
}

export interface LayoutOption {
  id: RecipeLayoutId;
  name: string;
  tagline: string;
  premium: boolean;
  defaultThemeId: RecipeColorThemeId;
  themes: LayoutTheme[];
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    id: "atelier",
    name: "Atelier",
    tagline: "Warm, stijlvol en vertrouwd",
    premium: false,
    defaultThemeId: "classic",
    themes: [
      {
        id: "classic",
        name: "Klassiek",
        accent: "#d58d43",
        accentSoft: "rgba(238, 194, 110, 0.48)",
        paper: "#f8f2e5",
        rule: "linear-gradient(90deg, #d58d43, rgba(76, 56, 33, 0.85))",
        tag: "#98622d"
      },
      {
        id: "sage",
        name: "Salie",
        accent: "#8ea381",
        accentSoft: "rgba(197, 212, 187, 0.42)",
        paper: "#f3f1e8",
        rule: "linear-gradient(90deg, #8ea381, rgba(76, 56, 33, 0.72))",
        tag: "#66785d"
      }
    ]
  },
  {
    id: "linnen",
    name: "Linnen",
    tagline: "Licht, rustig en verfijnd",
    premium: true,
    defaultThemeId: "sage",
    themes: [
      {
        id: "sage",
        name: "Salie",
        accent: "#8fa88f",
        accentSoft: "rgba(198, 214, 197, 0.3)",
        paper: "#f6f4ed",
        rule: "linear-gradient(90deg, #8fa88f, rgba(76, 56, 33, 0.5))",
        tag: "#6d816d"
      },
      {
        id: "sand",
        name: "Zand",
        accent: "#b99a6f",
        accentSoft: "rgba(223, 205, 177, 0.34)",
        paper: "#f8f3ea",
        rule: "linear-gradient(90deg, #b99a6f, rgba(76, 56, 33, 0.48))",
        tag: "#896c45"
      }
    ]
  },
  {
    id: "maison",
    name: "Maison",
    tagline: "Rijk, elegant en luxe",
    premium: true,
    defaultThemeId: "gold",
    themes: [
      {
        id: "gold",
        name: "Goud",
        accent: "#b98942",
        accentSoft: "rgba(228, 202, 147, 0.38)",
        paper: "#fbf5ea",
        rule: "linear-gradient(90deg, #b98942, rgba(92, 61, 24, 0.72))",
        tag: "#8c6431"
      },
      {
        id: "ink",
        name: "Inkt",
        accent: "#4e5966",
        accentSoft: "rgba(176, 186, 198, 0.32)",
        paper: "#f6f2ee",
        rule: "linear-gradient(90deg, #4e5966, rgba(62, 46, 30, 0.62))",
        tag: "#3d4957"
      }
    ]
  },
  {
    id: "signature",
    name: "Signature",
    tagline: "Chic, krachtig en modern",
    premium: true,
    defaultThemeId: "cocoa",
    themes: [
      {
        id: "cocoa",
        name: "Cacao",
        accent: "#8e6249",
        accentSoft: "rgba(201, 164, 138, 0.3)",
        paper: "#f3ece5",
        rule: "linear-gradient(90deg, #8e6249, rgba(51, 35, 24, 0.6))",
        tag: "#6c4732"
      },
      {
        id: "charcoal",
        name: "Charcoal",
        accent: "#5f5a66",
        accentSoft: "rgba(181, 176, 188, 0.32)",
        paper: "#f0edf1",
        rule: "linear-gradient(90deg, #5f5a66, rgba(51, 35, 24, 0.52))",
        tag: "#4f4a55"
      }
    ]
  },
  {
    id: "journal",
    name: "Journal",
    tagline: "Luchtig, editorial en verfijnd",
    premium: true,
    defaultThemeId: "mist",
    themes: [
      {
        id: "mist",
        name: "Mist",
        accent: "#7f8e9d",
        accentSoft: "rgba(197, 209, 219, 0.24)",
        paper: "#f4f4f0",
        rule: "linear-gradient(90deg, #7f8e9d, rgba(62, 55, 44, 0.4))",
        tag: "#607283"
      },
      {
        id: "olive",
        name: "Olijf",
        accent: "#8d9670",
        accentSoft: "rgba(206, 212, 186, 0.28)",
        paper: "#f6f5ef",
        rule: "linear-gradient(90deg, #8d9670, rgba(62, 55, 44, 0.38))",
        tag: "#6e7657"
      }
    ]
  },
  {
    id: "salon",
    name: "Salon",
    tagline: "Zacht, klassiek en uitnodigend",
    premium: true,
    defaultThemeId: "rose",
    themes: [
      {
        id: "rose",
        name: "Roos",
        accent: "#b48772",
        accentSoft: "rgba(221, 195, 182, 0.28)",
        paper: "#f8f1ec",
        rule: "linear-gradient(90deg, #b48772, rgba(85, 58, 42, 0.56))",
        tag: "#9c7264"
      },
      {
        id: "cream",
        name: "Cream",
        accent: "#c7a77b",
        accentSoft: "rgba(232, 214, 190, 0.32)",
        paper: "#fbf6ef",
        rule: "linear-gradient(90deg, #c7a77b, rgba(85, 58, 42, 0.5))",
        tag: "#a18259"
      }
    ]
  },
  {
    id: "terracotta",
    name: "Terracotta",
    tagline: "Aards, warm en uitgesproken",
    premium: true,
    defaultThemeId: "terra",
    themes: [
      {
        id: "terra",
        name: "Terra",
        accent: "#b56742",
        accentSoft: "rgba(214, 152, 121, 0.32)",
        paper: "#f5e9e2",
        rule: "linear-gradient(90deg, #b56742, rgba(92, 50, 29, 0.66))",
        tag: "#9d5836"
      },
      {
        id: "sunset",
        name: "Sunset",
        accent: "#cb7b4e",
        accentSoft: "rgba(230, 178, 147, 0.3)",
        paper: "#f8eee7",
        rule: "linear-gradient(90deg, #cb7b4e, rgba(92, 50, 29, 0.58))",
        tag: "#aa643e"
      }
    ]
  }
];

export function getLayoutById(layoutId: RecipeLayoutId) {
  return LAYOUT_OPTIONS.find((layout) => layout.id === layoutId) ?? LAYOUT_OPTIONS[0];
}

export function getLayoutTheme(layoutId: RecipeLayoutId, themeId?: RecipeColorThemeId) {
  const layout = getLayoutById(layoutId);
  return (
    layout.themes.find((theme) => theme.id === themeId) ??
    layout.themes.find((theme) => theme.id === layout.defaultThemeId) ??
    layout.themes[0]
  );
}
