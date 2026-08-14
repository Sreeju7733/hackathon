import type { ExplanationPlan } from "./explanation";

export type YouTubeRecommendation = {
  id: string;
  title: string;
  channel: string;
  videoId?: string;
  searchQuery: string;
  url: string;
  description: string;
};

export function getYouTubeRecommendations(
  plan: ExplanationPlan | null,
  latexInput?: string,
): YouTubeRecommendation[] {
  if (!plan && !latexInput) return [];

  const formulaName = plan?.formula?.name || plan?.title || "";
  const latex = latexInput || plan?.steps[0]?.blocks.find((b) => b.type === "latex")?.content || "";
  const compact = (latex || "").toLowerCase().replace(/[\s*·×]/g, "").replace(/rho/g, "ρ");

  // 1. Newton's Second Law: F = ma
  if (/f=ma/.test(compact) || formulaName.toLowerCase().includes("newton")) {
    return [
      {
        id: "fma-1",
        title: "Newton's Second Law of Motion: F = ma",
        channel: "Khan Academy",
        videoId: "kKKM8Y-u7ds",
        searchQuery: "Newton's second law F=ma Khan Academy",
        url: "https://www.youtube.com/watch?v=kKKM8Y-u7ds",
        description: "Learn how net force, mass, and acceleration relate to each other.",
      },
      {
        id: "fma-2",
        title: "F = ma Explained Visually & Worked Examples",
        channel: "The Organic Chemistry Tutor",
        videoId: "xzG2u6jX4f8",
        searchQuery: "F=ma Organic Chemistry Tutor",
        url: "https://www.youtube.com/watch?v=xzG2u6jX4f8",
        description: "Step-by-step problem solving with Newton's second law.",
      },
      {
        id: "fma-3",
        title: "Newton's Laws: Crash Course Physics #5",
        channel: "CrashCourse",
        videoId: "NYVMlL0U100",
        searchQuery: "Newton's Second Law CrashCourse Physics",
        url: "https://www.youtube.com/watch?v=NYVMlL0U100",
        description: "High-energy conceptual breakdown of forces and acceleration.",
      },
    ];
  }

  // 2. Ohm's Law: V = IR
  if (/v=ir/.test(compact) || formulaName.toLowerCase().includes("ohm")) {
    return [
      {
        id: "vir-1",
        title: "Ohm's Law: Voltage, Current & Resistance",
        channel: "The Organic Chemistry Tutor",
        videoId: "HsLLq6Rm5tU",
        searchQuery: "Ohm's law voltage current resistance",
        url: "https://www.youtube.com/watch?v=HsLLq6Rm5tU",
        description: "Comprehensive introduction to circuits and Ohm's law equations.",
      },
      {
        id: "vir-2",
        title: "Introduction to Circuits and Ohm's Law",
        channel: "Khan Academy",
        videoId: "8jB6h2e2a8M",
        searchQuery: "Ohm's Law Khan Academy",
        url: "https://www.youtube.com/watch?v=8jB6h2e2a8M",
        description: "Intuitive explanation of charge flow, potential difference, and resistance.",
      },
    ];
  }

  // 3. Archimedes' Principle: F = ρgv
  if (/f=ρgv|f=rhogv/.test(compact) || formulaName.toLowerCase().includes("buoyant") || formulaName.toLowerCase().includes("archimedes")) {
    return [
      {
        id: "buoy-1",
        title: "Archimedes' Principle & Buoyant Force",
        channel: "The Organic Chemistry Tutor",
        videoId: "nFA8VC9_x30",
        searchQuery: "Archimedes principle buoyant force",
        url: "https://www.youtube.com/watch?v=nFA8VC9_x30",
        description: "Why objects float and how to calculate upward buoyant force.",
      },
      {
        id: "buoy-2",
        title: "Fluids & Buoyancy: Physics Explained",
        channel: "Doc Schuster",
        videoId: "eQsmq3Hu9Ha",
        searchQuery: "Buoyant force physics Doc Schuster",
        url: "https://www.youtube.com/watch?v=eQsmq3Hu9Ha",
        description: "Visual derivation of fluid pressure differences on submerged bodies.",
      },
    ];
  }

  // 4. Quadratic Functions / Parabolas: y = x^2, y = (x-h)^2 + k
  if (plan?.mode === "graph" || /x\^2|y=x|parabola|quadratic/.test(compact) || formulaName.toLowerCase().includes("parabola") || formulaName.toLowerCase().includes("quadratic")) {
    return [
      {
        id: "quad-1",
        title: "Graphing Quadratic Functions & Parabolas",
        channel: "The Organic Chemistry Tutor",
        videoId: "Hq2Up_1Ih5E",
        searchQuery: "Graphing quadratic functions parabola",
        url: "https://www.youtube.com/watch?v=Hq2Up_1Ih5E",
        description: "Master vertical & horizontal translations of parent parabola functions.",
      },
      {
        id: "quad-2",
        title: "Shifting and Scaling Parabolas",
        channel: "Khan Academy",
        videoId: "bgN091tky5s",
        searchQuery: "Parabola transformations Khan Academy",
        url: "https://www.youtube.com/watch?v=bgN091tky5s",
        description: "Visual guide to vertex form and geometric function transformations.",
      },
      {
        id: "quad-3",
        title: "Essence of Calculus: Visualizing Functions",
        channel: "3Blue1Brown",
        videoId: "WUvTyaaNkzM",
        searchQuery: "3Blue1Brown essence of calculus",
        url: "https://www.youtube.com/watch?v=WUvTyaaNkzM",
        description: "Stunning visual animation explaining rate of change in polynomials.",
      },
    ];
  }

  // 5. Dynamic Fallback for any formula or equation
  const topicQuery = formulaName || latex || "physics and math equations";
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(topicQuery + " explanation tutorial")}`;

  return [
    {
      id: "gen-1",
      title: `${topicQuery} — Full Video Tutorial`,
      channel: "Khan Academy",
      searchQuery: `${topicQuery} explanation tutorial Khan Academy`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topicQuery + " Khan Academy")}`,
      description: `Comprehensive video tutorial on ${topicQuery} with step-by-step examples.`,
    },
    {
      id: "gen-2",
      title: `Understanding ${topicQuery}: Visual Guide`,
      channel: "The Organic Chemistry Tutor",
      searchQuery: `${topicQuery} The Organic Chemistry Tutor`,
      url: searchUrl,
      description: `Detailed worked examples and problem solving for ${topicQuery}.`,
    },
    {
      id: "gen-3",
      title: `${topicQuery} Conceptual Breakdown`,
      channel: "3Blue1Brown / CrashCourse",
      searchQuery: `${topicQuery} 3Blue1Brown CrashCourse`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topicQuery + " visual explanation")}`,
      description: `Animated intuition and deep conceptual overview of ${topicQuery}.`,
    },
  ];
}
