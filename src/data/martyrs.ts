import hamidPhoto from "@/assets/martyrs/hamid-idris-awate.jpg";
import ibrahimAfaPhoto from "@/assets/martyrs/ibrahim-afa.jpg";
import abrahamTewoldePhoto from "@/assets/martyrs/abraham-tewolde.jpg";
import osmanSabbePhoto from "@/assets/martyrs/osman-saleh-sabbe.jpg";
import letebirhanHailePhoto from "@/assets/martyrs/letebirhan-haile.jpg";
import idrisMohammedPhoto from "@/assets/martyrs/idris-mohammed-adem.jpg";
import tewoldeGebremariamPhoto from "@/assets/martyrs/tewolde-gebremariam.jpg";
import woldeabWoldemariamPhoto from "@/assets/martyrs/woldeab-woldemariam.jpg";

export type Category = "ELF" | "EPLF" | "PLF" | "Civilian" | "Unknown" | "Other";
export type Status = "Deceased" | "Disappeared" | "Imprisoned" | "Alive";
export type Front = "Western Front" | "Northern Front" | "Sahel Front" | "Gash-Setit" | "Red Sea Coast" | "Central Highland" | "Diplomatic";

export interface Martyr {
  id: string;
  slug: string;
  photo_url: string;
  first_name: string;
  last_name: string;
  known_as?: string;
  date_of_birth: string;
  date_of_death: string | null;
  city: string;
  region: string;
  category: Category;
  status: Status;
  front?: Front;
  rank?: string;
  role: string;
  place_of_martyrdom?: string;
  battle?: string;
  bio: string;
  significance: string;
  quote?: string;
}

