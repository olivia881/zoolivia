/**
 * Dati ufficiali CCNL Lavoro Domestico - livelli, inquadramento e mansioni.
 * Fonte: contrattiCCNL.it, Patronato ACLi, testo CCNL.
 */

const LEVEL_DEFINITIONS = {
  A: {
    inquadramento: "Addetto/a a mansioni esecutive (livello base, non addetto all'assistenza di persone)",
    mansioniIntro: "La lavoratrice/lavoratore svolgerà mansioni a livello esecutivo, sotto il diretto controllo del datore di lavoro, relative ai profili indicati dal CCNL:",
    mansioni: [
      "pulizia della casa",
      "lavanderia",
      "supporto in cucina (aiuto di cucina)",
      "cura di animali domestici",
      "pulizia e annaffiatura aree verdi",
      "mansioni manuali di pulizia e piccola manutenzione",
    ],
    esclusioni: [
      "prestazioni di natura sanitaria o infermieristica",
      "assistenza diretta alla persona",
    ],
  },
  AS: {
    inquadramento: "Addetto alla compagnia (livello A Super)",
    mansioniIntro: "La lavoratrice/lavoratore svolgerà esclusivamente mansioni di mera compagnia a persone adulte autosufficienti, senza effettuare altre prestazioni di lavoro.",
    mansioni: [
      "compagnia a persone adulte autosufficienti",
    ],
    esclusioni: [
      "prestazioni di natura sanitaria o infermieristica",
      "assistenza a persone non autosufficienti",
    ],
  },
  B: {
    inquadramento: "Collaboratore familiare polifunzionale (livello esecutivo con competenza specifica)",
    mansioniIntro: "La lavoratrice/lavoratore svolgerà con competenza le plurime incombenze relative al normale andamento della vita familiare, nell'ambito del livello di appartenenza:",
    mansioni: [
      "pulizia e riassetto della casa",
      "addetto alla cucina",
      "lavanderia",
      "assistenza ad animali domestici",
      "altri compiti nell'ambito del livello",
    ],
    esclusioni: [
      "prestazioni di natura sanitaria o infermieristica",
      "assistenza specialistica a persone non autosufficienti",
    ],
  },
  BS: {
    inquadramento: "Assistente a persone autosufficienti / Baby sitter (livello B Super)",
    mansioniIntro: "La lavoratrice/lavoratore svolgerà attività di assistenza alla persona e di supporto domestico non sanitario, in particolare:",
    mansioni: [
      "assistenza a persone autosufficienti o a bambini (baby sitter)",
      "supporto alla mobilità leggera",
      "aiuto nella vestizione e cura personale di base",
      "preparazione dei pasti",
      "compagnia e sorveglianza",
      "pulizia ordinaria degli ambienti",
      "lavaggio e gestione della biancheria",
      "piccole commissioni quotidiane",
    ],
    esclusioni: [
      "prestazioni di natura sanitaria o infermieristica",
      "somministrazione di farmaci invasivi",
      "movimentazioni complesse o assistenza specialistica",
    ],
  },
  C: {
    inquadramento: "Cuoco (livello C - con autonomia e responsabilità)",
    mansioniIntro: "La lavoratrice/lavoratore, in possesso di specifiche conoscenze di base teoriche e tecniche, opererà con totale autonomia e responsabilità, svolgendo:",
    mansioni: [
      "preparazione dei pasti",
      "connessi compiti di cucina",
      "approvvigionamento delle materie prime",
    ],
    esclusioni: [
      "prestazioni di natura sanitaria o infermieristica",
    ],
  },
  CS: {
    inquadramento: "Assistente a persone non autosufficienti (livello C Super - badante non formato)",
    mansioniIntro: "La lavoratrice/lavoratore svolgerà attività di assistenza a persone non autosufficienti, ivi comprese le attività connesse alle esigenze del vitto e della pulizia della casa ove vivono gli assistiti:",
    mansioni: [
      "assistenza a persone non autosufficienti",
      "supporto alla mobilità",
      "aiuto nella vestizione e cura personale",
      "preparazione dei pasti",
      "compagnia e sorveglianza",
      "pulizia ordinaria degli ambienti",
      "lavaggio e gestione della biancheria",
      "piccole commissioni quotidiane",
    ],
    esclusioni: [
      "prestazioni di natura sanitaria o infermieristica",
      "somministrazione di farmaci invasivi",
      "movimentazioni complesse o assistenza specialistica",
    ],
  },
  D: {
    inquadramento: "Governante o profilo di coordinamento (livello D)",
    mansioniIntro: "La lavoratrice/lavoratore, in possesso dei necessari requisiti professionali, svolgerà mansioni di coordinamento relative a:",
    mansioni: [
      "attività di cameriere di camera",
      "stireria",
      "lavanderia e guardaroba",
      "coordinamento del personale domestico",
    ],
    esclusioni: [
      "prestazioni di natura sanitaria o infermieristica",
    ],
  },
  DS: {
    inquadramento: "Direttore di casa / Assistente a persone non autosufficienti formato (livello D Super)",
    mansioniIntro: "La lavoratrice/lavoratore svolgerà mansioni di gestione e di coordinamento relative a tutte le esigenze connesse all'andamento della casa, ovvero assistenza a persone non autosufficienti in possesso di formazione specifica:",
    mansioni: [
      "gestione e coordinamento dell'andamento della casa",
      "assistenza a persone non autosufficienti (con formazione)",
      "supporto alla mobilità e cura personale",
      "preparazione dei pasti",
      "compagnia e sorveglianza",
      "pulizia e gestione domestica",
    ],
    esclusioni: [
      "prestazioni di natura sanitaria o infermieristica",
      "somministrazione di farmaci invasivi",
    ],
  },
};

function getLevelDefinition(level) {
  return LEVEL_DEFINITIONS[level] || LEVEL_DEFINITIONS.BS;
}

export function getInquadramentoText(level) {
  const def = getLevelDefinition(level);
  return def.inquadramento;
}

export function getMansioniForContract(level) {
  const def = getLevelDefinition(level);
  const bulletMansioni = def.mansioni.map((m) => `- ${m}`).join("\n");
  const bulletEsclusioni = def.esclusioni.map((e) => `- ${e}`).join("\n");
  return {
    intro: def.mansioniIntro,
    mansioni: bulletMansioni,
    esclusioni: bulletEsclusioni,
  };
}
