import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clubsPath = path.resolve(__dirname, '../src/data/clubs.json');
const threeClubsPath = path.resolve(__dirname, '../src/data/threeClubsQuestions.json');

const clubs: any[] = JSON.parse(fs.readFileSync(clubsPath, 'utf8'));
const validClubIds = new Set(clubs.map((c) => c.id));

const questions: any[] = JSON.parse(fs.readFileSync(threeClubsPath, 'utf8'));
const existingAnswers = new Set(questions.map((q) => q.correctAnswer.toLowerCase().trim()));

const newBatch = [
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["monaco", "marseille", "chelsea"],
    correctAnswer: "Michy Batshuayi",
    options: ["Michy Batshuayi", "Loïc Rémy", "Didier Drogba", "George Weah"],
    hints: [
      "Belgian international striker known for clinical finishing off the bench.",
      "Scored the Premier League title-winning goal for Chelsea at West Brom in May 2017.",
      "Had loan spells across Europe including Monaco and Borussia Dortmund."
    ],
    playerClubStints: { "marseille": "2014–2016", "chelsea": "2016–2022", "monaco": "2019" },
    explanation: "Batshuayi scored 26 Ligue 1 goals for Marseille before joining Chelsea for £33m in 2016 and playing on loan for Monaco in 2019."
  },
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["lille", "wolfsburg", "napoli"],
    correctAnswer: "Victor Osimhen",
    options: ["Victor Osimhen", "Dries Mertens", "Edinson Cavani", "Arkadiusz Milik"],
    hints: [
      "Nigerian center-forward who wears a protective black carbon-fiber face mask.",
      "Started his European career in Germany before a breakout season in Ligue 1.",
      "Capocannoniere top scorer when his side won their first Serie A title in 33 years in 2022–23."
    ],
    playerClubStints: { "wolfsburg": "2017–2019", "lille": "2019–2020", "napoli": "2020–present" },
    explanation: "Osimhen broke through in Europe at Wolfsburg, scored 18 goals for Lille, and led Napoli to the 2023 Scudetto with 26 league goals."
  },
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["atalanta", "valencia", "roma"],
    correctAnswer: "Alessandro Florenzi",
    options: ["Alessandro Florenzi", "Cristiano Piccini", "Leonardo Spinazzola", "Davide Zappacosta"],
    hints: [
      "Italian right-back / wing-back who won UEFA Euro 2020 with the Azzurri.",
      "Long-serving Roman midfielder/defender who scored from the halfway line against Barcelona.",
      "Spent loan periods at Valencia and PSG before winning Serie A with AC Milan."
    ],
    playerClubStints: { "roma": "2011–2022", "valencia": "2020", "atalanta": "2019–2020" },
    explanation: "Florenzi graduated from Roma's academy, spent a brief loan at Valencia in 2020, and was on loan across top European clubs."
  },
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["leeds", "barcelona", "sporting-cp"],
    correctAnswer: "Raphinha",
    options: ["Raphinha", "Trincão", "Adama Traoré", "Malcom"],
    hints: [
      "Brazilian winger with explosive acceleration and left-footed curled strikes.",
      "Formed a formidable partnership with Marcelo Bielsa at Elland Road.",
      "Developed in Portugal before a £55m blockbuster switch to Catalonia in 2022."
    ],
    playerClubStints: { "sporting-cp": "2018–2019", "leeds": "2020–2022", "barcelona": "2022–present" },
    explanation: "Raphinha starred for Sporting CP, became a Premier League sensation with Leeds, and earned a direct transfer to Barcelona."
  },
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["everton", "psg", "roma"],
    correctAnswer: "Lucas Digne",
    options: ["Lucas Digne", "Idrissa Gueye", "Moise Kean", "Marquinhos"],
    hints: [
      "French left-back known for elite crossing delivery and curling free-kicks.",
      "Part of PSG's early domestic dominance before playing on loan in Serie A.",
      "Was voted Everton Player of the Season in 2018–19 before joining Aston Villa."
    ],
    playerClubStints: { "psg": "2013–2016", "roma": "2015–2016", "everton": "2018–2022" },
    explanation: "Digne won two Ligue 1 titles with PSG, spent 2015–16 on loan at Roma, and made 113 appearances for Everton."
  },
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["rennes", "dortmund", "barcelona"],
    correctAnswer: "Ousmane Dembélé",
    options: ["Ousmane Dembélé", "Pierre-Emerick Aubameyang", "Raphaël Guerreiro", "Mikaël Silvestre"],
    hints: [
      "Two-footed ambidextrous winger who won the 2018 FIFA World Cup with France.",
      "Won the Bundesliga Rookie of the Year in 2016–17 with 10 goals and 21 assists.",
      "Transferred for an initial €105m fee to replace Neymar at Camp Nou in 2017."
    ],
    playerClubStints: { "rennes": "2015–2016", "dortmund": "2016–2017", "barcelona": "2017–2023" },
    explanation: "Dembélé emerged from Rennes' academy, dazzled for a season in Dortmund, and won three La Liga titles with Barcelona."
  },
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["fiorentina", "juventus", "roma"],
    correctAnswer: "Federico Bernardeschi",
    options: ["Federico Bernardeschi", "Federico Chiesa", "Juan Cuadrado", "Miralem Pjanić"],
    hints: [
      "Versatile Italian attacker who scored in the penalty shootout of the Euro 2020 final.",
      "Inherited the prestigious number 10 shirt at Artemio Franchi.",
      "Won three consecutive Serie A titles with Juventus between 2018 and 2020."
    ],
    playerClubStints: { "fiorentina": "2014–2017", "juventus": "2017–2022", "roma": "2013–2014" },
    explanation: "Bernardeschi developed in Fiorentina's ranks before joining Juventus for €40m in 2017, later moving to MLS."
  },
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["brighton", "liverpool", "chelsea"],
    correctAnswer: "Moisés Caicedo",
    options: ["Moisés Caicedo", "Alexis Mac Allister", "Adam Lallana", "Christian Benteke"],
    hints: [
      "Ecuadorian defensive midfielder who became the subject of a British-record transfer tug-of-war.",
      "Liverpool agreed a £111m fee with Brighton in August 2023 before Chelsea secured him for £115m.",
      "Formed an elite midfield double-pivot at Stamford Bridge under Enzo Maresca."
    ],
    playerClubStints: { "brighton": "2021–2023", "chelsea": "2023–present", "liverpool": "bid accepted 2023" },
    explanation: "Caicedo was a Brighton revelation and completed a historic £115m move to Chelsea in 2023 after Liverpool's record bid."
  },
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["swansea-city", "marseille", "west-ham"],
    correctAnswer: "André Ayew",
    options: ["André Ayew", "Jordan Ayew", "Bafétimbi Gomis", "Dimitri Payet"],
    hints: [
      "Ghanaian national team captain and son of African legend Abedi Pele.",
      "Won the Trophée des Champions twice with OM before moving to South Wales in 2015.",
      "Became West Ham's club-record signing in August 2016 for £20.5m."
    ],
    playerClubStints: { "marseille": "2007–2015", "swansea-city": "2015–2016 & 2018–2021", "west-ham": "2016–2018" },
    explanation: "André Ayew scored 60 goals for Marseille, hit double figures on his debut season for Swansea, and spent two years at West Ham."
  },
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["stuttgart", "bayern-munich", "inter-milan"],
    correctAnswer: "Benjamin Pavard",
    options: ["Benjamin Pavard", "Lucio", "Jürgen Klinsmann", "Xherdan Shaqiri"],
    hints: [
      "French defender capable of playing center-back or right-back.",
      "Scored the FIFA World Cup Goal of the Tournament in 2018 with a swerving volley against Argentina.",
      "Won the Champions League and Bundesliga treble in 2020 before winning Serie A in 2024."
    ],
    playerClubStints: { "stuttgart": "2016–2019", "bayern-munich": "2019–2023", "inter-milan": "2023–present" },
    explanation: "Pavard helped Stuttgart gain promotion, joined Bayern for €35m in 2019, and moved to Inter Milan where he won the 2023–24 Scudetto."
  },
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["newcastle", "psg", "crystal-palace"],
    correctAnswer: "Yohan Cabaye",
    options: ["Yohan Cabaye", "Moussa Sissoko", "Hatem Ben Arfa", "Rémy Cabella"],
    hints: [
      "French deep-lying playmaker renowned for sublime passing range and dead-ball delivery.",
      "Formed an iconic Newcastle midfield alongside Cheick Tioté under Alan Pardew.",
      "Reunited with Alan Pardew at Selhurst Park in 2015 after winning Ligue 1 with PSG."
    ],
    playerClubStints: { "newcastle": "2011–2014", "psg": "2014–2015", "crystal-palace": "2015–2018" },
    explanation: "Cabaye made 93 appearances for Newcastle, won back-to-back Ligue 1 titles with PSG, and spent three seasons at Crystal Palace."
  },
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["sevilla", "monaco", "inter-milan"],
    correctAnswer: "Stevan Jovetić",
    options: ["Stevan Jovetić", "Geoffrey Kondogbia", "Keita Baldé", "Wissam Ben Yedder"],
    hints: [
      "Montenegrin forward who is one of only two players in modern history to score in all top five European leagues.",
      "Played for Fiorentina and Manchester City before joining Serie A giants on loan in 2015.",
      "Scored against Real Madrid in La Liga to end their 40-match unbeaten run in 2017."
    ],
    playerClubStints: { "inter-milan": "2015–2017", "sevilla": "2017", "monaco": "2017–2021" },
    explanation: "Jovetić played for Inter Milan, enjoyed an impactful loan at Sevilla in 2017, and scored 21 goals across 77 games for AS Monaco."
  },
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["leicester", "chelsea", "arsenal"],
    correctAnswer: "David Luiz",
    options: ["Willian", "Petr Čech", "Raheem Sterling", "Jorginho"],
    hints: [
      "Brazilian center-back known for flamboyant free-kicks and expansive passing.",
      "Won the Champions League, Premier League, and two Europa League titles at Stamford Bridge.",
      "Spent two seasons in North London under Mikel Arteta, winning the 2020 FA Cup."
    ],
    playerClubStints: { "chelsea": "2011–2014 & 2016–2019", "arsenal": "2019–2021", "psg": "2014–2016" },
    explanation: "David Luiz won every major European and domestic honour with Chelsea before moving across London to Arsenal in 2019."
  },
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["ajax", "roma", "juventus"],
    correctAnswer: "Maarten Stekelenburg",
    options: ["Maarten Stekelenburg", "Edwin van der Sar", "Edgar Davids", "Zlatan Ibrahimović"],
    hints: [
      "Dutch goalkeeper who started in the 2010 FIFA World Cup Final in Johannesburg.",
      "Made over 200 appearances for Ajax before completing a €6.3m move to the Italian capital in 2011.",
      "Returned to Amsterdam in 2020 to win two further Eredivisie titles before retiring."
    ],
    playerClubStints: { "ajax": "2002–2011 & 2020–2023", "roma": "2011–2013", "fulham": "2013–2017" },
    explanation: "Stekelenburg was Ajax's long-time keeper, was signed by Luis Enrique at Roma in 2011, and had stints in England and France."
  },
  {
    question: "Which player represented all three of these clubs?",
    clubs: ["porto", "monaco", "real-madrid"],
    correctAnswer: "James Rodríguez",
    options: ["James Rodríguez", "Radamel Falcao", "Ricardo Carvalho", "João Moutinho"],
    hints: [
      "Left-footed Colombian playmaker who won the Golden Boot at the 2014 FIFA World Cup.",
      "Formed an electric trio with Falcao and Hulk at Porto, winning the 2010–11 Europa League.",
      "Transferred to the Bernabéu for €75m in the summer of 2014, wearing number 10."
    ],
    playerClubStints: { "porto": "2010–2013", "monaco": "2013–2014", "real-madrid": "2014–2020" },
    explanation: "James won three Portuguese titles with Porto, led Ligue 1 in assists at Monaco, and won two Champions League trophies at Real Madrid."
  }
];

let added = 0;
for (const q of newBatch) {
  const norm = q.correctAnswer.toLowerCase().trim();
  if (!existingAnswers.has(norm)) {
    existingAnswers.add(norm);
    questions.push({
      id: `tc-${questions.length + 1}`,
      mode: "three-clubs",
      difficulty: "expert",
      category: "Three Clubs",
      ...q
    });
    added++;
  }
}

fs.writeFileSync(threeClubsPath, JSON.stringify(questions, null, 2), 'utf8');
console.log(`Added ${added} new questions. Total threeClubsQuestions: ${questions.length}`);