export const MARTYRS: Martyr[] = [
  {
    id: "1",
    slug: "hamid-idris-awate",
    photo_url: hamidPhoto,
    first_name: "Hamid",
    last_name: "Idris Awate",
    known_as: "Father of the Armed Struggle",
    date_of_birth: "1910-01-01",
    date_of_death: "1962-05-28",
    city: "Barka",
    region: "Gash-Barka",
    category: "ELF",
    status: "Deceased",
    front: "Gash-Setit",
    rank: "Commander",
    role: "Founder of the Eritrean Liberation Army",
    place_of_martyrdom: "Mount Adal, Gash-Barka",
    battle: "Battle of Adal",
    significance: "Fired the first shots of the Eritrean Revolution on September 1, 1961 at Mount Adal, igniting the 30-year liberation struggle.",
    bio: `Hamid Idris Awate was born around 1910 in the Barka region of western Eritrea. A former soldier in the Italian colonial army, he later became a renowned shifta (outlaw) figure who resisted both Italian and Ethiopian rule. His deep knowledge of the western lowlands and his commanding presence made him a natural leader among the oppressed communities of the Gash-Barka region.\n\nOn the night of September 1, 1961, Awate led a small band of armed fighters in an attack on an Ethiopian police station at Mount Adal, firing the first shots of what would become a thirty-year armed struggle for independence. This act of defiance marked the formal beginning of the Eritrean armed resistance and established the Eritrean Liberation Front (ELF).\n\nHe was revered as a military strategist, a father figure, and a symbol of resistance. He died on May 28, 1962 — just nine months after starting the revolution — from wounds sustained in battle. Though his time at the forefront was brief, his legacy became the cornerstone of the entire liberation movement. September 1 is now commemorated annually in Eritrea as Martyr's Day in his honor.`,
    quote: "The gun is the only language the oppressor understands.",
  },
  {
    id: "2",
    slug: "ibrahim-afa",
    photo_url: ibrahimAfaPhoto,
    first_name: "Ibrahim",
    last_name: "Afa",
    known_as: "The Architect of Nakfa",
    date_of_birth: "1945-01-01",
    date_of_death: "1985-01-22",
    city: "Keren",
    region: "Anseba",
    category: "EPLF",
    status: "Deceased",
    front: "Northern Front",
    rank: "Chief of Staff",
    role: "EPLF Chief of Staff & Military Strategist",
    place_of_martyrdom: "Nakfa Front, Sahel",
    battle: "Defence of Nakfa",
    significance: "As EPLF Chief of Staff, he was the mastermind behind the legendary defence of Nakfa — the mountain stronghold that was never captured and became the symbol of Eritrean resistance.",
    bio: `Ibrahim Afa (full name Ibrahim Mohammed Ali, known by his nom de guerre Ibrahim Afa) was one of the most brilliant military minds produced by the Eritrean liberation struggle. Born in Keren around 1945, he joined the liberation movement as a young man and rose through the ranks of the EPLF through his extraordinary strategic acumen.\n\nAs EPLF Chief of Staff, Ibrahim Afa was the principal architect of the defence of Nakfa — a mountain town in the Sahel region that became the last bastion of the EPLF during the Ethiopian strategic offensives of the late 1970s and early 1980s. Under his command, EPLF fighters repelled repeated massive Ethiopian assaults with superior tactical ingenuity, including the construction of an elaborate network of underground bunkers and trenches that made Nakfa impregnable.\n\nNakfa became not just a military fortress, but the spiritual and political capital of liberated Eritrea — even appearing on the nation's currency after independence. Ibrahim Afa died on January 22, 1985 near the Nakfa front under circumstances that remain subject to historical debate among Eritrean scholars. His tactical legacy, however, is undisputed.`,
  },
  {
    id: "3",
    slug: "abraham-tewolde",
    photo_url: abrahamTewoldePhoto,
    first_name: "Abraham",
    last_name: "Tewolde",
    known_as: "The Organiser",
    date_of_birth: "1944-01-01",
    date_of_death: "1970-01-01",
    city: "Asmara",
    region: "Maekel",
    category: "ELF",
    status: "Deceased",
    front: "Central Highland",
    rank: "Commander",
    role: "Early Military & Political Organiser",
    place_of_martyrdom: "Central Eritrean Highlands",
    significance: "A key organiser of the early PLF liberation forces, instrumental in transforming the armed resistance from a regional insurgency into a structured national liberation movement.",
    bio: `Abraham Tewolde was born in Asmara in 1944 and was among the earliest generation of educated Eritreans to abandon comfortable urban lives and join the armed struggle for independence. His intellectual background and organisational skills made him invaluable to the nascent liberation movement.\n\nOperating in the early years of the People's Liberation Forces (PLF), Abraham Tewolde worked tirelessly to unite disparate regional fighters under a coherent political and military framework. He believed deeply that the liberation of Eritrea required not only military victory but a transformation of the social and political consciousness of its people.\n\nHe was martyred in 1970 during operations in the central highlands, leaving behind a legacy of selfless commitment that inspired a generation of fighters who came after him. Colleagues remembered him as a man who led by example, refusing privileges and sharing every hardship with the fighters under his command.`,
  },
  {
    id: "4",
    slug: "osman-saleh-sabbe",
    photo_url: osmanSabbePhoto,
    first_name: "Osman",
    last_name: "Saleh Sabbe",
    known_as: "The Diplomat of the Revolution",
    date_of_birth: "1932-01-01",
    date_of_death: "1987-04-01",
    city: "Hirgigo",
    region: "Anseba",
    category: "ELF",
    status: "Deceased",
    front: "Diplomatic",
    role: "Political Leader & Diplomat",
    place_of_martyrdom: "Kuwait (exile)",
    significance: "Co-founder and key political architect of the Eritrean liberation movement, who secured crucial Arab world and international support for the cause through tireless diplomatic work over three decades.",
    bio: `Osman Saleh Sabbe was born in Hirgigo in 1932 and became one of the most pivotal political figures of the Eritrean liberation movement. A gifted orator, writer, and diplomat, he served as the foreign face of the revolution for much of its duration.\n\nOne of the founding members of the Eritrean Liberation Front in 1961, Sabbe used his connections in the Arab world to secure essential financial and material support for the liberation movement at a time when Eritrea had no formal allies. He was instrumental in opening offices of the ELF across the Middle East and representing Eritrea's cause at international forums.\n\nAfter parting ways with the ELF's military leadership in the early 1970s over disputes about ideology and strategy, Sabbe aligned with the reformist forces that eventually formed the EPLF. He continued his diplomatic work until his death in Kuwait in 1987, never seeing the independent Eritrea he had devoted his life to creating.\n\nHis writings on Eritrean nationalism and his articulation of the legal and moral basis for Eritrean self-determination remain foundational documents of the independence movement.`,
  },
  {
    id: "5",
    slug: "letebirhan-haile",
    photo_url: letebirhanHailePhoto,
    first_name: "Letebirhan",
    last_name: "Haile",
    known_as: "Embodiment of the Eritrean Woman Fighter",
    date_of_birth: "1955-01-01",
    date_of_death: "1991-01-01",
    city: "Asmara",
    region: "Maekel",
    category: "EPLF",
    status: "Deceased",
    front: "Northern Front",
    rank: "Fighter",
    role: "EPLF Fighter & Women's Movement Advocate",
    place_of_martyrdom: "Northern Sahel Front",
    significance: "One of thousands of women who comprised a full third of the EPLF's fighting forces, and a symbol of the gender revolution within the liberation movement that transformed Eritrean society.",
    bio: `Letebirhan Haile was born in Asmara in 1955 into a family that, like many urban Eritrean families, lived under the shadow of Ethiopian occupation. Despite social pressures to remain in the city, she left Asmara to join the EPLF in the field — a decision that demonstrated the burning nationalist conviction that drove thousands of Eritrean women to take up arms.\n\nWithin the EPLF, Letebirhan fought not only against Ethiopian forces but against deeply entrenched social norms. Women fighters in the EPLF were not subordinated to support roles — they served in frontline combat, as surgeons in underground hospitals, as political commissars, and as technical specialists. Letebirhan embodied this revolutionary transformation.\n\nHer story is representative of the approximately 30,000 women who served in the EPLF's military ranks — constituting nearly one third of the total fighting force — a proportion unmatched by virtually any other liberation movement in the world. She was martyred during operations on the Northern Sahel Front in 1991, just months before Eritrea's final liberation. Her memory is honoured every March 8, International Women's Day, as a symbol of the women who gave everything for their people's freedom.`,
  },
  {
    id: "6",
    slug: "idris-mohammed-adem",
    photo_url: idrisMohammedPhoto,
    first_name: "Idris",
    last_name: "Mohammed Adem",
    known_as: "The Father of Eritrean Nationalism",
    date_of_birth: "1910-01-01",
    date_of_death: "1980-01-01",
    city: "Keren",
    region: "Anseba",
    category: "ELF",
    status: "Deceased",
    front: "Diplomatic",
    role: "Political Leader & Co-Founder of the ELF",
    place_of_martyrdom: "Cairo, Egypt (exile)",
    significance: "First President of the Eritrean Liberation Front and one of the earliest and most steadfast advocates for Eritrean independence, who mobilised the diaspora and built the political foundations of the national liberation movement.",
    bio: `Idris Mohammed Adem was born in Keren around 1910 and was among the first generation of Eritreans to articulate a coherent political vision for Eritrean independence. As a political figure during the period of UN deliberations over Eritrea's fate in the late 1940s, he was a prominent voice calling for outright independence rather than federation with Ethiopia.\n\nAfter the federation was imposed and subsequently dissolved by Haile Selassie's government, Idris Mohammed Adem became one of the principal architects of the ELF. He served as the front's first chairman and worked tirelessly from exile in Cairo and other Arab capitals to build an international coalition of support for Eritrean independence.\n\nHis political philosophy was shaped by pan-Arab solidarity and Islamic values, and he was instrumental in securing early Arab League support for the Eritrean cause. He died in exile in Cairo in 1980, more than a decade before he could witness the independence he had spent his life pursuing. His political work laid the ideological foundation upon which the entire liberation movement was built.`,
  },
  {
    id: "7",
    slug: "tewolde-gebremariam",
    photo_url: tewoldeGebremariamPhoto,
    first_name: "Tewolde",
    last_name: "Gebremariam",
    known_as: "Wedi Lete",
    date_of_birth: "1950-01-01",
    date_of_death: "2017-09-01",
    city: "Mendefera",
    region: "Debub",
    category: "EPLF",
    status: "Deceased",
    front: "Northern Front",
    rank: "Colonel",
    role: "EPLF Field Commander",
    place_of_martyrdom: "Asmara (illness)",
    battle: "Operations of the Final Offensive (1988–1991)",
    significance: "A decorated field commander who participated in the decisive battles of the liberation war, including the historic Battle of Afabet in 1988, and continued to serve independent Eritrea until his death.",
    bio: `Colonel Tewolde Gebremariam, known affectionately as Wedi Lete, was born in Mendefera in 1950 and joined the EPLF at a young age, rising through the military ranks through courage and strategic ability. He was among the commanders who participated in some of the most decisive engagements of the liberation war.\n\nHis most celebrated role was in the northern theatre of operations, where he served under the most demanding conditions — the grinding trench warfare of the Sahel front, the daring surprise attacks that characterised EPLF strategy, and the final sweeping offensives of 1988–1991 that culminated in the liberation of Eritrea.\n\nHe participated in the landmark Battle of Afabet in March 1988, which military historians have described as one of the most decisive conventional battles in post-colonial African history, in which EPLF forces destroyed three Ethiopian army divisions in three days and captured enormous quantities of Soviet-supplied military equipment.\n\nAfter independence, Colonel Wedi Lete continued in service to Eritrea until his death in September 2017. He was mourned as one of the last of a generation of fighters who had devoted their entire adult lives to the liberation and then the building of their nation.`,
  },
  {
    id: "8",
    slug: "woldeab-woldemariam",
    photo_url: woldeabWoldemariamPhoto,
    first_name: "Woldeab",
    last_name: "Woldemariam",
    known_as: "The Voice of Eritrea",
    date_of_birth: "1905-04-27",
    date_of_death: "1995-05-15",
    city: "Adi Zarna",
    region: "Debub",
    category: "Civilian",
    status: "Deceased",
    front: "Diplomatic",
    role: "Intellectual, Journalist & Independence Advocate",
    place_of_martyrdom: "Asmara (natural causes, aged 90)",
    significance: "The intellectual father of the Eritrean independence movement, whose radio broadcasts from Cairo during the 1950s and 60s inspired a generation of Eritreans and whose writings established the moral and cultural foundations of Eritrean national identity.",
    bio: `Woldeab Woldemariam was born on April 27, 1905 in Adi Zarna and became the most important intellectual voice in the Eritrean struggle for independence. A teacher, journalist, and political activist, he began his public life advocating for Eritrean cultural and linguistic rights under Italian and then British colonial rule.\n\nDuring the crucial UN deliberations of the late 1940s, Woldeab was one of the most vocal advocates for Eritrean independence, facing violent opposition and surviving multiple assassination attempts — no fewer than seven — attributed to pro-Ethiopian forces. These attacks only hardened his resolve.\n\nForced into exile in Egypt in 1953, he became the voice of Radio Cairo's Eritrean programming, broadcasting in Tigrinya and Arabic to audiences across Eritrea. For a generation of Eritreans living under Ethiopian occupation, his voice was the sound of hope, resistance, and national identity. His broadcasts were so influential that Haile Selassie's government repeatedly pressured Egypt to silence him.\n\nHe lived to see Eritrea's independence in 1991, returning to Asmara as a revered elder statesman. He died on May 15, 1995 at the age of 90, having dedicated nine decades to the proposition that Eritreans were a distinct people deserving of freedom and self-determination. Eritrea's currency, the Nakfa, carries his image as a tribute to his foundational role.`,
    quote: "Our struggle is not only with weapons. It is also with the pen, with education, with the truth.",
  },
];

export const CATEGORIES: Category[] = ["ELF", "EPLF", "PLF", "Civilian", "Unknown", "Other"];
export const FRONTS: Front[] = ["Western Front", "Northern Front", "Sahel Front", "Gash-Setit", "Red Sea Coast", "Central Highland", "Diplomatic"];

export function getMartyrBySlug(slug: string): Martyr | undefined {
  return MARTYRS.find((m) => m.slug === slug);
}

export function searchMartyrs(query: string, category?: string, front?: string): Martyr[] {
  const q = query.toLowerCase().trim();
  return MARTYRS.filter((m) => {
    const matchesQuery =
      !q ||
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
      m.city.toLowerCase().includes(q) ||
      m.region.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      (m.known_as || "").toLowerCase().includes(q) ||
      (m.battle || "").toLowerCase().includes(q);
    const matchesCategory = !category || category === "All" || m.category === category;
    const matchesFront = !front || front === "All" || m.front === front;
    return matchesQuery && matchesCategory && matchesFront;
  });
}

export function formatYear(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).getFullYear().toString();
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr);
  const day = d.getDate();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  // If only year is known (Jan 1), return just the year
  if (d.getMonth() === 0 && day === 1) return d.getFullYear().toString();
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
